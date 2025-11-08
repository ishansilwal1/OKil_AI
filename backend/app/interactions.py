from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy import cast, Date as SA_Date, Time as SA_Time, or_, and_

from .db import get_db
from . import models
from .auth import get_current_user
from .schemas import (
    LawyerOut,
    AppointmentCreate,
    AppointmentOut,
    AppointmentUpdate,
    QueryCreate,
    QueryUpdate,
    QueryOut,
    AvailabilitySlotCreate,
    AvailabilitySlotOut,
)

router = APIRouter()


@router.get("/lawyers", response_model=List[LawyerOut])
def list_lawyers(db: Session = Depends(get_db)):
    lawyers = db.query(models.User).filter(models.User.role == 'lawyer').all()
    # Return only selected fields
    return [
        LawyerOut(
            id=l.id,
            name=l.name,
            username=l.username,
            email=l.email,
            barCouncilNumber=l.barCouncilNumber,
        ) for l in lawyers
    ]


@router.post("/appointments", response_model=AppointmentOut)
def create_appointment(
    req: AppointmentCreate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate target lawyer
    lawyer = db.query(models.User).filter(models.User.id == req.lawyer_id, models.User.role == 'lawyer').first()
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")

    # If a slot is chosen, validate and book it
    preferred_at = req.preferred_at
    if req.slot_id is not None:
        slot = db.query(models.AvailabilitySlot).filter(
            models.AvailabilitySlot.id == req.slot_id,
            models.AvailabilitySlot.lawyer_id == req.lawyer_id
        ).first()
        if not slot:
            raise HTTPException(status_code=404, detail="Availability slot not found")
        if slot.is_booked:
            raise HTTPException(status_code=409, detail="This slot has already been booked")
        preferred_at = slot.start_at

    # Optional: basic conflict check (lawyer has another appointment at the same time)
    # Determine date/time values for DB
    appt_date = None
    appt_time = None
    if preferred_at is not None:
        appt_date = preferred_at.date()
        appt_time = preferred_at.time()
    elif req.date is not None and req.time is not None:
        appt_date = req.date
        appt_time = req.time

    # Basic conflict check
    if appt_date is not None and appt_time is not None:
        # Cast DB columns to DATE/TIME explicitly to avoid varchar vs date/time mismatches
        conflict = db.query(models.Appointment).filter(
            models.Appointment.lawyer_id == req.lawyer_id,
            cast(models.Appointment.date, SA_Date) == appt_date,
            cast(models.Appointment.time, SA_Time) == appt_time,
            models.Appointment.status.in_(['pending', 'approved', 'completed', 'rescheduled'])
        ).first()
        if conflict:
            raise HTTPException(status_code=409, detail="Lawyer is not available at the selected time")

    # Create appointment
    appt = models.Appointment(
        user_id=current['id'],
        lawyer_id=req.lawyer_id,
        date=appt_date,
        time=appt_time,
        description=req.message,
        status='pending'
    )
    db.add(appt)

    # Mark slot as booked if used
    if req.slot_id is not None:
        slot.is_booked = True
        db.add(slot)

    db.commit()
    db.refresh(appt)
    return appt


@router.get("/appointments", response_model=List[AppointmentOut])
def list_appointments(
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current['role'] == 'lawyer':
        q = db.query(models.Appointment).filter(models.Appointment.lawyer_id == current['id'])
    else:
        q = db.query(models.Appointment).filter(models.Appointment.user_id == current['id'])
    return q.order_by(models.Appointment.created_at.desc()).all()


@router.patch("/appointments/{appointment_id}", response_model=AppointmentOut)
def update_appointment(
    appointment_id: int,
    req: AppointmentUpdate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Authorization: lawyer owning it or the user who created it can modify
    if appt.lawyer_id != current['id'] and appt.user_id != current['id']:
        raise HTTPException(status_code=403, detail="Not authorized to modify this appointment")

    # Status update
    if req.status:
        valid_status = {'pending','approved','rejected','cancelled','completed'}
        if req.status not in valid_status:
            raise HTTPException(status_code=400, detail="Invalid status value")
        # Only lawyer may approve or reject; user may cancel their own
        if req.status in {'approved','rejected'} and current['role'] != 'lawyer':
            raise HTTPException(status_code=403, detail="Only lawyer can set this status")
        if req.status == 'cancelled' and current['id'] not in {appt.user_id, appt.lawyer_id}:
            raise HTTPException(status_code=403, detail="Not authorized to cancel")
        appt.status = req.status

        # If a future appointment is cancelled, free the associated availability slot (if any)
        if req.status == 'cancelled' and appt.date and appt.time:
            try:
                appt_dt_naive = datetime.combine(appt.date, appt.time)
                # Store appointment date/time were taken from slot.start_at (UTC), so treat as UTC
                appt_dt_utc = appt_dt_naive.replace(tzinfo=timezone.utc)
            except Exception:
                appt_dt_utc = None
            now_utc = datetime.now(timezone.utc)
            # Find exact slot at that UTC datetime OR match by date/time casts (timezone-agnostic)
            slot = None
            if appt_dt_utc:
                slot = db.query(models.AvailabilitySlot).filter(
                    models.AvailabilitySlot.lawyer_id == appt.lawyer_id,
                    models.AvailabilitySlot.is_booked == True,  # noqa: E712
                    or_(
                        models.AvailabilitySlot.start_at == appt_dt_utc,
                        and_(
                            cast(models.AvailabilitySlot.start_at, SA_Date) == appt.date,
                            cast(models.AvailabilitySlot.start_at, SA_Time) == appt.time,
                        ),
                    ),
                ).order_by(models.AvailabilitySlot.start_at.desc()).first()
                # As a final fallback, try a small tolerance window (±5 minutes)
                if not slot:
                    start_min = appt_dt_utc - timedelta(minutes=5)
                    start_max = appt_dt_utc + timedelta(minutes=5)
                    slot = db.query(models.AvailabilitySlot).filter(
                        models.AvailabilitySlot.lawyer_id == appt.lawyer_id,
                        models.AvailabilitySlot.is_booked == True,  # noqa: E712
                        models.AvailabilitySlot.start_at >= start_min,
                        models.AvailabilitySlot.start_at <= start_max,
                    ).order_by(models.AvailabilitySlot.start_at.asc()).first()
            # If we still didn't find by datetime, try purely by date/time casts
            if not slot:
                slot = db.query(models.AvailabilitySlot).filter(
                    models.AvailabilitySlot.lawyer_id == appt.lawyer_id,
                    models.AvailabilitySlot.is_booked == True,  # noqa: E712
                    cast(models.AvailabilitySlot.start_at, SA_Date) == appt.date,
                    cast(models.AvailabilitySlot.start_at, SA_Time) == appt.time,
                ).order_by(models.AvailabilitySlot.start_at.desc()).first()

            if slot and slot.start_at > now_utc:
                slot.is_booked = False
                db.add(slot)

    # Reschedule logic (lawyer only)
    if (req.date and req.time) or req.slot_id is not None:
        if current['role'] != 'lawyer':
            raise HTTPException(status_code=403, detail="Only lawyer can reschedule")
        if appt.status in ['cancelled','rejected']:
            raise HTTPException(status_code=400, detail="Cannot reschedule a cancelled/rejected appointment")

        # Track previous time to annotate description
        prev_date, prev_time = appt.date, appt.time

        # Use slot_id if provided
        if req.slot_id is not None:
            slot = db.query(models.AvailabilitySlot).filter(
                models.AvailabilitySlot.id == req.slot_id,
                models.AvailabilitySlot.lawyer_id == appt.lawyer_id
            ).first()
            if not slot:
                raise HTTPException(status_code=404, detail="Availability slot not found")
            if slot.is_booked:
                raise HTTPException(status_code=409, detail="Slot already booked")
            # Free previous slot? Only if it matched exactly a previous slot (skipped for simplicity)
            appt.date = slot.start_at.date()
            appt.time = slot.start_at.time()
            slot.is_booked = True
            db.add(slot)
        else:
            # Reschedule by date/time given
            # Conflict check with existing appointments for this lawyer
            conflict = db.query(models.Appointment).filter(
                models.Appointment.lawyer_id == appt.lawyer_id,
                cast(models.Appointment.date, SA_Date) == req.date,
                cast(models.Appointment.time, SA_Time) == req.time,
                models.Appointment.id != appt.id,
                models.Appointment.status.in_(['pending','approved','completed','rescheduled'])
            ).first()
            if conflict:
                raise HTTPException(status_code=409, detail="Lawyer busy at chosen time")
            appt.date = req.date
            appt.time = req.time

        # When rescheduling, set status to 'rescheduled' unless explicitly provided
        if not req.status:
            appt.status = 'rescheduled'

        # Annotate description with previous time info (persisted in DB)
        if prev_date and prev_time:
            try:
                prev_label = f"{prev_date.isoformat()} {prev_time.isoformat(timespec='minutes')}"
            except Exception:
                prev_label = f"{prev_date} {prev_time}"
            note = f" (Rescheduled from {prev_label})"
            appt.description = (appt.description or '') + note

    db.add(appt)
    db.commit()
    db.refresh(appt)
    return appt


@router.post("/queries", response_model=QueryOut)
def create_query(
    req: QueryCreate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # If lawyer_id provided, ensure it's a valid lawyer
    if req.lawyer_id:
        lawyer = db.query(models.User).filter(models.User.id == req.lawyer_id, models.User.role == 'lawyer').first()
        if not lawyer:
            raise HTTPException(status_code=404, detail="Lawyer not found")

    q = models.Query(
        user_id=current['id'],
        lawyer_id=req.lawyer_id,
        subject=req.title,
        description=req.content,
        status='open'
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


@router.get("/queries", response_model=List[QueryOut])
def list_queries(
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current['role'] == 'lawyer':
        # For lawyers, show both assigned to me and unassigned
        q = db.query(models.Query).filter(
            (models.Query.lawyer_id == current['id']) | (models.Query.lawyer_id.is_(None))
        )
    else:
        q = db.query(models.Query).filter(models.Query.user_id == current['id'])
    return q.order_by(models.Query.created_at.desc()).all()


@router.patch("/queries/{query_id}", response_model=QueryOut)
def update_query(
    query_id: int,
    req: QueryUpdate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(models.Query).filter(models.Query.id == query_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Query not found")

    # Allow user or assigned lawyer to modify; specific status transitions restricted
    is_participant = current['id'] in {q.user_id, q.lawyer_id or -1}
    if not is_participant and current['role'] != 'lawyer':
        raise HTTPException(status_code=403, detail="Not authorized to modify this query")

    # Optional content edits (only by user who created it while open, or by assigned lawyer)
    if req.subject is not None:
        if current['id'] != q.user_id and current['role'] != 'lawyer':
            raise HTTPException(status_code=403, detail="Not authorized to edit query subject")
        q.subject = req.subject
    if req.description is not None:
        if current['id'] != q.user_id and current['role'] != 'lawyer':
            raise HTTPException(status_code=403, detail="Not authorized to edit query description")
        q.description = req.description

    # Status updates
    if req.status is not None:
        allowed_status = {'open', 'accepted', 'info_requested', 'rejected', 'answered', 'closed'}
        if req.status not in allowed_status:
            raise HTTPException(status_code=400, detail="Invalid status value")

        # Only lawyers can set accepted/info_requested/rejected/answered/closed
        if req.status in {'accepted', 'info_requested', 'rejected', 'answered', 'closed'} and current['role'] != 'lawyer':
            raise HTTPException(status_code=403, detail="Only lawyer can set this status")

        # If a lawyer accepts and it's unassigned, assign to this lawyer
        if req.status == 'accepted' and q.lawyer_id is None:
            q.lawyer_id = current['id']

        q.status = req.status

    db.add(q)
    db.commit()
    db.refresh(q)
    return q


@router.get("/lawyers/{lawyer_id}/availability", response_model=List[AvailabilitySlotOut])
def get_lawyer_availability(lawyer_id: int, db: Session = Depends(get_db)):
    # Only upcoming, not booked slots
    # Use timezone-aware UTC to avoid naive/aware comparison issues
    now = datetime.now(timezone.utc)
    slots = db.query(models.AvailabilitySlot).filter(
        models.AvailabilitySlot.lawyer_id == lawyer_id,
        models.AvailabilitySlot.is_booked == False,  # noqa: E712
        models.AvailabilitySlot.start_at >= now
    ).order_by(models.AvailabilitySlot.start_at.asc()).all()
    return slots


@router.post("/lawyers/availability", response_model=List[AvailabilitySlotOut])
def create_availability_slot(
    req: AvailabilitySlotCreate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create availability by auto-splitting the provided window into 30-minute slots.

    Business rules:
    - Only lawyers can create availability windows.
    - Reject if end_at <= start_at.
    - Reject if the requested window overlaps any existing slot for the lawyer.
    - Split the window into contiguous 30-minute segments; ignore any trailing remainder < 30 minutes.
    - Return the list of created (unbooked) slots.
    """
    if current['role'] != 'lawyer':
        raise HTTPException(status_code=403, detail="Only lawyers can add availability")

    if req.end_at <= req.start_at:
        raise HTTPException(status_code=400, detail="end_at must be after start_at")

    # Overlap check against any existing slot in the requested window
    overlap = db.query(models.AvailabilitySlot).filter(
        models.AvailabilitySlot.lawyer_id == current['id'],
        models.AvailabilitySlot.end_at > req.start_at,
        models.AvailabilitySlot.start_at < req.end_at
    ).first()
    if overlap:
        raise HTTPException(status_code=409, detail="Overlapping availability slot exists")

    # Generate 30-minute segments
    segment_start = req.start_at
    segment_length = timedelta(minutes=30)
    created_slots: List[models.AvailabilitySlot] = []
    while segment_start + segment_length <= req.end_at:
        segment_end = segment_start + segment_length
        slot = models.AvailabilitySlot(
            lawyer_id=current['id'],
            start_at=segment_start,
            end_at=segment_end,
            is_booked=False
        )
        db.add(slot)
        created_slots.append(slot)
        segment_start = segment_end

    # Persist all
    db.commit()
    # Refresh each to populate IDs
    for s in created_slots:
        db.refresh(s)

    return created_slots

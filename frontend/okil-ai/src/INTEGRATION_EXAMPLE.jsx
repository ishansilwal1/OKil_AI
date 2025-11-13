// INTEGRATION_EXAMPLE.jsx
// This file shows how to integrate the video meeting feature into your existing components

import React from 'react';
import CreateMeetingButton from '../components/CreateMeetingButton';

// ===================================================================
// EXAMPLE 1: Integrate into Lawyer Dashboard Appointment Card
// ===================================================================

const AppointmentCard = ({ appointment }) => {
  const handleMeetingCreated = (data) => {
    console.log('Meeting created:', data);
    // Optionally refresh appointments list or update UI
  };
  
  return (
    <div className="appointment-card">
      <h3>{appointment.description}</h3>
      <div className="appointment-details">
        <p><strong>Client:</strong> {appointment.client_name}</p>
        <p><strong>Date:</strong> {appointment.date}</p>
        <p><strong>Time:</strong> {appointment.time}</p>
        <p><strong>Status:</strong> 
          <span className={`status-badge ${appointment.status}`}>
            {appointment.status}
          </span>
        </p>
      </div>
      
      {/* Show video meeting button only for approved appointments */}
      {appointment.status === 'approved' && (
        <div className="meeting-actions">
          <CreateMeetingButton 
            appointmentId={appointment.id}
            onSuccess={handleMeetingCreated}
            buttonText="🎥 Create Video Meeting"
          />
        </div>
      )}
      
      {appointment.status === 'pending' && (
        <div className="pending-actions">
          <button onClick={() => handleApprove(appointment.id)}>
            ✅ Approve
          </button>
          <button onClick={() => handleReject(appointment.id)}>
            ❌ Reject
          </button>
        </div>
      )}
    </div>
  );
};

// ===================================================================
// EXAMPLE 2: Integrate into Appointment Details Page
// ===================================================================

const AppointmentDetails = ({ appointmentId }) => {
  const [appointment, setAppointment] = useState(null);
  
  useEffect(() => {
    fetchAppointmentDetails();
  }, [appointmentId]);
  
  const fetchAppointmentDetails = async () => {
    // Your existing fetch logic
  };
  
  const handleMeetingSuccess = (data) => {
    // Update appointment state with meeting info
    setAppointment(prev => ({
      ...prev,
      meeting_created: true,
      meeting_room: data.room_name
    }));
  };
  
  return (
    <div className="appointment-details-page">
      <div className="details-header">
        <h1>Appointment Details</h1>
        <span className={`status ${appointment?.status}`}>
          {appointment?.status}
        </span>
      </div>
      
      <div className="details-content">
        {/* Your existing appointment details */}
        
        <div className="meeting-section">
          <h2>Video Consultation</h2>
          
          {appointment?.status === 'approved' && !appointment?.meeting_created && (
            <div className="create-meeting-prompt">
              <p>Ready to schedule a video meeting?</p>
              <CreateMeetingButton 
                appointmentId={appointmentId}
                onSuccess={handleMeetingSuccess}
                className="large"
              />
            </div>
          )}
          
          {appointment?.meeting_created && (
            <div className="meeting-info">
              <p>✅ Video meeting has been scheduled!</p>
              <p>Both parties have received email with meeting link.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===================================================================
// EXAMPLE 3: Integrate into Appointment List with Inline Button
// ===================================================================

const AppointmentList = ({ appointments }) => {
  return (
    <div className="appointments-list">
      <h2>Your Appointments</h2>
      
      <table className="appointments-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map(appointment => (
            <tr key={appointment.id}>
              <td>{appointment.client_name}</td>
              <td>{appointment.date}</td>
              <td>{appointment.time}</td>
              <td>
                <span className={`badge ${appointment.status}`}>
                  {appointment.status}
                </span>
              </td>
              <td>
                {appointment.status === 'approved' && (
                  <CreateMeetingButton 
                    appointmentId={appointment.id}
                    buttonText="🎥 Create Meeting"
                    className="small"
                  />
                )}
                {appointment.status === 'pending' && (
                  <button className="review-btn">Review</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ===================================================================
// EXAMPLE 4: Custom Implementation (Without CreateMeetingButton)
// ===================================================================

const CustomMeetingCreation = ({ appointmentId }) => {
  const [creating, setCreating] = useState(false);
  const [meetingCreated, setMeetingCreated] = useState(false);
  const [meetingLink, setMeetingLink] = useState(null);
  
  const createMeeting = async () => {
    setCreating(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `http://localhost:8000/api/v1/appointments/${appointmentId}/create-meeting`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setMeetingCreated(true);
        setMeetingLink(data.lawyer_link || data.client_link);
        
        // Show success message
        alert('Meeting created! Check your email for the link.');
      } else {
        const error = await response.json();
        alert('Error: ' + error.detail);
      }
    } catch (error) {
      console.error('Failed to create meeting:', error);
      alert('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };
  
  return (
    <div className="custom-meeting-section">
      {!meetingCreated ? (
        <button 
          onClick={createMeeting}
          disabled={creating}
          className="custom-create-btn"
        >
          {creating ? 'Creating...' : '🎥 Schedule Video Meeting'}
        </button>
      ) : (
        <div className="meeting-created-success">
          <p>✅ Meeting scheduled successfully!</p>
          <a 
            href={meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="join-meeting-link"
          >
            Join Meeting Now →
          </a>
        </div>
      )}
    </div>
  );
};

// ===================================================================
// EXAMPLE 5: User Dashboard Integration (Client Side)
// ===================================================================

const UserAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  
  // Note: Clients typically won't create meetings, but can join them
  // Show meeting link if lawyer has already created it
  
  return (
    <div className="user-appointments">
      <h2>My Appointments</h2>
      
      {appointments.map(appointment => (
        <div key={appointment.id} className="user-appointment-card">
          <h3>{appointment.description}</h3>
          <p>Lawyer: {appointment.lawyer_name}</p>
          <p>Date: {appointment.date} at {appointment.time}</p>
          
          {/* If meeting link exists, show join button */}
          {appointment.meeting_link && (
            <div className="meeting-ready">
              <p>🎥 Video consultation is ready!</p>
              <a 
                href={appointment.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="join-meeting-btn"
              >
                Join Video Meeting
              </a>
            </div>
          )}
          
          {/* If approved but no meeting yet */}
          {appointment.status === 'approved' && !appointment.meeting_link && (
            <p className="waiting-for-meeting">
              ⏳ Waiting for lawyer to schedule video meeting...
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

// ===================================================================
// STYLING SUGGESTIONS
// ===================================================================

const ExampleStyles = `
/* Add these to your component CSS files */

.appointment-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 16px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.approved {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.meeting-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.meeting-created-success {
  background: #d1fae5;
  border: 2px solid #10b981;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.join-meeting-btn {
  display: inline-block;
  background: #10b981;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s;
}

.join-meeting-btn:hover {
  background: #059669;
  transform: translateY(-2px);
}

.waiting-for-meeting {
  color: #6b7280;
  font-style: italic;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
}
`;

// ===================================================================
// QUICK START GUIDE
// ===================================================================

/*

STEP 1: Import the component
------------------------------
import CreateMeetingButton from './components/CreateMeetingButton';


STEP 2: Use in your appointment component
------------------------------------------
{appointment.status === 'approved' && (
  <CreateMeetingButton 
    appointmentId={appointment.id}
    buttonText="🎥 Create Video Meeting"
    onSuccess={(data) => {
      console.log('Meeting created:', data);
      // Refresh your appointment list or update UI
    }}
  />
)}


STEP 3: Handle meeting links for users
---------------------------------------
// If appointment has meeting_link, show join button
{appointment.meeting_link && (
  <a href={appointment.meeting_link} target="_blank">
    Join Video Meeting
  </a>
)}


STEP 4: Test the flow
----------------------
1. Login as lawyer
2. Approve an appointment
3. Click "Create Video Meeting"
4. Check email for meeting link
5. Click link to join video call
6. Test with client account in different browser


That's it! 🎉

*/

export {
  AppointmentCard,
  AppointmentDetails,
  AppointmentList,
  CustomMeetingCreation,
  UserAppointments
};

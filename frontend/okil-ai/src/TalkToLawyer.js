import React, { useState } from 'react';
import './TalkToLawyer.css';

const TalkToLawyer = ({ onNavigate }) => {
  const [activeMenu, setActiveMenu] = useState('talk-to-lawyer');

  const handleMenuClick = (menuItem) => {
    setActiveMenu(menuItem);
    if (onNavigate) {
      onNavigate(menuItem);
    }
  };

  const lawyerCards = [
    {
      id: 1,
      name: "John Smith",
      barCouncilNumber: "BC12345",
      expertise: "Criminal Law",
      mailAddress: "john.smith@law.com"
    },
    {
      id: 2,
      name: "Sarah Johnson", 
      barCouncilNumber: "BC67890",
      expertise: "Family Law",
      mailAddress: "sarah.johnson@law.com"
    },
    {
      id: 3,
      name: "Michael Brown",
      barCouncilNumber: "BC54321", 
      expertise: "Corporate Law",
      mailAddress: "michael.brown@law.com"
    },
    {
      id: 4,
      name: "Emily Davis",
      barCouncilNumber: "BC98765",
      expertise: "Employment Law", 
      mailAddress: "emily.davis@law.com"
    }
  ];

  return (
      <div 
        className="main-content"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/Background.png)`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: 'cover'
        }}
      >
        <div className="content-header">
          <h1 className="page-title">Talk To Lawyer</h1>
        </div>

        <div className="lawyers-grid">
          {lawyerCards.map((card, index) => (
            <div key={card.id} className="lawyer-card">
              <div className="card-content">
                <div className="lawyer-info">
                  <p><strong>Name:</strong></p>
                  <p>{card.name}</p>
                  
                  <p><strong>BAR council number:</strong></p>
                  <p>{card.barCouncilNumber}</p>
                  
                  <p><strong>Expertise:</strong></p>
                  <p>{card.expertise}</p>
                  
                  <p><strong>Mail address:</strong></p>
                  <p>{card.mailAddress}</p>
                </div>
              </div>
              
              <div className="card-actions">
                <button 
                  className="talk-to-lawyer-btn"
                  onClick={() => handleMenuClick('book-appointment')}
                >
                  Talk To Lawyer
                </button>
                <button 
                  className="leave-query-btn"
                  onClick={() => handleMenuClick('leave-query')}
                >
                  Leave a query
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
  );
};

export default TalkToLawyer;
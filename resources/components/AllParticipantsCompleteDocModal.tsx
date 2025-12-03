import React from "react";

interface AllParticipantsCompleteDocModalProps {
    onClose: () => void;
    isOpen: boolean;
}

const AllParticipantsCompleteDocModal = ({ isOpen, onClose }: AllParticipantsCompleteDocModalProps) => {
    if (!isOpen) return null;

    return (
        <>
            <div className="add-recipient-backdrop" onClick={onClose}></div>
            <div className="add-recipient-modal" role="dialog" aria-modal="true">
                <header className="add-recipient-header">
                    <h2></h2>
                    <button className="add-recipient-close-btn" aria-label="Close" onClick={onClose}>
                        ×
                    </button>
                </header>

                <div className="sent-modal-content">
                    <div className="sent-modal-icon-box">
                        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="30" y="20" width="60" height="80" rx="5" fill="#BBDEFB" stroke="#42A5F5" strokeWidth="2"/>
                          <rect x="40" y="30" width="40" height="5" fill="#42A5F5"/>
                          <rect x="40" y="40" width="25" height="5" fill="#42A5F5"/>
                          <rect x="40" y="50" width="40" height="5" fill="#42A5F5"/>
                          <rect x="40" y="60" width="20" height="5" fill="#42A5F5"/>
                          
                          <path d="M50 75 L60 85 L80 65" stroke="#4CAF50" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>

                          <path d="M20 90 Q30 80 40 90 L40 100 H20 Z" fill="#E3F2FD" stroke="#90CAF9" strokeWidth="1"/>
                          <path d="M80 90 Q90 80 100 90 L100 100 H80 Z" fill="#E3F2FD" stroke="#90CAF9" strokeWidth="1"/>
                          <path d="M15 95 Q25 85 35 95 L35 105 H15 Z" fill="#E3F2FD" stroke="#90CAF9" strokeWidth="1"/>
                          <path d="M85 95 Q95 85 105 95 L105 105 H85 Z" fill="#E3F2FD" stroke="#90CAF9" strokeWidth="1"/>

                        </svg>
                    </div>

                    <h2 className="sent-modal-title">Document has been completed</h2>

                    <p className="sent-modal-desc">
                         We have sent you an email confirming the document completion.
                    </p>
                </div>

                <style>{`
                    .add-recipient-backdrop {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.15);
                        z-index: 999;
                    }

                    .add-recipient-modal {
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        max-width: 500px;
                        width: 80%;
                        max-height: 80vh;
                        transform: translate(-50%, -50%);
                        background: white;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                        border-radius: 6px;
                        padding: 24px;
                        box-sizing: border-box;
                        z-index: 1000;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                    }

                    .add-recipient-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .add-recipient-header h2 {
                        font-weight: 600;
                        font-size: 18px;
                        margin: 0;
                        color: #333;
                    }

                    .add-recipient-close-btn {
                        border: none;
                        background: transparent;
                        font-size: 20px;
                        cursor: pointer;
                        padding: 4px;
                        line-height: 1;
                        color: #555;
                        transition: color 0.2s ease-in-out;
                    }

                    .add-recipient-close-btn:hover {
                        color: #000;
                    }

                    .sent-modal-content {
                        text-align: center;
                        padding: 30px 20px;
                    }

                    .sent-modal-icon-box {
                        display: flex;
                        justify-content: center;
                        margin-bottom: 25px;
                    }

                    .sent-modal-title {
                        font-size: 20px;
                        font-weight: 600;
                        margin-bottom: 12px;
                        color: #333;
                    }

                    .sent-modal-desc {
                        font-size: 14px;
                        color: #666;
                        line-height: 1.5;
                        margin-bottom: 25px;
                        max-width: 350px;
                        margin-left: auto;
                        margin-right: auto;
                    }
                    
                    @media (max-width: 480px) {
                        .add-recipient-modal {
                            width: 95%;
                            padding: 16px 20px;
                        }
                    }
                `}</style>
            </div>
        </>
    );
};

export default AllParticipantsCompleteDocModal;

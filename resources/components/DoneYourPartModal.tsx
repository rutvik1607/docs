import React from "react";

interface DoneYourPartModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DoneYourPartModal = ({ isOpen, onClose }: DoneYourPartModalProps) => {
    if (!isOpen) return null;

    return (
        <>
            <div className="done-part-backdrop" onClick={onClose}></div>
            <div className="done-part-modal" role="dialog" aria-modal="true">
                <header className="done-part-header">
                    <h2></h2>
                    <button className="done-part-close-btn" aria-label="Close" onClick={onClose}>
                        ×
                    </button>
                </header>

                <div className="sent-modal-content">
                    <div className="sent-modal-icon-box">
                        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="10" y="10" width="180" height="180" fill="#E8F5E9"/>
                          <polygon points="190,190 190,140 140,190" fill="#1B5E20"/>
                          <path d="M55 100 L85 130 L145 70" stroke="#212121" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>

                    <h2 className="sent-modal-title">You've done your part!</h2>

                    <p className="sent-modal-desc">
                        Next, We'll notify you once all participants take action.
                    </p>
                </div>

                <style>{`
                    .done-part-backdrop {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.5);
                        z-index: 999;
                    }

                    .done-part-modal {
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

                    .done-part-header {
                        display: flex;
                        justify-content: flex-end;
                        align-items: center;
                    }

                    .done-part-close-btn {
                        border: none;
                        background: transparent;
                        font-size: 24px;
                        cursor: pointer;
                        padding: 0;
                        line-height: 1;
                        color: #555;
                        transition: color 0.2s ease-in-out;
                    }

                    .done-part-close-btn:hover {
                        color: #000;
                    }

                    .sent-modal-content {
                        text-align: center;
                        padding: 10px 20px 30px;
                    }

                    .sent-modal-icon-box {
                        display: flex;
                        justify-content: center;
                        margin-bottom: 25px;
                    }

                    .sent-modal-title {
                        font-size: 24px;
                        font-weight: 600;
                        margin-bottom: 12px;
                        color: #333;
                    }

                    .sent-modal-desc {
                        font-size: 16px;
                        color: #666;
                        line-height: 1.5;
                        margin-bottom: 0;
                        max-width: 350px;
                        margin-left: auto;
                        margin-right: auto;
                    }
                    
                    @media (max-width: 480px) {
                        .done-part-modal {
                            width: 95%;
                            padding: 16px 20px;
                        }
                    }
                `}</style>
            </div>
        </>
    );
};

export default DoneYourPartModal;

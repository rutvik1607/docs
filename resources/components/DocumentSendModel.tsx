import React from "react";

interface DocumentSendModalProps {
    onClose: () => void;
}

const DocumentSendModal = ({ onClose }: DocumentSendModalProps) => {
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
                        <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                          <rect width="120" height="120" fill="#E5F1EF"/>

                          <polygon points="120,80 120,120 80,120" fill="#0F6A57"/>

                          <path d="M45 47 L78 60 L45 73 Z"
                                fill="none"
                                stroke="#111"
                                strokeWidth="4"
                                strokeLinejoin="miter"/>

                          <line x1="53" y1="60" x2="65" y2="60"
                                stroke="#111"
                                strokeWidth="4"/>
                        </svg>
                    </div>

                    <h2 className="sent-modal-title">Your document has been sent</h2>

                    <p className="sent-modal-desc">
                        We’ll notify you via email once the document is opened, commented on, forwarded, or signed.
                    </p>
                    <p className="bottom-text"><span>WHAT'S NEXT</span></p>
                    <button className="add-recipient-btn add-recipient-add-btn" onClick={onClose}>Track document activity</button>
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
                        max-width: 450px;
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

                    .add-recipient-btn {
                        border-radius: 4px;
                        font-weight: 700;
                        padding: 8px 16px;
                        font-size: 14px;
                        cursor: pointer;
                        border: none;
                        transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
                    }

                    .add-recipient-add-btn {
                        background: #a2b5a1;
                        color: white;
                    }

                    .add-recipient-add-btn:hover:not(:disabled) {
                        background: #8a9a8a;
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

                    .bottom-text {
                        font-size: 12px;
                        color: #666;
                        line-height: 1.5;
                        max-width: 350px;
                        margin-left: auto;
                        margin-right: auto;
                        margin-bottom: 7px;
                    }
                    
                    @media (max-width: 480px) {
                        .add-recipient-modal {
                            width: 95%;
                            padding: 16px 20px;
                        }

                        .add-recipient-btn {
                            width: 100%;
                        }
                    }
                `}</style>
            </div>
        </>
    );
};

export default DocumentSendModal;

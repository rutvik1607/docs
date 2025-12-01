import React, { useState, useEffect } from "react";
import "./SendDocumentModal.css";
import EmailTemplateModal from "./EmailTemplateModal";

interface Recipient {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface SendDocumentModalProps {
    onClose: () => void;
    onSend: (subject: string, body: string) => void;
    recipients: Recipient[];
    senderName: string;
    fileName: string;
}

const SendDocumentModal: React.FC<SendDocumentModalProps> = ({
    onClose,
    onSend,
    recipients,
    senderName,
    fileName,
}) => {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [showTemplateModal, setShowTemplateModal] = useState(false);

    useEffect(() => {
        // Set default subject
        setSubject(`${senderName} sent you ${fileName}`);
    }, [senderName, fileName]);

    const handleTemplateSelect = (selectedSubject: string, selectedBody: string) => {
        if (selectedSubject) setSubject(selectedSubject);
        if (selectedBody) setMessage(selectedBody);
        setShowTemplateModal(false);
    };

    const handleSendClick = () => {
        onSend(subject, message);
    };

    return (
        <div className="sd-modal-overlay">
            <div className="sd-modal-content">
                <div className="sd-modal-header">
                    <div className="sd-header-left">
                        <button className="sd-back-btn" onClick={onClose}>
                            &larr; Back
                        </button>
                    </div>
                    <div className="sd-header-center">
                        {/* <span className="sd-step">Review recipients</span>
                        <span className="sd-step-separator">&gt;</span> */}
                        <span className="sd-step active">Send document</span>
                    </div>
                    <div className="sd-header-right">
                        <button className="sd-close-btn" onClick={onClose}>
                            &times;
                        </button>
                    </div>
                </div>

                <div className="sd-modal-body">
                    <h2 className="sd-title">Send document</h2>

                    <div className="sd-field-group">
                        <label className="sd-label">FROM</label>
                        <div className="sd-input-display">
                            <span className="sd-pill">{senderName}</span>
                        </div>
                    </div>

                    <div className="sd-field-group">
                        <label className="sd-label">TO</label>
                        <div className="sd-input-display">
                            {recipients.map((recipient) => (
                                <span key={recipient.id} className="sd-pill">
                                    {recipient.first_name} {recipient.last_name}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="sd-section-title">Email message</div>

                    <div className="sd-message-box">
                        <div className="sd-message-header">
                            <input
                                type="text"
                                className="sd-subject-input"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Subject"
                            />
                            <button
                                className="sd-template-btn"
                                onClick={() => setShowTemplateModal(true)}
                            >
                                Email templates
                            </button>
                        </div>
                        <textarea
                            className="sd-message-textarea"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Message..."
                        />
                    </div>
                </div>

                <div className="sd-modal-footer">
                    <button className="sd-send-btn" onClick={handleSendClick}>
                        Send document
                    </button>
                </div>
            </div>

            {showTemplateModal && (
                <EmailTemplateModal
                    onClose={() => setShowTemplateModal(false)}
                    onSelect={handleTemplateSelect}
                />
            )}
        </div>
    );
};

export default SendDocumentModal;

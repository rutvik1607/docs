import React, { useState, useEffect } from "react";

interface TextBox {
    id: string;
    page: number;
    x: number;
    y: number;
    content: string;
    fieldType?: string;
    width?: number;
    height?: number;
    recipientId?: number | null;
}

interface Recipient {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface AssignRecipientsModalProps {
    isOpen: boolean;
    textBoxes: TextBox[];
    recipients: Recipient[];
    onClose: () => void;
    onConfirm: (updatedTextBoxes: TextBox[]) => void;
}

export default function AssignRecipientsModal({
    isOpen,
    textBoxes,
    recipients,
    onClose,
    onConfirm,
}: AssignRecipientsModalProps) {
    const [assignments, setAssignments] = useState<Record<string, number | null>>({});

    useEffect(() => {
        const initialAssignments: Record<string, number | null> = {};
        textBoxes.forEach((tb) => {
            initialAssignments[tb.id] = tb.recipientId || null;
        });
        setAssignments(initialAssignments);
    }, [textBoxes, isOpen]);

    const handleAssignmentChange = (textBoxId: string, recipientId: number | null) => {
        setAssignments((prev) => ({
            ...prev,
            [textBoxId]: recipientId,
        }));
    };

    const handleConfirm = () => {
        const updatedTextBoxes = textBoxes.map((tb) => ({
            ...tb,
            recipientId: assignments[tb.id] || null,
        }));
        onConfirm(updatedTextBoxes);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal-container" role="dialog" aria-modal="true" aria-labelledby="assign-modal-title">
                <header className="modal-header">
                    <h2 id="assign-modal-title">Assign Recipients to Fields</h2>
                    <button className="close-btn" aria-label="Close" onClick={onClose}>
                        ×
                    </button>
                </header>

                <div className="assign-modal-content">
                    {textBoxes.length === 0 ? (
                        <p className="no-fields-message">No fields to assign. Please drop fields on the document first.</p>
                    ) : (
                        <div className="assign-fields-list">
                            {textBoxes.map((textBox, index) => (
                                <div key={textBox.id} className="assign-field-row">
                                    <div className="assign-field-label">
                                        <span className="assign-field-number">{index + 1}.</span>
                                        <span className="assign-field-name">{textBox.content}</span>
                                        <span className="assign-field-type">{textBox.fieldType || "text"}</span>
                                    </div>
                                    <select
                                        className="assign-field-select"
                                        value={assignments[textBox.id] || ""}
                                        onChange={(e) =>
                                            handleAssignmentChange(
                                                textBox.id,
                                                e.target.value ? parseInt(e.target.value) : null
                                            )
                                        }
                                    >
                                        <option value="">-- No Recipient --</option>
                                        {recipients.map((recipient) => (
                                            <option key={recipient.id} value={recipient.id}>
                                                {recipient.first_name} {recipient.last_name} ({recipient.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <footer className="modal-footer">
                    <button type="button" className="btn cancel-btn" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="button" className="btn create-btn" onClick={handleConfirm}>
                        Save Assignments
                    </button>
                </footer>

                <style>{`
                    .assign-modal-content {
                        max-height: 400px;
                        overflow-y: auto;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        padding: 16px;
                        margin: 16px 0;
                        background: #f9f9f9;
                    }

                    .no-fields-message {
                        text-align: center;
                        color: #666;
                        padding: 24px;
                        font-size: 14px;
                    }

                    .assign-fields-list {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }

                    .assign-field-row {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 12px;
                        background: white;
                        border-radius: 4px;
                        border: 1px solid #e0e0e0;
                    }

                    .assign-field-label {
                        flex: 1;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        min-width: 0;
                    }

                    .assign-field-number {
                        font-weight: 600;
                        color: #49806e;
                        flex-shrink: 0;
                    }

                    .assign-field-name {
                        font-family: monospace;
                        color: #333;
                        font-weight: 500;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .assign-field-type {
                        font-size: 12px;
                        background: #e8f2ef;
                        color: #49806e;
                        padding: 2px 6px;
                        border-radius: 3px;
                        flex-shrink: 0;
                    }

                    .assign-field-select {
                        flex: 1;
                        min-width: 200px;
                        height: 32px;
                        padding: 6px 8px;
                        border: 1px solid #ddd;
                        border-radius: 3px;
                        font-size: 14px;
                        font-family: inherit;
                        outline-offset: 2px;
                        transition: border-color 0.2s ease-in-out;
                    }

                    .assign-field-select:focus {
                        border-color: #a2b5a1;
                        outline: none;
                    }

                    @media (max-width: 480px) {
                        .assign-modal-content {
                            max-height: 300px;
                        }

                        .assign-field-row {
                            flex-direction: column;
                            align-items: flex-start;
                        }

                        .assign-field-select {
                            width: 100%;
                            min-width: unset;
                        }
                    }
                `}</style>
            </div>
        </>
    );
}

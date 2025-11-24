// import React from "react";
// import "./RightSidebar.css";

import { DragEvent, JSX, useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { getRecipientsByTemplate, deleteRecipient } from "../js/api/api";
import AddRecipientModal from "./AddRecipientModal";

// Button model to standardize icon or svg
type FieldButton = {
    type: string;
    label: string;
    icon?: string; // e.g., "A", "IN"
    svg?: JSX.Element; // for glyphs
};

const fieldButtons: FieldButton[][] = [
    [
        { icon: "A", type: "text", label: "Enter Value" },
        {
            svg: (
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            ),
            type: "signature",
            label: "Signature",
        },
    ],
    [
        { icon: "IN", type: "initials", label: "Initials" },
        {
            svg: (
                <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-9H19V1h-2v1H7V1H5v1H3.5C2.67 2 2 2.67 2 3.5v15C2 19.33 2.67 20 3.5 20h17c.83 0 1.5-.67 1.5-1.5v-15C22 2.67 21.33 2 20.5 2z" />
            ),
            type: "date",
            label: "Date",
        },
    ],
    [
        {
            svg: (
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            ),
            type: "billing",
            label: "Billing details",
        },
        {
            svg: (
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            ),
            type: "stamp",
            label: "Stamp",
        },
    ],
];

interface Recipient {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface RightSidebarProps {
    onSave?: () => void;
    setReciepentModal: React.Dispatch<React.SetStateAction<boolean>>;
    templateId?: number;
    userId?: number;
    onRecipientUpdate?: (recipients: Recipient[]) => void;
}

interface RightSidebarHandle {
    refreshRecipients: () => Promise<void>;
}

const RightSidebar = forwardRef<RightSidebarHandle, RightSidebarProps>(({
    onSave,
    setReciepentModal,
    templateId = 1,
    userId = 1,
    onRecipientUpdate,
}, ref) => {
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddRecipientModal, setShowAddRecipientModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        recipientId: number | null;
        recipientName: string;
    }>({
        isOpen: false,
        recipientId: null,
        recipientName: "",
    });
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchRecipients = async () => {
        if (!templateId) return;

        setLoading(true);
        try {
            const response = await getRecipientsByTemplate(templateId);
            if (response.status) {
                setRecipients(response.data);
                onRecipientUpdate?.(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch recipients:", error);
        } finally {
            setLoading(false);
        }
    };

    useImperativeHandle(ref, () => ({
        refreshRecipients: fetchRecipients
    }));

    useEffect(() => {
        fetchRecipients();
    }, [templateId]);

    const handleDragStart = (
        e: DragEvent<HTMLButtonElement>,
        type: string,
        label: string
    ) => {
        e.dataTransfer.setData(
            "application/json",
            JSON.stringify({ type: "field", fieldType: type, label })
        );
        e.dataTransfer.effectAllowed = "copy";
    };

    const openDeleteConfirmation = (recipient: Recipient) => {
        setDeleteConfirmation({
            isOpen: true,
            recipientId: recipient.id,
            recipientName: `${recipient.first_name} ${recipient.last_name}`,
        });
    };

    const handleDeleteConfirm = async () => {
        if (deleteConfirmation.recipientId === null) return;

        setIsDeleting(true);
        try {
            const response = await deleteRecipient(templateId, userId, deleteConfirmation.recipientId);
            if (response.status) {
                const updatedRecipients = recipients.filter((r) => r.id !== deleteConfirmation.recipientId);
                setRecipients(updatedRecipients);
                onRecipientUpdate?.(updatedRecipients);
                setDeleteConfirmation({
                    isOpen: false,
                    recipientId: null,
                    recipientName: "",
                });
            }
        } catch (error) {
            console.error("Failed to delete recipient:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmation({
            isOpen: false,
            recipientId: null,
            recipientName: "",
        });
    };

    console.log("Recipients:", recipients);

    return (
        <aside className="right-sidebar">
            {/* Header area like screenshot: title and close icon placeholder */}
            <div className="rs-header">
                <h3 className="rs-title">Add Fields</h3>
            </div>

            {/* Grid of field buttons */}
            <div className="rs-grid">
                {fieldButtons.map((row, rowIndex) => (
                    <div className="rs-row" key={rowIndex}>
                        {row.map((field, i) => (
                            <button
                                key={i}
                                className={`rs-btn ${field.type}`}
                                draggable
                                onDragStart={(e) =>
                                    handleDragStart(e, field.type, field.label)
                                }
                            >
                                <span className="rs-btn-inner">
                                    <span className="rs-glyph">
                                        {field.icon ? (
                                            <span className="rs-icon-text">
                                                {field.icon}
                                            </span>
                                        ) : (
                                            <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                                aria-hidden
                                            >
                                                {field.svg}
                                            </svg>
                                        )}
                                    </span>
                                    <span className="rs-label">
                                        {field.label}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                ))}
                <div className="rs-recipients-btns">
                    <button
                        className="rs-download-btn"
                        onClick={() => {
                            setReciepentModal(true);
                        }}
                    >
                        Add Recipient
                    </button>
                    <button
                        className="rs-header-add-recipient-btn"
                        title="Add existing recipients"
                        onClick={() => setShowAddRecipientModal(true)}
                    >
                        <svg fill="currentcolor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M136 128a120 120 0 1 1 240 0 120 120 0 1 1 -240 0zM48 482.3C48 383.8 127.8 304 226.3 304l59.4 0c98.5 0 178.3 79.8 178.3 178.3 0 16.4-13.3 29.7-29.7 29.7L77.7 512C61.3 512 48 498.7 48 482.3zM544 96c13.3 0 24 10.7 24 24l0 48 48 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-48 0 0 48c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-48-48 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l48 0 0-48c0-13.3 10.7-24 24-24z"/></svg>
                    </button>
                </div>

                {/* Recipients List */}
                {recipients.length > 0 && (
                    <div className="rs-recipients-section">
                        <h4 className="rs-recipients-title">
                            Recipients ({recipients.length})
                        </h4>
                        <div className="rs-recipients-list">
                            {recipients.map((recipient) => (
                                <div
                                    key={recipient.id}
                                    className="rs-recipient-item"
                                >
                                    <div className="rs-recipient-info">
                                        <div className="rs-recipient-name">
                                            {recipient.first_name}{" "}
                                            {recipient.last_name}
                                        </div>
                                        <div className="rs-recipient-email">
                                            {recipient.email}
                                        </div>
                                    </div>
                                    <button
                                        className="rs-recipient-delete-btn"
                                        onClick={() => openDeleteConfirmation(recipient)}
                                        title="Delete recipient"
                                    >
                                        <svg
                                            width="22"
                                            height="22"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                        >
                                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Download button at the bottom */}
            <div className="rs-download-container">
                {onSave && (
                    <button
                        className="rs-download-btn"
                        title="Sent Recipient"
                        onClick={onSave}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm3-10H6V5h9v2z" />
                        </svg>
                        Sent Recipient
                    </button>
                )}
            </div>

            {/* Add Recipient Modal */}
            {showAddRecipientModal && (
                <AddRecipientModal
                    onClose={() => setShowAddRecipientModal(false)}
                    onSuccess={fetchRecipients}
                    templateId={templateId}
                    userId={1}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmation.isOpen && (
                <div className="rs-confirm-modal-overlay" onClick={handleDeleteCancel}>
                    <div
                        className="rs-confirm-confirmation-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="rs-confirm-modal-header">
                            <h3 className="rs-confirm-modal-title">Delete Recipient</h3>
                        </div>
                        <div className="rs-confirm-modal-body">
                            <p>
                                Are you sure you want to delete{" "}
                                <strong>{deleteConfirmation.recipientName}</strong>?
                            </p>
                            <p className="rs-confirm-modal-warning">
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="rs-confirm-modal-footer">
                            <button
                                className="rs-confirm-modal-btn rs-confirm-modal-btn-cancel"
                                onClick={handleDeleteCancel}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="rs-confirm-modal-btn rs-confirm-modal-btn-delete"
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
});

RightSidebar.displayName = "RightSidebar";

export default RightSidebar;

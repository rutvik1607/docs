// import React from "react";
// import "./RightSidebar.css";

import { DragEvent, JSX, useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { getRecipientsByTemplate, deleteRecipient } from "../js/api/api";
import AddRecipientModal from "./AddRecipientModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { BillingIcon, DateIcon, InitialsIcon, RecipeentIcon, SendIcon, SignatureIcon, StampPlaceholderIcon, TextIcon, TrashIcon } from "./Icons";

// Button model to standardize icon or svg
type FieldButton = {
    type: string;
    label: string;
    icon?: JSX.Element; // e.g., "A", "IN"
    svg?: JSX.Element; // for glyphs
};

const fieldButtons: FieldButton[][] = [
    [
        { icon: <TextIcon height={24} width={24} />, type: "text", label: "Enter Value" },
        {
            icon: <SignatureIcon height={24} width={24} />,
            type: "signature",
            label: "Signature",
        },
    ],
    [
        { icon: <InitialsIcon height={24} width={24} />, type: "initials", label: "Initials" },
        {
            icon: <DateIcon height={24} width={24} />,
            type: "date",
            label: "Date",
        },
    ],
    [
        {
            icon: <BillingIcon height={24} width={24} />,
            type: "billing",
            label: "Billing details",
        },
        {
            icon: <StampPlaceholderIcon height={24} width={24} />,
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
    isAssignmentMode?: boolean;
    assignedCount?: number;
    totalFields?: number;
    onCancelAssignment?: () => void;
    onCompleteAssignment?: () => void;
    assignmentStep?: 'idle' | 'assigning' | 'review';
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
    isAssignmentMode,
    assignedCount,
    totalFields,
    onCancelAssignment,
    onCompleteAssignment,
    assignmentStep = 'idle',
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

    return (
        <aside className="right-sidebar">
            {/* Header area like screenshot: title and close icon placeholder */}
            <div className="rs-header">
                <h3 className="rs-title">{isAssignmentMode ? "Assign Fields" : "Add Fields"}</h3>
            </div>

            {isAssignmentMode ? (
                <div className="rs-assignment-mode">
                    <div className="rs-assignment-info">
                        <p className="rs-assignment-text">
                            {assignmentStep === 'idle' 
                                ? "Click 'Start Assignment' in the header to begin." 
                                : (assignmentStep === 'review' ? "Review Assignments" : "Assigning Fields...")}
                        </p>
                        <p className="rs-assignment-count">
                            {assignedCount} of {totalFields} assigned
                        </p>
                    </div>
                    
                    {/* Recipients List for Assignment */}
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
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
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
                                            <span className="rs-label">
                                                {field.label}
                                            </span>
                                            <span className="rs-glyph">
                                                <span className="rs-icon-text">
                                                    {field.icon}
                                                </span>
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
                                <RecipeentIcon height={20} width={20} /> 
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
                                                <TrashIcon height={20} width={20} />
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
                                title="Send"
                                onClick={onSave}
                            >
                                <SendIcon height={20} width={20} />
                                Send
                            </button>
                        )}
                    </div>
                </>
            )}

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
            <DeleteConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="Delete Recipient"
                message={
                    <>
                        Are you sure you want to delete{" "}
                        <strong>{deleteConfirmation.recipientName}</strong>?
                    </>
                }
                warning="This action cannot be undone."
                isDeleting={isDeleting}
            />
        </aside>
    );
});

RightSidebar.displayName = "RightSidebar";

export default RightSidebar;

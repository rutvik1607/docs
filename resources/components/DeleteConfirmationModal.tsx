import React from "react";
import "./DeleteConfirmationModal.css";

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: React.ReactNode;
    warning?: string;
    isDeleting?: boolean;
    confirmText?: string;
    cancelText?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Delete Item",
    message,
    warning,
    isDeleting = false,
    confirmText = "Delete",
    cancelText = "Cancel",
}) => {
    if (!isOpen) return null;

    return (
        <div className="dc-modal-overlay" onClick={onClose}>
            <div
                className="dc-confirmation-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="dc-modal-header">
                    <h3 className="dc-modal-title">{title}</h3>
                </div>
                <div className="dc-modal-body">
                    <div className="dc-modal-message">{message}</div>
                    {warning && (
                        <p className="dc-modal-warning">
                            {warning}
                        </p>
                    )}
                </div>
                <div className="dc-modal-footer">
                    <button
                        className="dc-modal-btn dc-modal-btn-cancel"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        {cancelText}
                    </button>
                    <button
                        className="dc-modal-btn dc-modal-btn-delete"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;

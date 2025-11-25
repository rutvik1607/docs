import React, { useRef, useState } from "react";
import { toast } from "react-toastify";

interface SignatureStampUploadModalProps {
    isOpen: boolean;
    fieldType: "signature" | "stamp";
    onClose: () => void;
    onUpload: (file: File) => void;
    isLoading?: boolean;
}

const SignatureStampUploadModal = ({
    isOpen,
    fieldType,
    onClose,
    onUpload,
    isLoading = false,
}: SignatureStampUploadModalProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
            setPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = () => {
        if (!selectedFile) {
            toast.error("Please select a file");
            return;
        }
        onUpload(selectedFile);
        resetModal();
    };

    const resetModal = () => {
        setPreview(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    if (!isOpen) return null;

    const title = fieldType === "signature" ? "Upload Signature" : "Upload Stamp";

    return (
        <>
            <div
                className="signature-stamp-backdrop"
                onClick={handleClose}
            />
            <div className="signature-stamp-modal" role="dialog" aria-modal="true">
                <header className="signature-stamp-header">
                    <h2>{title}</h2>
                    <button
                        className="signature-stamp-close-btn"
                        aria-label="Close"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        ×
                    </button>
                </header>

                <div className="signature-stamp-content">
                    {!preview ? (
                        <div className="signature-stamp-upload-area">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="signature-stamp-file-input"
                                disabled={isLoading}
                            />
                            <label
                                htmlFor="file-input"
                                className="signature-stamp-upload-label"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <svg
                                    className="signature-stamp-upload-icon"
                                    width="48"
                                    height="48"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                <p className="signature-stamp-upload-text">
                                    Click to upload or drag and drop
                                </p>
                                <p className="signature-stamp-upload-hint">
                                    PNG, JPG, GIF
                                </p>
                            </label>
                        </div>
                    ) : (
                        <div className="signature-stamp-preview-area">
                            <img
                                src={preview}
                                alt="Preview"
                                className="signature-stamp-preview"
                            />
                            <button
                                type="button"
                                className="signature-stamp-change-btn"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                            >
                                Change File
                            </button>
                        </div>
                    )}
                </div>

                <footer className="signature-stamp-footer">
                    <button
                        className="signature-stamp-btn signature-stamp-cancel-btn"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        className="signature-stamp-btn signature-stamp-upload-btn"
                        onClick={handleUpload}
                        disabled={isLoading || !selectedFile}
                    >
                        {isLoading ? "Uploading..." : "Upload"}
                    </button>
                </footer>

                <style>{`
                    .signature-stamp-backdrop {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.15);
                        z-index: 999;
                    }

                    .signature-stamp-modal {
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        max-width: 500px;
                        width: 90%;
                        transform: translate(-50%, -50%);
                        background: white;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                        border-radius: 6px;
                        padding: 24px;
                        box-sizing: border-box;
                        z-index: 1000;
                        display: flex;
                        flex-direction: column;
                        gap: 24px;
                    }

                    .signature-stamp-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin: 0;
                    }

                    .signature-stamp-header h2 {
                        font-weight: 600;
                        font-size: 18px;
                        margin: 0;
                        color: #333;
                    }

                    .signature-stamp-close-btn {
                        border: none;
                        background: transparent;
                        font-size: 20px;
                        cursor: pointer;
                        padding: 4px;
                        line-height: 1;
                        color: #555;
                        transition: color 0.2s ease-in-out;
                    }

                    .signature-stamp-close-btn:hover:not(:disabled) {
                        color: #000;
                    }

                    .signature-stamp-close-btn:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }

                    .signature-stamp-content {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                    }

                    .signature-stamp-file-input {
                        display: none;
                    }

                    .signature-stamp-upload-area {
                        border: 2px dashed #ddd;
                        border-radius: 8px;
                        padding: 32px 24px;
                        text-align: center;
                        cursor: pointer;
                        transition: all 0.2s ease-in-out;
                        background: #fafafa;
                    }

                    .signature-stamp-upload-area:hover {
                        border-color: #a2b5a1;
                        background: #f0f8f5;
                    }

                    .signature-stamp-upload-label {
                        cursor: pointer;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 12px;
                    }

                    .signature-stamp-upload-icon {
                        color: #a2b5a1;
                    }

                    .signature-stamp-upload-text {
                        margin: 0;
                        font-weight: 600;
                        font-size: 16px;
                        color: #333;
                    }

                    .signature-stamp-upload-hint {
                        margin: 0;
                        font-size: 14px;
                        color: #999;
                    }

                    .signature-stamp-preview-area {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 16px;
                    }

                    .signature-stamp-preview {
                        max-width: 100%;
                        max-height: 300px;
                        border-radius: 4px;
                        border: 1px solid #ddd;
                        object-fit: contain;
                    }

                    .signature-stamp-change-btn {
                        padding: 8px 16px;
                        font-size: 14px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        background: white;
                        color: #555;
                        cursor: pointer;
                        transition: all 0.2s ease-in-out;
                        font-weight: 500;
                    }

                    .signature-stamp-change-btn:hover:not(:disabled) {
                        border-color: #a2b5a1;
                        color: #333;
                        background: #f5f5f5;
                    }

                    .signature-stamp-change-btn:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }

                    .signature-stamp-footer {
                        display: flex;
                        justify-content: flex-end;
                        gap: 12px;
                        margin-top: 8px;
                    }

                    .signature-stamp-btn {
                        border-radius: 4px;
                        font-weight: 600;
                        padding: 8px 16px;
                        font-size: 14px;
                        cursor: pointer;
                        border: none;
                        transition: all 0.2s ease-in-out;
                    }

                    .signature-stamp-cancel-btn {
                        background: #eee;
                        color: #555;
                    }

                    .signature-stamp-cancel-btn:hover:not(:disabled) {
                        background: #ddd;
                    }

                    .signature-stamp-upload-btn {
                        background: #a2b5a1;
                        color: white;
                    }

                    .signature-stamp-upload-btn:hover:not(:disabled) {
                        background: #8a9a8a;
                    }

                    .signature-stamp-btn:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }
                `}</style>
            </div>
        </>
    );
};

export default SignatureStampUploadModal;

import React, { useRef, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useSignatureCanvas, FONT_OPTIONS } from "../hooks/useSignatureCanvas";

interface SignatureStampUploadModalProps {
    isOpen: boolean;
    fieldType: "signature" | "stamp";
    onClose: () => void;
    onUpload: (file: File) => void;
    isLoading?: boolean;
    currentImageUrl?: string;
    defaultName?: string;
}

const SignatureStampUploadModal = ({
    isOpen,
    fieldType,
    onClose,
    onUpload,
    isLoading = false,
    currentImageUrl,
    defaultName = "",
}: SignatureStampUploadModalProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
        canvasRef,
        isDrawing,
        hasDrawn,
        setHasDrawn,
        initializeCanvas,
        clearCanvas,
        loadImageOnCanvas,
        renderTextSignature,
        startDrawing
    } = useSignatureCanvas();

    const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [signatureMode, setSignatureMode] = useState<"upload" | "draw" | "type">(
        fieldType === "signature" ? "draw" : "upload"
    );
    const [textInput, setTextInput] = useState(defaultName);
    const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0].value);

    const isSignature = fieldType === "signature";

    useEffect(() => {
        setSignatureMode(isSignature ? "draw" : "upload");
    }, [isSignature]);

    useEffect(() => {
        if (isOpen && currentImageUrl) {
            setPreview(currentImageUrl);
        }
    }, [isOpen, currentImageUrl]);

    useEffect(() => {
        if (!isOpen || !isSignature || signatureMode === "upload") return;

        const timer = setTimeout(() => {
            initializeCanvas();
            if (signatureMode === "draw" && currentImageUrl) {
                loadImageOnCanvas(currentImageUrl);
            }
            if (signatureMode === "type" && textInput.trim()) {
                renderTextSignature(textInput, selectedFont);
            }
        }, 0);

        return () => clearTimeout(timer);
    }, [isOpen, isSignature, signatureMode, currentImageUrl, textInput, initializeCanvas, loadImageOnCanvas, renderTextSignature, selectedFont]);

    useEffect(() => {
        if (signatureMode !== "type") return;
        if (!isSignature) return;

        if (textInput.trim()) {
            renderTextSignature(textInput, selectedFont);
        } else {
            clearCanvas();
        }
    }, [signatureMode, textInput, selectedFont, isSignature, renderTextSignature, clearCanvas]);

    const handleSignatureModeChange = (mode: "upload" | "draw" | "type") => {
        setSignatureMode(mode);
        if (mode === "upload") {
            setHasDrawn(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        if (isSignature) {
            setSignatureMode("upload");
        }

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
            setPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = () => {
        if (isSignature && signatureMode !== "upload") {
            if (!canvasRef.current || !hasDrawn) {
                toast.error("Please draw or type your signature");
                return;
            }

            canvasRef.current.toBlob((blob) => {
                if (!blob) {
                    toast.error("Unable to process signature");
                    return;
                }
                const file = new File([blob], `signature-${signatureMode}.png`, {
                    type: "image/png",
                });
                onUpload(file);
                resetModal();
            });
            return;
        }

        if (!selectedFile) {
            toast.error("Please select a file");
            return;
        }
        onUpload(selectedFile);
        resetModal();
    };

    const resetModal = () => {
        setPreview(currentImageUrl || null);
        setSelectedFile(null);
        setSignatureMode(isSignature ? "draw" : "upload");
        setHasDrawn(false);
        setTextInput("");
        setSelectedFont(FONT_OPTIONS[0].value);
        clearCanvas();
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
    const uploadDisabled = isLoading || (isSignature
        ? signatureMode === "upload"
            ? !selectedFile
            : !hasDrawn
        : !selectedFile);

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
                    {isSignature && (
                        <div className="signature-stamp-tabs">
                            <button
                                className={`signature-stamp-tab ${signatureMode === "draw" ? "active" : ""}`}
                                onClick={() => handleSignatureModeChange("draw")}
                                disabled={isLoading}
                            >
                                Draw
                            </button>
                            <button
                                className={`signature-stamp-tab ${signatureMode === "type" ? "active" : ""}`}
                                onClick={() => handleSignatureModeChange("type")}
                                disabled={isLoading}
                            >
                                Type
                            </button>
                            <button
                                className={`signature-stamp-tab ${signatureMode === "upload" ? "active" : ""}`}
                                onClick={() => handleSignatureModeChange("upload")}
                                disabled={isLoading}
                            >
                                Upload
                            </button>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        id="signature-stamp-file-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="signature-stamp-file-input"
                        disabled={isLoading}
                    />

                    {(!isSignature || signatureMode === "upload") && (
                        !preview && !currentImageUrl ? (
                            <div className="signature-stamp-upload-area">
                                <label
                                    htmlFor="signature-stamp-file-input"
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
                                    src={preview || currentImageUrl || ""}
                                    alt="Preview"
                                    className="signature-stamp-preview"
                                />
                                <button
                                    type="button"
                                    className="signature-stamp-change-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isLoading}
                                >
                                    {selectedFile ? "Change File" : "Select Different File"}
                                </button>
                            </div>
                        )
                    )}

                    {isSignature && signatureMode !== "upload" && (
                        <div className="signature-stamp-draw-section">
                            {signatureMode === "type" && (
                                <div className="signature-stamp-type-controls">
                                    <input
                                        type="text"
                                        placeholder="Enter your name"
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        className="signature-stamp-text-input"
                                        disabled={isLoading}
                                    />
                                    <select
                                        value={selectedFont}
                                        onChange={(e) => setSelectedFont(e.target.value)}
                                        className="signature-stamp-font-select"
                                        disabled={isLoading}
                                    >
                                        {FONT_OPTIONS.map((font) => (
                                            <option key={font.value} value={font.value}>
                                                {font.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <canvas
                                ref={canvasRef}
                                className="signature-stamp-canvas"
                                onMouseDown={signatureMode === "draw" ? startDrawing : undefined}
                                onTouchStart={signatureMode === "draw" ? startDrawing : undefined}
                                style={{ cursor: signatureMode === "draw" ? "crosshair" : "default", touchAction: "none" }}
                            />
                            <div className="signature-stamp-canvas-actions">
                                <button
                                    type="button"
                                    className="signature-stamp-clear-btn"
                                    onClick={clearCanvas}
                                    disabled={isLoading || !hasDrawn}
                                >
                                    Clear
                                </button>
                            </div>
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
                        disabled={uploadDisabled}
                    >
                        {isLoading ? "Uploading..." : "Upload"}
                    </button>
                </footer>

                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Pacifico&family=Satisfy&family=Allura&family=Caveat:wght@400;700&family=Sacramento&display=swap');

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

                    .signature-stamp-tabs {
                        display: flex;
                        gap: 8px;
                        border-bottom: 1px solid #e5e7eb;
                        padding-bottom: 8px;
                    }

                    .signature-stamp-tab {
                        padding: 10px 16px;
                        border: none;
                        background: transparent;
                        color: #666;
                        font-weight: 500;
                        font-size: 14px;
                        cursor: pointer;
                        border-bottom: 2px solid transparent;
                        transition: all 0.2s ease-in-out;
                    }

                    .signature-stamp-tab.active {
                        color: #2f7d6f;
                        border-color: #2f7d6f;
                    }

                    .signature-stamp-tab:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
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

                    .signature-stamp-draw-section {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }

                    .signature-stamp-type-controls {
                        display: flex;
                        gap: 10px;
                    }

                    .signature-stamp-font-select:focus {
                        border-color: #a2b5a1;
                        box-shadow: 0 0 0 2px rgba(162, 181, 161, 0.1);
                    }

                    .signature-stamp-font-select option[value="dancing"] {
                        font-family: 'Dancing Script', cursive;
                    }

                    .signature-stamp-font-select option[value="great-vibes"] {
                        font-family: 'Great Vibes', cursive;
                    }

                    .signature-stamp-font-select option[value="pacifico"] {
                        font-family: 'Pacifico', cursive;
                    }

                    .signature-stamp-font-select option[value="satisfy"] {
                        font-family: 'Satisfy', cursive;
                    }

                    .signature-stamp-font-select option[value="allura"] {
                        font-family: 'Allura', cursive;
                    }

                    .signature-stamp-font-select option[value="caveat"] {
                        font-family: 'Caveat', cursive;
                    }

                    .signature-stamp-font-select option[value="sacramento"] {
                        font-family: 'Sacramento', cursive;
                    }


                    .signature-stamp-text-input {
                        flex: 1;
                        padding: 10px 12px;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        font-size: 14px;
                    }

                    .signature-stamp-text-input:disabled {
                        background: #f9fafb;
                        cursor: not-allowed;
                    }

                    .signature-stamp-font-select {
                        width: 200px;
                        padding: 10px 12px;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        background: white;
                        font-size: 14px;
                        cursor: pointer;
                    }

                    .signature-stamp-font-select:disabled {
                        background: #f9fafb;
                        cursor: not-allowed;
                    }

                    .signature-stamp-canvas {
                        width: 100%;
                        height: 220px;
                        border: 1px dashed #d1d5db;
                        border-radius: 8px;
                        background: white;
                    }

                    .signature-stamp-canvas-actions {
                        display: flex;
                        justify-content: flex-end;
                    }

                    .signature-stamp-clear-btn {
                        padding: 6px 14px;
                        font-size: 14px;
                        border-radius: 4px;
                        border: 1px solid #ddd;
                        background: white;
                        color: #555;
                        cursor: pointer;
                        transition: all 0.2s ease-in-out;
                    }

                    .signature-stamp-clear-btn:hover:not(:disabled) {
                        background: #f5f5f5;
                        border-color: #a2b5a1;
                        color: #333;
                    }

                    .signature-stamp-clear-btn:disabled {
                        opacity: 0.5;
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

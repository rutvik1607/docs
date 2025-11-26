import React, { useRef, useState, useEffect } from "react";

const FONT_OPTIONS = [
    { value: "dancing", label: "Dancing Script", family: "'Dancing Script', cursive" },
    { value: "great-vibes", label: "Great Vibes", family: "'Great Vibes', cursive" },
    { value: "pacifico", label: "Pacifico", family: "'Pacifico', cursive" },
    { value: "satisfy", label: "Satisfy", family: "'Satisfy', cursive" },
    { value: "allura", label: "Allura", family: "'Allura', cursive" },
    { value: "caveat", label: "Caveat", family: "'Caveat', cursive" },
    { value: "sacramento", label: "Sacramento", family: "'Sacramento', cursive" },
];

interface SignatureDrawModalProps {
    isOpen: boolean;
    fieldType: "signature" | "initials";
    onClose: () => void;
    onSave: (imageData: string) => void;
    isLoading?: boolean;
    currentImageUrl?: string;
}

const SignatureDrawModal = ({
    isOpen,
    fieldType,
    onClose,
    onSave,
    isLoading = false,
    currentImageUrl,
}: SignatureDrawModalProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [mode, setMode] = useState<"draw" | "type">("draw");
    const [textInput, setTextInput] = useState("");
    const [selectedFont, setSelectedFont] = useState("dancing");

    const initializeCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.scale(dpr, dpr);
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, rect.width, rect.height);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                initializeCanvas();
                if (currentImageUrl) {
                    loadImageOnCanvas(currentImageUrl);
                }
            }, 0);
        }
    }, [isOpen, currentImageUrl]);

    const loadImageOnCanvas = (imageUrl: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setHasDrawn(true);
        };
        img.src = imageUrl;
    };

    useEffect(() => {
        if (!isDrawing) return;

        const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
            if (!canvasRef.current) return;
            
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const rect = canvas.getBoundingClientRect();
            let x: number, y: number;

            if (e instanceof TouchEvent) {
                const touch = e.touches[0];
                x = touch.clientX - rect.left;
                y = touch.clientY - rect.top;
            } else {
                x = e.clientX - rect.left;
                y = e.clientY - rect.top;
            }

            ctx.lineTo(x, y);
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();

            if (!hasDrawn) {
                setHasDrawn(true);
            }
        };

        const handleGlobalEnd = () => {
            setIsDrawing(false);
        };

        window.addEventListener("mousemove", handleGlobalMove);
        window.addEventListener("mouseup", handleGlobalEnd);
        window.addEventListener("touchmove", handleGlobalMove);
        window.addEventListener("touchend", handleGlobalEnd);

        return () => {
            window.removeEventListener("mousemove", handleGlobalMove);
            window.removeEventListener("mouseup", handleGlobalEnd);
            window.removeEventListener("touchmove", handleGlobalMove);
            window.removeEventListener("touchend", handleGlobalEnd);
        };
    }, [isDrawing, hasDrawn]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;

        e.preventDefault();
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let x: number, y: number;

        if ("touches" in e) {
            const touch = e.touches[0];
            x = touch.clientX - rect.left;
            y = touch.clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        ctx.beginPath();
        ctx.moveTo(x, y);
    };



    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, rect.width, rect.height);
        }
        setHasDrawn(false);
    };

    const renderTextSignature = (text: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        clearCanvas();
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        
        const fontOption = FONT_OPTIONS.find(f => f.value === selectedFont);
        const fontFamily = fontOption?.family || "'Dancing Script', cursive";
        const fontSize = 170;

        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const x = rect.width / 2;
        const y = rect.height / 2;

        ctx.fillText(text, x, y);
        setHasDrawn(true);
    };

    useEffect(() => {
        if (mode === "type" && textInput) {
            renderTextSignature(textInput);
        }
    }, [textInput, selectedFont, mode]);

    const handleSave = () => {
        if (!canvasRef.current || !hasDrawn) return;

        const imageData = canvasRef.current.toDataURL("image/png");
        onSave(imageData);
        handleClose();
    };

    const handleClose = () => {
        clearCanvas();
        setHasDrawn(false);
        setTextInput("");
        setMode("draw");
        onClose();
    };

    if (!isOpen) return null;

    const title = fieldType === "signature" ? "Draw Signature" : "Draw Initials";

    return (
        <>
            <div
                className="signature-draw-backdrop"
                onClick={handleClose}
            />
            <div className="signature-draw-modal" role="dialog" aria-modal="true">
                <header className="signature-draw-header">
                    <h2>{title}</h2>
                    <button
                        className="signature-draw-close-btn"
                        aria-label="Close"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        ×
                    </button>
                </header>

                <div className="signature-draw-tabs">
                    <button
                        className={`signature-draw-tab ${mode === "draw" ? "active" : ""}`}
                        onClick={() => {
                            setMode("draw");
                            clearCanvas();
                        }}
                    >
                        ✏️ Draw
                    </button>
                    <button
                        className={`signature-draw-tab ${mode === "type" ? "active" : ""}`}
                        onClick={() => setMode("type")}
                    >
                        ✍️ Type
                    </button>
                </div>

                <div className="signature-draw-content">
                    {mode === "type" && (
                        <div className="signature-draw-type-section">
                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                className="signature-draw-text-input"
                                autoFocus
                            />
                            <select
                                value={selectedFont}
                                onChange={(e) => setSelectedFont(e.target.value)}
                                className="signature-draw-font-select"
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
                        className="signature-draw-canvas"
                        onMouseDown={mode === "draw" ? startDrawing : undefined}
                        onTouchStart={mode === "draw" ? startDrawing : undefined}
                        style={{ cursor: mode === "draw" ? "crosshair" : "default" }}
                    />
                </div>

                <footer className="signature-draw-footer">
                    <button
                        className="signature-draw-btn signature-draw-clear-btn"
                        onClick={clearCanvas}
                        disabled={isLoading || !hasDrawn}
                    >
                        Clear
                    </button>
                    <div style={{ display: "flex", gap: "12px" }}>
                        <button
                            className="signature-draw-btn signature-draw-cancel-btn"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            className="signature-draw-btn signature-draw-save-btn"
                            onClick={handleSave}
                            disabled={isLoading || !hasDrawn}
                        >
                            {isLoading ? "Saving..." : "Save"}
                        </button>
                    </div>
                </footer>

                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Pacifico&family=Satisfy&family=Allura&family=Caveat:wght@400;700&family=Sacramento&display=swap');

                    .signature-draw-backdrop {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.15);
                        z-index: 999;
                    }

                    .signature-draw-modal {
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        max-width: 600px;
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
                        gap: 16px;
                    }

                    .signature-draw-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin: 0;
                    }

                    .signature-draw-header h2 {
                        font-weight: 600;
                        font-size: 18px;
                        margin: 0;
                        color: #333;
                    }

                    .signature-draw-close-btn {
                        border: none;
                        background: transparent;
                        font-size: 20px;
                        cursor: pointer;
                        padding: 4px;
                        line-height: 1;
                        color: #555;
                        transition: color 0.2s ease-in-out;
                    }

                    .signature-draw-close-btn:hover:not(:disabled) {
                        color: #000;
                    }

                    .signature-draw-close-btn:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }

                    .signature-draw-tabs {
                        display: flex;
                        gap: 8px;
                        border-bottom: 1px solid #e5e7eb;
                        padding-bottom: 0;
                    }

                    .signature-draw-tab {
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

                    .signature-draw-tab:hover {
                        color: #333;
                    }

                    .signature-draw-tab.active {
                        color: #a2b5a1;
                        border-bottom-color: #a2b5a1;
                    }

                    .signature-draw-content {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }

                    .signature-draw-type-section {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }

                    .signature-draw-text-input {
                        padding: 10px 12px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-size: 14px;
                        font-family: inherit;
                        outline: none;
                        transition: border-color 0.2s ease-in-out;
                    }

                    .signature-draw-text-input:focus {
                        border-color: #a2b5a1;
                        box-shadow: 0 0 0 2px rgba(162, 181, 161, 0.1);
                    }

                    .signature-draw-font-select {
                        padding: 8px 12px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-size: 13px;
                        font-family: inherit;
                        background: white;
                        cursor: pointer;
                        outline: none;
                        transition: border-color 0.2s ease-in-out;
                    }

                    .signature-draw-font-select:focus {
                        border-color: #a2b5a1;
                        box-shadow: 0 0 0 2px rgba(162, 181, 161, 0.1);
                    }

                    .signature-draw-font-select option[value="dancing"] {
                        font-family: 'Dancing Script', cursive;
                    }

                    .signature-draw-font-select option[value="great-vibes"] {
                        font-family: 'Great Vibes', cursive;
                    }

                    .signature-draw-font-select option[value="pacifico"] {
                        font-family: 'Pacifico', cursive;
                    }

                    .signature-draw-font-select option[value="satisfy"] {
                        font-family: 'Satisfy', cursive;
                    }

                    .signature-draw-font-select option[value="allura"] {
                        font-family: 'Allura', cursive;
                    }

                    .signature-draw-font-select option[value="caveat"] {
                        font-family: 'Caveat', cursive;
                    }

                    .signature-draw-font-select option[value="sacramento"] {
                        font-family: 'Sacramento', cursive;
                    }

                    .signature-draw-canvas {
                        border: 2px solid #ddd;
                        border-radius: 4px;
                        background: white;
                        width: 100%;
                        height: 300px;
                        display: block;
                        touch-action: none;
                    }

                    .signature-draw-footer {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 12px;
                        margin-top: 8px;
                    }

                    .signature-draw-btn {
                        border-radius: 4px;
                        font-weight: 600;
                        padding: 8px 16px;
                        font-size: 14px;
                        cursor: pointer;
                        border: none;
                        transition: all 0.2s ease-in-out;
                    }

                    .signature-draw-clear-btn {
                        background: #f5f5f5;
                        color: #555;
                        border: 1px solid #ddd;
                    }

                    .signature-draw-clear-btn:hover:not(:disabled) {
                        background: #efefef;
                    }

                    .signature-draw-cancel-btn {
                        background: #eee;
                        color: #555;
                    }

                    .signature-draw-cancel-btn:hover:not(:disabled) {
                        background: #ddd;
                    }

                    .signature-draw-save-btn {
                        background: #a2b5a1;
                        color: white;
                    }

                    .signature-draw-save-btn:hover:not(:disabled) {
                        background: #8a9a8a;
                    }

                    .signature-draw-btn:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }
                `}</style>
            </div>
        </>
    );
};

export default SignatureDrawModal;

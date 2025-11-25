/* eslint-disable @typescript-eslint/no-explicit-any */
import { Document, Page, pdfjs } from "react-pdf";
import { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BillingIcon, DateIcon, SignatureIcon, StampPlaceholderIcon } from "./Icons";
import SignatureStampUploadModal from "./SignatureStampUploadModal";

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
    imageUrl?: string;
    imageData?: string;
}

interface Recipient {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface PdfViewerProps {
    fileUrl: string;
    textBoxes: TextBox[];
    moveTextBox: (id: string, x: number, y: number) => void;
    addTextBox: (box: TextBox) => void;
    removeTextBox: (id: string) => void;
    resizeTextBox: (id: string, width: number, height: number) => void;
    setSelectedTextBoxId: (id: string) => void;
    selectedTextBoxId: string | null;
    onDocumentLoadSuccess?: (pdf: any) => void;
    updateTextBox: (id: string, content: string) => void;
    isAssignmentMode?: boolean;
    recipients?: Recipient[];
    onUpdateTextBox?: (id: string, recipientId: number | null) => void;
    isSharedDocument?: boolean;
}

export default function PdfViewer({
    fileUrl,
    textBoxes,
    moveTextBox,
    addTextBox,
    removeTextBox,
    resizeTextBox,
    setSelectedTextBoxId,
    selectedTextBoxId,
    onDocumentLoadSuccess,
    updateTextBox,
    isAssignmentMode = false,
    recipients = [],
    onUpdateTextBox,
    isSharedDocument = false,
}: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [loadError, setLoadError] = useState<Error | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [pageDims, setPageDims] = useState<{ width: number; height: number }[]>([]);
    const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [uploadingImage, setUploadingImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);
    const [uploadingFieldType, setUploadingFieldType] = useState<"signature" | "stamp">("signature");
    const draggingRef = useRef<{
        id: string;
        page: number;
        startClientX: number;
        startClientY: number;
        origX: number;
        origY: number;
        lastX: number;
        lastY: number;
    } | null>(null);
    const resizingRef = useRef<{
        id: string;
        page: number;
        startClientX: number;
        startClientY: number;
        origWidth: number;
        origHeight: number;
    } | null>(null);

    useEffect(() => {
        setLoadError(null);
        const loadWorker = async () => {
            try {
                await pdfjs.getDocument({ data: new Uint8Array(0) }).promise;
            } catch {
                // ignore empty PDF error
            }
        };
        loadWorker();
    }, [fileUrl]);



    useEffect(() => {
        localStorage.setItem(`pdf-textboxes-${fileUrl}`, JSON.stringify(textBoxes));
    }, [textBoxes, fileUrl]);

    const handleDocumentLoadSuccess = (pdf: any) => {
        setLoadError(null);
        setNumPages(pdf.numPages);
        onDocumentLoadSuccess?.(pdf);
    };

    const handleError = (error: Error) => {
        console.error("Error loading PDF:", error);
        setLoadError(error);
    };

    const handleImageUpload = (textBoxId: string, file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            const textBox = textBoxes.find(tb => tb.id === textBoxId);
            if (textBox) {
                const imageKey = `pdf-image-${fileUrl}-${textBoxId}`;
                localStorage.setItem(imageKey, imageUrl);

                const updatedTextBoxes = textBoxes.map(tb =>
                    tb.id === textBoxId ? { ...tb, imageData: imageUrl } : tb
                );

                updateTextBox(textBoxId, textBox.content);
            }
            setUploadingImage(null);
        };
        reader.readAsDataURL(file);
    };

    const openUploadModal = (textBoxId: string, fieldType: "signature" | "stamp") => {
        setUploadingFieldId(textBoxId);
        setUploadingFieldType(fieldType);
        setShowUploadModal(true);
    };

    const handleModalUpload = (file: File) => {
        if (uploadingFieldId) {
            handleImageUpload(uploadingFieldId, file);
            setShowUploadModal(false);
            setUploadingFieldId(null);
        }
    };

    const triggerImageUpload = (textBoxId: string) => {
        setUploadingImage(textBoxId);
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const removeImage = (textBoxId: string) => {
        const imageKey = `pdf-image-${fileUrl}-${textBoxId}`;
        localStorage.removeItem(imageKey);
        const textBox = textBoxes.find(tb => tb.id === textBoxId);
        if (textBox) {
            updateTextBox(textBoxId, textBox.content);
        }
    };

    const getImageUrl = (textBoxId: string): string | undefined => {
        // First check if textBox has imageData property (from server/shared view)
        const textBox = textBoxes.find(tb => tb.id === textBoxId);
        if (textBox?.imageData) {
            return textBox.imageData;
        }

        // Fallback to localStorage for local editing
        const imageKey = `pdf-image-${fileUrl}-${textBoxId}`;
        return localStorage.getItem(imageKey) || undefined;
    };

    return (
        <div ref={containerRef}>
            <SignatureStampUploadModal
                isOpen={showUploadModal}
                fieldType={uploadingFieldType}
                onClose={() => setShowUploadModal(false)}
                onUpload={handleModalUpload}
            />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && uploadingImage) {
                        handleImageUpload(uploadingImage, file);
                    }
                    e.target.value = '';
                }}
            />
            <Document
                file={fileUrl}
                onLoadSuccess={handleDocumentLoadSuccess}
                onLoadError={handleError}
                loading={<div className="pdf-loading">Loading PDF...</div>}
                error={
                    <div className="pdf-error">
                        {loadError
                            ? `Error loading PDF: ${loadError.message}`
                            : "Error loading PDF. Please try again."}
                    </div>
                }
            >
                {Array.from(new Array(numPages), (_, i) => {
                    const pageNumber = i + 1;

                    return (
                        <>
                            <div
                                key={`page_${pageNumber}`}
                                style={{ position: "relative" }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.dataTransfer!.dropEffect = "copy";
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    try {
                                        const raw = e.dataTransfer?.getData("application/json");
                                        if (!raw) return;

                                        const payload = JSON.parse(raw);
                                        if (!payload || payload.type !== "field") return;

                                        const pageElem = e.currentTarget as HTMLDivElement;
                                        const rect = pageElem.getBoundingClientRect();
                                        const original = pageDims[pageNumber - 1];
                                        const scale = original ? rect.width / original.width : 1;
                                        const x = (e.clientX - rect.left) / scale;
                                        const y = (e.clientY - rect.top) / scale;

                                        const fieldType = payload.fieldType ?? "text";
                                        const existingNumbers = textBoxes
                                            .filter((tb) => tb.fieldType === fieldType)
                                            .map((tb) => {
                                                const match = tb.content.match(/\{\{(\w+)=(\d+)\}\}/);
                                                return match ? parseInt(match[2]) : -1;
                                            })
                                            .filter((num) => num >= 0);
                                        const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

                                        // Generate label like {{textbox=0}}, {{date=1}}, etc.
                                        // const content = fieldType;

                                        const lastId = localStorage.getItem('globalTextBoxId') || '0';
                                        const newIdNum = parseInt(lastId) + 1;
                                        localStorage.setItem('globalTextBoxId', newIdNum.toString());
                                        const id = `tb_${newIdNum}`;

                                        // Default dimensions per field type
                                        let width = Math.max(60, fieldType.length * 6 + 12);
                                        let height = 30;
                                        if (fieldType === "billing") {
                                            width = width + 120; // wider, resizable container for billing details
                                            height = 36;
                                        } else if (fieldType === "initials") {
                                            width = width + 42; // square-ish for initials
                                            height = 36;
                                        } else if (fieldType === "text") {
                                            width = width + 80; // square-ish for initials
                                            height = 36;
                                        } else if (fieldType === "signature") {
                                            width = 200; // wider for signature
                                            height = 80;
                                        } else if (fieldType === "stamp") {
                                            width = 120; // square-ish for stamp
                                            height = 120;
                                        }

                                        addTextBox({ id, page: pageNumber, x, y, content:'', fieldType, width, height });
                                    } catch (err) {
                                        console.error("Drop parse error", err);
                                    }
                                }}
                            >
                                <Page
                                    pageNumber={pageNumber}
                                    width={900}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    onRenderSuccess={(page) => {
                                        setPageDims((oldDims) => {
                                            const newDims = [...oldDims];
                                            newDims[pageNumber - 1] = {
                                                width: page.view[2],
                                                height: page.view[3],
                                            };
                                            return newDims;
                                        });
                                    }}
                                />

                                {/* Render dropped text labels */}
                                {pageDims[pageNumber - 1] &&
                                    textBoxes
                                        .filter((tb) => tb.page === pageNumber)
                                        .map((tb) => {
                                            const pageNode =
                                                containerRef.current?.querySelectorAll(
                                                    ".react-pdf__Page"
                                                )[pageNumber - 1] as HTMLElement | undefined;
                                            const renderedWidth = pageNode
                                                ? pageNode.getBoundingClientRect().width
                                                : 900;
                                            const scale = pageDims[pageNumber - 1]
                                                ? renderedWidth / pageDims[pageNumber - 1].width
                                                : 1;
                                            const left = tb.x * scale;
                                            const top = tb.y * scale;

                                            const onPointerDown = (e: React.PointerEvent) => {
                                                (e.target as Element).setPointerCapture(e.pointerId);
                                                draggingRef.current = {
                                                    id: tb.id,
                                                    page: pageNumber,
                                                    startClientX: e.clientX,
                                                    startClientY: e.clientY,
                                                    origX: tb.x,
                                                    origY: tb.y,
                                                    lastX: tb.x,
                                                    lastY: tb.y,
                                                };
                                                setSelectedTextBoxId(tb.id);

                                                const onPointerMove = (moveEv: PointerEvent) => {
                                                    if (!draggingRef.current) return;
                                                    const d = draggingRef.current;
                                                    const pageIdx = d.page - 1;
                                                    const pn =
                                                        containerRef.current?.querySelectorAll(
                                                            ".react-pdf__Page"
                                                        )[pageIdx] as HTMLElement | undefined;
                                                    if (!pn || !pageDims[pageIdx]) return;
                                                    const rect = pn.getBoundingClientRect();
                                                    const currentScale = pageDims[pageIdx]
                                                        ? rect.width / pageDims[pageIdx].width
                                                        : 1;
                                                    const deltaX =
                                                        (moveEv.clientX - d.startClientX) / currentScale;
                                                    const deltaY =
                                                        (moveEv.clientY - d.startClientY) / currentScale;
                                                    let newX = d.origX + deltaX;
                                                    let newY = d.origY + deltaY;

                                                    // Clamp while dragging so box stays fully inside page
                                                    const pageDim = pageDims[pageIdx];
                                                    const currentTb = textBoxes.find(t => t.id === d.id);
                                                    const tbWidth = currentTb ? (currentTb.width || (currentTb.fieldType === "billing" ? 220 : 60)) : 60;
                                                    const tbHeight = currentTb ? (currentTb.height || 36) : 36;
                                                    newX = Math.max(0, Math.min(newX, pageDim.width - (tbWidth - 100)));
                                                    newY = Math.max(0, Math.min(newY, pageDim.height - tbHeight));

                                                    d.lastX = newX;
                                                    d.lastY = newY;
                                                    moveTextBox(d.id, newX, newY);
                                                };

                                                const onPointerUp = (upEv: PointerEvent) => {
                                                    try {
                                                        (e.target as Element).releasePointerCapture(
                                                            e.pointerId
                                                        );
                                                    } catch { }
                                                    if (draggingRef.current) {
                                                        const d = draggingRef.current;
                                                        const pageDim = pageDims[d.page - 1];
                                                        if (pageDim) {
                                                            const tb = textBoxes.find(t => t.id === d.id);
                                                            if (tb) {
                                                                let mvTbWidth = tb.width || 0
                                                                console.log(tb,'tbtbtbtb')
                                                                if ((tb.fieldType === "billing" || tb.fieldType === "initials" || tb.fieldType === "text") && tb.width) {
                                                                    mvTbWidth = tb.width - (tb.width/3.15);
                                                                }
                                                                const clampedX = Math.max(0, Math.min(d.lastX, pageDim.width - mvTbWidth));
                                                                const clampedY = Math.max(0, Math.min(d.lastY, pageDim.height - (tb.height || 0)));
                                                                moveTextBox(d.id, clampedX, clampedY);
                                                            }
                                                        }
                                                    }
                                                    window.removeEventListener(
                                                        "pointermove",
                                                        onPointerMove
                                                    );
                                                    window.removeEventListener("pointerup", onPointerUp);
                                                    draggingRef.current = null;
                                                };

                                                window.addEventListener("pointermove", onPointerMove);
                                                window.addEventListener("pointerup", onPointerUp);
                                            };

                                            const isBilling = tb.fieldType === "billing";
                                            const isInitials = tb.fieldType === "initials";
                                            const isTextBox = tb.fieldType === "text";
                                            const isSignature = tb.fieldType === "signature";
                                            const isStamp = tb.fieldType === "stamp";
                                            const hasImage = (isSignature || isStamp) && getImageUrl(tb.id);
                                            const borderColor = tb.recipientId ? "#249d67" : "#ff6b6b";
                                            const backgroundColor = isAssignmentMode ? (tb.recipientId ? "#d4edda" : "#ffe0e0") : "#97c2b566";
                                            return (
                                                <div
                                                    key={tb.id}
                                                    style={{
                                                        position: "absolute",
                                                        left,
                                                        top,
                                                        zIndex: 10,
                                                    }}
                                                    onPointerDown={!isAssignmentMode && !isSharedDocument ? onPointerDown : undefined}
                                                >
                                                    <div
                                                        style={{
                                                            background: hasImage ? 'transparent' : backgroundColor,
                                                            width: (isBilling || isInitials || isTextBox || isSignature || isStamp) ? tb.width : 'auto',
                                                            height: (isBilling || isInitials || isTextBox || isSignature || isStamp) ? tb.height || 36 : 'auto',
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            border: hasImage
                                                                ? '1px solid #d1d5db'
                                                                : (tb.id === selectedTextBoxId || isAssignmentMode
                                                                    ? `2px solid ${borderColor}`
                                                                    : `1px solid ${isAssignmentMode ? borderColor : "#49806e"}`),
                                                            borderRadius: "4px",
                                                            padding: (hasImage || isSignature || isStamp) ? "0" : "4px 8px",
                                                            color: "rgb(36,133,103)",
                                                            fontWeight: "bold",
                                                            fontSize: "14px",
                                                            fontFamily: "monospace",
                                                            cursor: isAssignmentMode ? "default" : (isSharedDocument ? "pointer" : "move"),
                                                            userSelect: "none",
                                                            boxSizing: "border-box",
                                                        }}
                                                        onPointerDown={!isAssignmentMode && !isSharedDocument ? (e) => {
                                                            // Allow dragging from the border/padding area of date fields
                                                            const target = e.target as HTMLElement;
                                                            if (target.style.cursor === 'pointer') {
                                                                // Clicked on the date content, don't drag
                                                                return;
                                                            }
                                                            // Clicked on border/padding, allow drag
                                                            onPointerDown(e);
                                                        } : undefined}
                                                    >
                                                        {/* Editable content area behaving like a textarea while preserving styling */}
                                                        {(isSignature || isStamp) ? (
                                                            getImageUrl(tb.id) ? (
                                                                <div
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        position: 'relative',
                                                                    }}
                                                                >
                                                                    <img
                                                                        src={getImageUrl(tb.id)}
                                                                        alt={isSignature ? "Signature" : "Stamp"}
                                                                        style={{
                                                                            maxWidth: tb.width ? `${tb.width}px` : '100%',
                                                                            maxHeight: tb.height ? `${tb.height}px` : '100%',
                                                                            width: 'auto',
                                                                            height: 'auto',
                                                                            objectFit: 'contain',
                                                                            pointerEvents: 'none',
                                                                        }}
                                                                    />
                                                                    {!isAssignmentMode && (
                                                                        <div
                                                                            style={{
                                                                                position: 'absolute',
                                                                                bottom: '4px',
                                                                                left: '4px',
                                                                                display: 'flex',
                                                                                gap: '4px',
                                                                            }}
                                                                        >
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    removeImage(tb.id);
                                                                                }}
                                                                                style={{
                                                                                    padding: '4px 8px',
                                                                                    fontSize: '10px',
                                                                                    background: '#ef4444',
                                                                                    color: 'white',
                                                                                    border: 'none',
                                                                                    borderRadius: '3px',
                                                                                    cursor: 'pointer',
                                                                                }}
                                                                                title="Remove image"
                                                                            >
                                                                                ×
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    onDoubleClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (!isAssignmentMode && !isSharedDocument) {
                                                                            openUploadModal(tb.id, isSignature ? "signature" : "stamp");
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        cursor: isAssignmentMode || isSharedDocument ? 'default' : 'pointer',
                                                                        color: tb.content ? '#2f7d6f' : 'inherit',
                                                                    }}
                                                                >
                                                                    {isSignature?
                                                                    <SignatureIcon />:<StampPlaceholderIcon />}
                                                                    {isSignature ? "Signature" : "Stamp"}
                                                                </div>
                                                            )
                                                        ) : tb.fieldType === "date" ? (
                                                            <div
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (!isAssignmentMode) {
                                                                        setShowDatePicker(tb.id);
                                                                        // Parse existing date if present
                                                                        const dateMatch = tb.content.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
                                                                        if (dateMatch) {
                                                                            const [month, day, year] = dateMatch[0].split('/').map(Number);
                                                                            setSelectedDate(new Date(year, month - 1, day));
                                                                        } else {
                                                                            setSelectedDate(null);
                                                                        }
                                                                    }
                                                                }}
                                                                onPointerDown={(e) => {
                                                                    // Prevent drag when clicking on date field content
                                                                    e.stopPropagation();
                                                                }}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    outline: 'none',
                                                                    border: 'none',
                                                                    background: 'transparent',
                                                                    color: 'inherit',
                                                                    font: 'inherit',
                                                                    whiteSpace: 'pre-wrap',
                                                                    overflowWrap: 'anywhere',
                                                                    lineHeight: '1.2',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    pointerEvents: 'auto',
                                                                    gap: '4px',
                                                                }}
                                                            >
                                                                {(tb.content !== 'date' && tb.content) || 'Select Date'}
                                                                <DateIcon />
                                                            </div>
                                                        ) : (
                                                            <>
                                                            <textarea
                                                                value={tb.content}
                                                                placeholder={
                                                                    tb.fieldType === "signature" ? "Signature" :
                                                                    tb.fieldType === "initials" ? "Initials" :
                                                                    tb.fieldType === "stamp" ? "Stamp" :
                                                                    tb.fieldType === "billing" ? "Billing details" :
                                                                    "Enter value"
                                                                }
                                                                readOnly={isAssignmentMode}
                                                                onClick={(e) => e.stopPropagation()}
                                                                onChange={(e) => {
                                                                    if (!isAssignmentMode) {
                                                                        updateTextBox(tb.id, e.target.value);
                                                                    }
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    // Allow Shift+Enter for new line
                                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                                        // Optional: prevent default Enter behavior if you want
                                                                        // e.preventDefault();
                                                                    }
                                                                }}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    outline: 'none',
                                                                    border: 'none',
                                                                    background: 'transparent',
                                                                    color: 'inherit',
                                                                    font: 'inherit',
                                                                    fontSize: '14px',
                                                                    fontWeight: 'bold',
                                                                    fontFamily: 'monospace',
                                                                    cursor: isAssignmentMode ? 'default' : 'text',
                                                                    padding: '0',
                                                                    direction: 'ltr',
                                                                    textAlign: 'center',
                                                                    resize: 'none',
                                                                    overflow: 'hidden',
                                                                    whiteSpace: 'pre-wrap',
                                                                    wordWrap: 'break-word',
                                                                }}
                                                            />
                                                            </>
                                                        )}
                                                        {showDatePicker === tb.id && tb.fieldType === "date" && (
                                                            <div
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '100%',
                                                                    left: 0,
                                                                    zIndex: 1000,
                                                                    marginTop: '4px',
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <DatePicker
                                                                    selected={selectedDate}
                                                                    onChange={(date: Date | null) => {
                                                                        if (date) {
                                                                            const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
                                                                            updateTextBox(tb.id, formattedDate);
                                                                            setSelectedDate(date);
                                                                        }
                                                                        setShowDatePicker(null);
                                                                    }}
                                                                    onClickOutside={() => setShowDatePicker(null)}
                                                                    inline
                                                                />
                                                            </div>
                                                        )}
                                                        {isAssignmentMode && (
                                                            <div
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '100%',
                                                                    left: '50%',
                                                                    transform: 'translateX(-50%)',
                                                                    background: 'white',
                                                                    borderRadius: '4px',
                                                                    border: '1px solid #ccc',
                                                                    boxShadow: "0px 2px 8px rgba(0,0,0,0.15)",
                                                                    marginTop: "6px",
                                                                    whiteSpace: "nowrap",
                                                                    zIndex: "999",
                                                                    marginLeft: "8px",
                                                                    display: "inline-block",
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <select
                                                                    value={tb.recipientId || ""}
                                                                    onChange={(e) => {
                                                                        const recipientId = e.target.value ? parseInt(e.target.value) : null;
                                                                        onUpdateTextBox?.(tb.id, recipientId);
                                                                    }}
                                                                    style={{
                                                                        padding: "6px 8px",
                                                                        fontSize: "12px",
                                                                        border: "none",
                                                                        borderRadius: "2px",
                                                                        cursor: "pointer",
                                                                        fontFamily: "inherit",
                                                                        backgroundColor: "#fff",
                                                                    }}
                                                                >
                                                                    <option value="">Assign Reciepent</option>
                                                                    {recipients.map((recipient) => (
                                                                        <option key={recipient.id} value={recipient.id}>
                                                                            {recipient.first_name} {recipient.last_name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        )}
                                                        {tb.id === selectedTextBoxId && !isSharedDocument && (
                                                            <>
                                                                {(isBilling || isInitials || isTextBox || isSignature || isStamp) && (
                                                                    <div
                                                                        style={{
                                                                            position: "absolute",
                                                                            right: -5,
                                                                            bottom: -5,
                                                                            width: 10,
                                                                            height: 10,
                                                                            background: "#49806e",
                                                                            cursor: "se-resize",
                                                                            borderRadius: "2px",
                                                                        }}
                                                                        onPointerDown={(e) => {
                                                                            e.stopPropagation();
                                                                            (e.target as Element).setPointerCapture(e.pointerId);
                                                                            const tbWidth = tb.width || (isBilling ? 220 : 60);
                                                                            const tbHeight = tb.height || 36;
                                                                            resizingRef.current = {
                                                                                id: tb.id,
                                                                                page: pageNumber,
                                                                                startClientX: e.clientX,
                                                                                startClientY: e.clientY,
                                                                                origWidth: tbWidth,
                                                                                origHeight: tbHeight,
                                                                            };

                                                                            const onPointerMove = (moveEv: PointerEvent) => {
                                                                                if (!resizingRef.current) return;
                                                                                const r = resizingRef.current;
                                                                                const pageIdx = r.page - 1;
                                                                                const pn =
                                                                                    containerRef.current?.querySelectorAll(
                                                                                        ".react-pdf__Page"
                                                                                    )[pageIdx] as HTMLElement | undefined;
                                                                                if (!pn || !pageDims[pageIdx]) return;
                                                                                const rect = pn.getBoundingClientRect();
                                                                                const currentScale = pageDims[pageIdx]
                                                                                    ? rect.width / pageDims[pageIdx].width
                                                                                    : 1;
                                                                                const deltaX =
                                                                                    (moveEv.clientX - r.startClientX) / currentScale;
                                                                                const deltaY =
                                                                                    (moveEv.clientY - r.startClientY) / currentScale;
                                                                                // Clamp resizing so the box cannot extend outside the page bounds
                                                                                const pageDim = pageDims[pageIdx];
                                                                                const currentTb = textBoxes.find(t => t.id === r.id);
                                                                                const tbX = currentTb ? currentTb.x : 0;
                                                                                const tbY = currentTb ? currentTb.y : 0;
                                                                                // Account for padding (8px left + 8px right = 16px) and border (2px each side = 4px) = 20px total
                                                                                // let paddingAndBorder = (isTextBox&& 104) || (isBilling && 80) || (isInitials && 140) || 0;
                                                                                const maxWidth = Math.max(40, pageDim.width - tbX);
                                                                                const maxHeight = Math.max(24, pageDim.height - tbY);
                                                                                const nextWidth = Math.max(40, r.origWidth + deltaX);
                                                                                const nextHeight = Math.max(24, r.origHeight + deltaY);
                                                                                const newWidth = Math.min(nextWidth, maxWidth);
                                                                                const newHeight = Math.min(nextHeight, maxHeight);
                                                                                resizeTextBox(r.id, newWidth, newHeight);
                                                                            };

                                                                            const onPointerUp = (upEv: PointerEvent) => {
                                                                                try {
                                                                                    (e.target as Element).releasePointerCapture(
                                                                                        e.pointerId
                                                                                    );
                                                                                } catch { }
                                                                                window.removeEventListener(
                                                                                    "pointermove",
                                                                                    onPointerMove
                                                                                );
                                                                                window.removeEventListener("pointerup", onPointerUp);
                                                                                resizingRef.current = null;
                                                                            };

                                                                            window.addEventListener("pointermove", onPointerMove);
                                                                            window.addEventListener("pointerup", onPointerUp);
                                                                        }}
                                                                    />
                                                                )}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        removeTextBox(tb.id);
                                                                    }}
                                                                    style={{
                                                                        position: "absolute",
                                                                        right: -10,
                                                                        top: -10,
                                                                        width: 20,
                                                                        height: 20,
                                                                        borderRadius: 10,
                                                                        background: "#ef4444",
                                                                        color: "#fff",
                                                                        border: "none",
                                                                        cursor: "pointer",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        fontSize: 12,
                                                                        zIndex: 20,
                                                                    }}
                                                                >
                                                                    ×
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                            </div>
                            {pageNumber < numPages && (
                                <div
                                    style={{
                                        height: '1px',
                                        backgroundColor: '#ccc',
                                        margin: '8px 0',
                                        width: '100%',
                                    }}
                                />
                            )}
                        </>
                    );
                })}
                <div style={{ height: '30px' }} />
            </Document>
        </div>
    );
}

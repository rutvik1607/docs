/* eslint-disable @typescript-eslint/no-explicit-any */
import { Document, Page, pdfjs } from "react-pdf";
import { useState, useRef, useEffect } from "react";

interface TextBox {
    id: string;
    page: number;
    x: number;
    y: number;
    content: string;
    fieldType?: string;
    width?: number;
    height?: number;
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
}: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [loadError, setLoadError] = useState<Error | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [pageDims, setPageDims] = useState<{ width: number; height: number }[]>([]);
    const draggingRef = useRef<{
        id: string;
        page: number;
        startClientX: number;
        startClientY: number;
        origX: number;
        origY: number;
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

    const handleDocumentLoadSuccess = (pdf: any) => {
        setLoadError(null);
        setNumPages(pdf.numPages);
        onDocumentLoadSuccess?.(pdf);
    };

    const handleError = (error: Error) => {
        console.error("Error loading PDF:", error);
        setLoadError(error);
    };

    return (
        <div ref={containerRef}>
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
                                        const sameTypeCount = textBoxes.filter(
                                            (tb) => tb.fieldType === fieldType
                                        ).length;

                                        // Generate label like {{textbox=0}}, {{date=1}}, etc.
                                        const content = `{{${fieldType}=${sameTypeCount}}}`;

                                        const id =
                                            typeof crypto !== "undefined" && (crypto as any).randomUUID
                                                ? (crypto as any).randomUUID()
                                                : `tb_${Date.now()}`;

                                        addTextBox({ id, page: pageNumber, x, y, content, fieldType, ...(fieldType === "billing" ? { width: 127, height: 30 } : {}) });
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
                                                    const newX = d.origX + deltaX;
                                                    const newY = d.origY + deltaY;
                                                    moveTextBox(d.id, newX, newY);
                                                };

                                                const onPointerUp = (upEv: PointerEvent) => {
                                                    try {
                                                        (e.target as Element).releasePointerCapture(
                                                            e.pointerId
                                                        );
                                                    } catch {}
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
                                            return (
                                                <div
                                                    key={tb.id}
                                                    style={{
                                                        position: "absolute",
                                                        left,
                                                        top,
                                                        ...(isBilling ? { width: tb.width || 100, height: tb.height || 30, display: "flex", alignItems: "center", justifyContent: "center" } : {}),
                                                        zIndex: 10,
                                                        background: "#e8f2ef",
                                                        border:
                                                            tb.id === selectedTextBoxId
                                                                ? "2px solid #49806e"
                                                                : "1px solid #49806e",
                                                        borderRadius: "4px",
                                                        padding: "4px 8px",
                                                        color: "rgb(36,133,103)",
                                                        fontWeight: "bold",
                                                        fontSize: "14px",
                                                        fontFamily: "monospace",
                                                        cursor: "move",
                                                        userSelect: "none",
                                                        ...(isBilling ? { boxSizing: "border-box" } : {}),
                                                    }}
                                                    onPointerDown={onPointerDown}
                                                >
                                                    {tb.content}
                                                    {tb.id === selectedTextBoxId && isBilling && (
                                                        <>
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
                                                                    const tbWidth = tb.width || 100;
                                                                    const tbHeight = tb.height || 30;
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
                                                                        const newWidth = Math.max(50, r.origWidth + deltaX);
                                                                        const newHeight = Math.max(20, r.origHeight + deltaY);
                                                                        resizeTextBox(r.id, newWidth, newHeight);
                                                                    };

                                                                    const onPointerUp = (upEv: PointerEvent) => {
                                                                        try {
                                                                            (e.target as Element).releasePointerCapture(
                                                                                e.pointerId
                                                                            );
                                                                        } catch {}
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
            </Document>
        </div>
    );
}

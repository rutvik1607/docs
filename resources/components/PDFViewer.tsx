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
}

interface PdfViewerProps {
    fileUrl: string;
    textBoxes: TextBox[];
    updateTextBox: (id: string, content: string) => void;
    moveTextBox: (id: string, x: number, y: number) => void;
    addTextBox: (box: TextBox) => void;
    removeTextBox: (id: string) => void;
    setSelectedTextBoxId: (id: string) => void;
    selectedTextBoxId: string | null;
    onDocumentLoadSuccess?: (pdf: any) => void;
}

export default function PdfViewer({
    fileUrl,
    textBoxes,
    updateTextBox,
    moveTextBox,
    addTextBox,
    removeTextBox,
    setSelectedTextBoxId,
    selectedTextBoxId,
    onDocumentLoadSuccess,
}: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [loadError, setLoadError] = useState<Error | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [pageDims, setPageDims] = useState<
        { width: number; height: number }[]
    >([]);
    // dragging state ref to allow moving placed boxes
    const draggingRef = useRef<{
        id: string;
        page: number;
        startClientX: number;
        startClientY: number;
        origX: number;
        origY: number;
    } | null>(null);

    useEffect(() => {
        setLoadError(null); // Reset error when fileUrl changes
        
        // Initialize PDF.js worker
        const loadWorker = async () => {
            try {
                await pdfjs.getDocument({ data: new Uint8Array(0) }).promise;
            } catch (e) {
                // Ignore the empty document error, we just want to ensure the worker is loaded
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
        console.error('Error loading PDF:', error);
        setLoadError(error);
    };

    return (
        <div
            ref={containerRef}
        >
            <Document
                file={fileUrl}
                onLoadSuccess={handleDocumentLoadSuccess}
                onLoadError={handleError}
                loading={<div className="pdf-loading">Loading PDF...</div>}
                error={
                    <div className="pdf-error">
                        {loadError ? 
                            `Error loading PDF: ${loadError.message}` : 
                            'Error loading PDF. Please try again.'}
                    </div>
                }
            >
                {Array.from(new Array(numPages), (_, i) => {
                    const pageNumber = i + 1;
                    return (
                        <div
                            key={`page_${pageNumber}`}
                            style={{ position: "relative" }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer!.dropEffect = 'copy';
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                // handle drop into this page
                                try {
                                    const data = e.dataTransfer?.getData('application/json');
                                    const payload = data ? JSON.parse(data) : null;
                                    const pageElem = e.currentTarget as HTMLDivElement;
                                    const rect = pageElem.getBoundingClientRect();
                                    const original = pageDims[pageNumber - 1];
                                    const scale = original ? rect.width / original.width : 1;
                                    const x = (e.clientX - rect.left) / scale;
                                    const y = (e.clientY - rect.top) / scale;
                                    const id = (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : `tb_${Date.now()}`;
                                    const content = payload?.label ?? payload?.type ?? 'Text field';
                                    const fieldType = payload?.fieldType ?? 'text';
                                    addTextBox({ id, page: pageNumber, x, y, content, fieldType });
                                } catch (err) {
                                    console.error('Drop parse error', err);
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

                            {/* Render text boxes for this page */}
                            {pageDims[pageNumber - 1] && (
                                textBoxes
                                    .filter((tb) => tb.page === pageNumber)
                                    .map((tb) => {
                                        const pageNode = containerRef.current?.querySelectorAll('.react-pdf__Page')[pageNumber - 1] as HTMLElement | undefined;
                                        const renderedWidth = pageNode ? pageNode.getBoundingClientRect().width : 900;
                                        const scale = pageDims[pageNumber - 1]
                                            ? renderedWidth / pageDims[pageNumber - 1].width
                                            : 1;
                                        const left = tb.x * scale;
                                        const top = tb.y * scale;

                                        const onPointerDown = (e: React.PointerEvent) => {
                                            // start dragging
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
                                                try {
                                                    const d = draggingRef.current;
                                                    const pageIdx = d.page - 1;
                                                    const pn = containerRef.current?.querySelectorAll('.react-pdf__Page')[pageIdx] as HTMLElement | undefined;
                                                    if (!pn || !pageDims[pageIdx]) return;
                                                    const rect = pn.getBoundingClientRect();
                                                    const currentScale = pageDims[pageIdx] ? rect.width / pageDims[pageIdx].width : 1;
                                                    const deltaX = (moveEv.clientX - d.startClientX) / currentScale;
                                                    const deltaY = (moveEv.clientY - d.startClientY) / currentScale;
                                                    const newX = d.origX + deltaX;
                                                    const newY = d.origY + deltaY;
                                                    moveTextBox(d.id, newX, newY);
                                                } catch (err) {
                                                    console.error('drag move error', err);
                                                }
                                            };

                                            const onPointerUp = (upEv: PointerEvent) => {
                                                try {
                                                    (e.target as Element).releasePointerCapture(e.pointerId);
                                                } catch {}
                                                window.removeEventListener('pointermove', onPointerMove);
                                                window.removeEventListener('pointerup', onPointerUp);
                                                draggingRef.current = null;
                                            };

                                            window.addEventListener('pointermove', onPointerMove);
                                            window.addEventListener('pointerup', onPointerUp);
                                        };

                                        // Render field based on its type
                                        const commonStyle: React.CSSProperties = {
                                            minWidth: 80,
                                            maxWidth: 300,
                                            padding: 4,
                                            border: tb.id === selectedTextBoxId ? '2px solid #2563eb' : '1px solid rgba(0,0,0,0.2)',
                                            background: 'rgba(255,255,255,0.9)',
                                            touchAction: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                        };

                                        const renderField = () => {
                                            switch (tb.fieldType) {
                                                case 'signature':
                                                    return (
                                                        <div
                                                            style={{ ...commonStyle, width: 180, height: 60, justifyContent: 'center' }}
                                                            onPointerDown={onPointerDown}
                                                            onDoubleClick={(e) => e.stopPropagation()}
                                                        >
                                                            <div style={{ textAlign: 'center', width: '100%' }}>
                                                                <div style={{ fontSize: 12, color: '#6b7280' }}>Signature</div>
                                                                <div style={{ marginTop: 6, height: 24, borderBottom: '1px dashed #9ca3af' }} />
                                                            </div>
                                                        </div>
                                                    );
                                                case 'checkbox':
                                                    return (
                                                        <label style={{ ...commonStyle, width: 'auto', gap: 8 }} onPointerDown={onPointerDown}>
                                                            <input
                                                                type="checkbox"
                                                                checked={tb.content === 'checked'}
                                                                onChange={(e) => updateTextBox(tb.id, e.target.checked ? 'checked' : 'unchecked')}
                                                            />
                                                            <span style={{ fontSize: 12 }}>{tb.content || 'Checkbox'}</span>
                                                        </label>
                                                    );
                                                case 'radio':
                                                    return (
                                                        <label style={{ ...commonStyle, width: 'auto', gap: 8 }} onPointerDown={onPointerDown}>
                                                            <input
                                                                type="radio"
                                                                name={`radio_${tb.page}`}
                                                                checked={tb.content === 'selected'}
                                                                onChange={(e) => updateTextBox(tb.id, 'selected')}
                                                            />
                                                            <span style={{ fontSize: 12 }}>{tb.content || 'Option'}</span>
                                                        </label>
                                                    );
                                                case 'date':
                                                    return (
                                                        <input
                                                            type="date"
                                                            value={tb.content}
                                                            onChange={(e) => updateTextBox(tb.id, e.target.value)}
                                                            onPointerDown={onPointerDown}
                                                            style={{ ...commonStyle, width: 160 }}
                                                        />
                                                    );
                                                case 'initials':
                                                    return (
                                                        <input
                                                            type="text"
                                                            value={tb.content}
                                                            maxLength={5}
                                                            onChange={(e) => updateTextBox(tb.id, e.target.value)}
                                                            onPointerDown={onPointerDown}
                                                            style={{ ...commonStyle, width: 80 }}
                                                        />
                                                    );
                                                case 'dropdown':
                                                    return (
                                                        <select
                                                            value={tb.content}
                                                            onChange={(e) => updateTextBox(tb.id, e.target.value)}
                                                            onPointerDown={onPointerDown}
                                                            style={{ ...commonStyle, width: 160 }}
                                                        >
                                                            <option value="">Select</option>
                                                            <option value="option1">Option 1</option>
                                                            <option value="option2">Option 2</option>
                                                        </select>
                                                    );
                                                case 'billing':
                                                    return (
                                                        <textarea
                                                            value={tb.content}
                                                            onChange={(e) => updateTextBox(tb.id, e.target.value)}
                                                            onPointerDown={onPointerDown}
                                                            style={{ ...commonStyle, width: 220, height: 80, resize: 'none' }}
                                                        />
                                                    );
                                                case 'stamp':
                                                    return (
                                                        <div
                                                            style={{ ...commonStyle, width: 100, height: 40, justifyContent: 'center' }}
                                                            onPointerDown={onPointerDown}
                                                        >
                                                            <div style={{ fontWeight: 'bold' }}>�STAMP�</div>
                                                        </div>
                                                    );
                                                default:
                                                    // text
                                                    return (
                                                        <textarea
                                                            value={tb.content}
                                                            onChange={(e) => updateTextBox(tb.id, e.target.value)}
                                                            onPointerDown={onPointerDown}
                                                            onDoubleClick={(e) => e.stopPropagation()}
                                                            style={{ ...commonStyle, resize: 'both' }}
                                                        />
                                                    );
                                            }
                                        };

                                        return (
                                            <div key={tb.id} style={{ position: 'absolute', left, top, zIndex: 10 }}>
                                                {renderField()}
                                                {tb.id === selectedTextBoxId && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeTextBox(tb.id);
                                                        }}
                                                        style={{
                                                            position: 'absolute',
                                                            right: -10,
                                                            top: -10,
                                                            width: 20,
                                                            height: 20,
                                                            borderRadius: 10,
                                                            background: '#ef4444',
                                                            color: '#fff',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: 12,
                                                            zIndex: 20,
                                                        }}
                                                        title="Remove field"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                            )}
                        </div>
                    );
                })}
            </Document>
        
        </div>
    );
}

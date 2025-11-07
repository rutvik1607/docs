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
                                // handle drop into this page only for our sidebar field payloads
                                try {
                                    const raw = e.dataTransfer?.getData('application/json');
                                    if (!raw) return; // ignore drops without our payload

                                    const payload = JSON.parse(raw);
                                    // Only accept drops that came from our RightSidebar (marked with type: 'field')
                                    if (!payload || payload.type !== 'field') return;

                                    const pageElem = e.currentTarget as HTMLDivElement;
                                    const rect = pageElem.getBoundingClientRect();
                                    const original = pageDims[pageNumber - 1];
                                    const scale = original ? rect.width / original.width : 1;
                                    const x = (e.clientX - rect.left) / scale;
                                    const y = (e.clientY - rect.top) / scale;

                                    const id = (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : `tb_${Date.now()}`;
                                    const content = payload.label ?? 'Text field';
                                    const fieldType = payload.fieldType ?? 'text';
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
                                            borderRadius: '2px',
                                            display: 'block',
                                            fontFamily: 'sans-serif',
                                            fontSize: '14px',
                                            height: '100%',
                                            minWidth: 80,
                                            maxWidth: 300,
                                            padding: 4,
                                            border: tb.id === selectedTextBoxId ? '2px solid #49806e' : '1px solid #49806e',
                                            touchAction: 'none',
                                            alignItems: 'center',
                                            backgroundColor: '#e8f2ef', 
                                            zIndex: 10
                                        };

                                        const renderField = () => {
                                            switch (tb.fieldType) {
                                                case 'signature':
                                                    return (
                                                        <div
                                                            style={{ ...commonStyle, width: 180, height: 60, justifyContent: 'center', background: '#e8f2ef !important', }}
                                                            onPointerDown={onPointerDown}
                                                            onDoubleClick={(e) => e.stopPropagation()}
                                                        >
                                                            <div style={{ textAlign: 'center', justifyContent:'center', width: '100%', display:'flex', alignItems:'center', padding:'8px',  gap:'0', fontWeight:'bold' }}>
                                                                <svg  style={{ width: '24px', height: '24px', fill:'rgb(36, 133, 103)', flexShrink:0, overflow:'hidden', display:'block' }} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" data-testid="icon" data-sentry-element="SvgIconComponent" data-sentry-component="SignaturePlaceholderIconComponent" data-sentry-source-file="signature_placeholder_icon.tsx" role="presentation"><path d="M8 6.95L12.95 2l1.06 1.06-4.95 4.95L8 6.95zm11.36-1.47l-2.83-2.83L6.17 13.01l-1.44 4.27L9 15.84 19.36 5.48zM3 21.01h18v-2H3v2z"></path></svg>
                                                                Signature
                                                            </div>
                                                        </div>
                                                    );
                                                case 'date':
                                                    return (
                                                        <input
                                                            type="date"
                                                            value={tb.content}
                                                            onChange={(e) => updateTextBox(tb.id, e.target.value)}
                                                            onPointerDown={onPointerDown}
                                                            style={{ ...commonStyle, width: 160, textAlign: 'center' }}
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
                                                            style={{ ...commonStyle, width: '100px', height: '68px', top: '215px', left: '240.5px', touchAction: 'none', pointerEvents: 'inherit' }}
                                                        />
                                                    );
                                                case 'billing':
                                                    return (
                                                        <textarea
                                                            value={tb.content}
                                                            onChange={(e) => updateTextBox(tb.id, e.target.value)}
                                                            onPointerDown={onPointerDown}
                                                            style={{ ...commonStyle, width: 220, height: 80, resize: 'none', textAlign: 'center' }}
                                                        />
                                                    );
                                                case 'stamp':
                                                    return (
                                                        <div
                                                            style={{ ...commonStyle, display:'flex', alignItems:'center', width: '150px', height: '150px', top: '304px', left: '240.5px', touchAction: 'none', pointerEvents: 'inherit' }}
                                                            onPointerDown={onPointerDown}
                                                        >
                                                            <div style={{ textAlign: 'center', width: '100%', display:'flex', justifyContent:'center', alignItems:'center', padding:'8px',  gap:'0', fontWeight:'bold' }}>
                                                            <svg style={{ width: '24px', height: '24px', fill:'rgb(36, 133, 103)', flexShrink:0, overflow:'hidden', display:'block' }} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" data-testid="icon" data-sentry-element="SvgIconComponent" data-sentry-component="SignaturePlaceholderIconComponent" data-sentry-source-file="signature_placeholder_icon.tsx" role="presentation"><g clip-path="url(#Stamp_svg__a)"><path fill-rule="evenodd" d="M12 11l1.79-5.483C13.696 4.707 12.977 4 12 4c-.976 0-1.694.701-1.79 1.508zm2 0l1.8-5.308C15.798 3.652 14.097 2 12 2c-1.341 0-2.52.674-3.196 1.692a3.6 3.6 0 00-.605 2h.002L10 11H4v6h16v-6zm7 8H3v2h18z" clip-rule="evenodd"></path></g><defs><clipPath id="Stamp_svg__a"><path d="M0 0h24v24H0z"></path></clipPath></defs></svg>
                                                            STAMP
                                                            </div>
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
                                                            style={{ ...commonStyle, resize: 'both', height:'30px',width:'167px', }}
                                                            id="text-box"
                                                            name="text-box"
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

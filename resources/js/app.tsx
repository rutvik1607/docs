import "./bootstrap";
import "../css/app.css";

import ReactDOM from "react-dom/client";
import React, { useState, useRef } from "react";
import { pdfjs } from "react-pdf";
import PdfViewer from "../components/PDFViewer";
import RightSidebar from "../components/RightSidebar";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { uploadPdf, saveFieldAssignments } from "./api/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useParams, useLocation, BrowserRouter } from "react-router-dom";
import RecipientModal from "../components/Reciepents";

// Initialize PDF.js worker
if (typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

const App = () => {
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
    }

    interface Recipient {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
    }

    const [textBoxes, setTextBoxes] = React.useState<TextBox[]>([]);
    const hasFetchedRef = React.useRef(false);
    const [selectedTextBoxId, setSelectedTextBoxIdState] = React.useState<string | null>(null);
    const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
    const [fileName, setFileName] = React.useState<string>("testing.pdf");
    const [numPages, setNumPages] = React.useState<number>(0);
    const [reciepentModal, setReciepentModal] = useState(false)
    const [isAssignmentMode, setIsAssignmentMode] = useState(false);
    const [recipients, setRecipients] = React.useState<Recipient[]>([]);

    const textBoxesRef = React.useRef<TextBox[]>(textBoxes);
    const rightSidebarRef = useRef<any>(null);

    const location = useLocation();
    const { fileName1 } = useParams();

    console.log("File Name:", fileName1);
    console.log("Current Path:", location.pathname);
    React.useEffect(() => {
        if (!hasFetchedRef.current) {
            hasFetchedRef.current = true;

            const fetchS3Pdf = async () => {
                try {
                    const response = await axios.get(`http://localhost:8000/api/test`);
                    console.log("response", response);
                } catch (error) {
                    console.error("Error fetching PDF from S3:", error);
                }
            };

            fetchS3Pdf();
        }
        const storedPdfUrl = "/storage/upload/testing.pdf";
        setPdfUrl(storedPdfUrl);

        // Load persisted textBoxes for this PDF
        const storageKey = `pdf-textBoxes-${storedPdfUrl}`;
        const savedTextBoxes = localStorage.getItem(storageKey);
        if (savedTextBoxes) {
            setTextBoxes(JSON.parse(savedTextBoxes));
        }
    }, []);

    // Update ref with latest textBoxes
    React.useEffect(() => {
        textBoxesRef.current = textBoxes;
    }, [textBoxes]);

    // Save textBoxes to localStorage on page unload or route change
    React.useEffect(() => {
        const saveToStorage = () => {
            if (pdfUrl) {
                const storageKey = `pdf-textBoxes-${pdfUrl}`;
                localStorage.setItem(storageKey, JSON.stringify(textBoxesRef.current));
            }
        };

        // Save on route change
        saveToStorage();

        // Save on page unload/refresh
        const handleBeforeUnload = () => {
            saveToStorage();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [location.pathname, pdfUrl]);

    const addTextBox = (box: TextBox) => setTextBoxes((prev) => [...prev, box]);
    const updateTextBox = (id: string, content: string) => setTextBoxes((prev) => prev.map((tb) => (tb.id === id ? { ...tb, content } : tb)));
    const moveTextBox = (id: string, x: number, y: number) => setTextBoxes((prev) => prev.map((tb) => (tb.id === id ? { ...tb, x, y } : tb)));
    const resizeTextBox = (id: string, width: number, height: number) => setTextBoxes((prev) => prev.map((tb) => (tb.id === id ? { ...tb, width, height } : tb)));
    const removeTextBox = (id: string) => setTextBoxes((prev) => prev.filter((tb) => tb.id !== id));
    const setSelectedTextBoxId = (id: string) => setSelectedTextBoxIdState(id);

    const wrapForSave = (content: string, fieldType: string | undefined, textBoxIndex: number) => {
        if (content?.match(/^\s*\{\{.*\}\}\s*$/)) {
            return content.trim();
        }
        return `{{ ${content?.trim() || ""} }}`;
    };

    const handleRecipientCreated = async () => {
        if (rightSidebarRef.current) {
            await rightSidebarRef.current.refreshRecipients();
        }
    };

    const handleSaveToServer = async () => {
        if (!pdfUrl) {
            toast.warning("PDF not found.");
            return;
        }

        if (textBoxes.length === 0) {
            toast.warning("No fields to save.");
            return;
        }

        if (recipients.length === 0) {
            toast.warning("No recipients available. Please add recipients first.");
            return;
        }

        setIsAssignmentMode(true);
    };

    const handleCompleteAssignment = async () => {
        const unassignedFields = textBoxes.filter(tb => !tb.recipientId);
        if (unassignedFields.length > 0) {
            toast.warning(`Please assign recipients to all ${unassignedFields.length} field(s).`);
            return;
        }

        setIsAssignmentMode(false);

        if (!pdfUrl) {
            toast.warning("PDF not found.");
            return;
        }

        try {
            await saveFieldAssignments(1, 1, textBoxes);
            
            const response = await fetch(pdfUrl);
            const arrayBuffer = await response.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

            textBoxes.forEach((tb, index) => {
                const page = pdfDoc.getPage(tb.page - 1);
                const { height } = page.getSize();
                page.drawText(wrapForSave(tb.content, tb.fieldType, index), {
                    x: tb.x,
                    y: height - tb.y - 12,
                    size: 12,
                    font,
                    color: rgb(0, 0, 0),
                });
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
            const formData = new FormData();
            formData.append("file", blob, fileName.replace(".pdf", "_filled.pdf"));

            const result = await uploadPdf(formData);

            toast.success(`PDF and field assignments saved successfully.`);
        } catch (error) {
            console.error(error);
            toast.error("Error while saving PDF to server.");
        }
    };

    const handleCancelAssignment = () => {
        setIsAssignmentMode(false);
    };

    const handleUpdateRecipients = (newRecipients: Recipient[]) => {
        setRecipients(newRecipients);
    };

    const handleUpdateFieldRecipient = (textBoxId: string, recipientId: number | null) => {
        setTextBoxes((prev) =>
            prev.map((tb) =>
                tb.id === textBoxId ? { ...tb, recipientId } : tb
            )
        );
    };



    return (
        <div className="app-container">
            <ToastContainer position="top-center" autoClose={3000} />
            {reciepentModal && <RecipientModal onClose={()=>{setReciepentModal(false)}} onCreate={handleRecipientCreated} templateId={1} />}
            <div className="main-content">
                <div className="left-panel">
                    {pdfUrl ? (
                        <>
                            <div className="document-canvas">
                                <PdfViewer
                                    fileUrl={pdfUrl}
                                    textBoxes={textBoxes}
                                    updateTextBox={updateTextBox}
                                    moveTextBox={moveTextBox}
                                    addTextBox={addTextBox}
                                    removeTextBox={removeTextBox}
                                    resizeTextBox={resizeTextBox}
                                    setSelectedTextBoxId={setSelectedTextBoxId}
                                    selectedTextBoxId={selectedTextBoxId}
                                    onDocumentLoadSuccess={(pdf) => setNumPages(pdf.numPages)}
                                    isAssignmentMode={isAssignmentMode}
                                    recipients={recipients}
                                    onUpdateTextBox={handleUpdateFieldRecipient}
                                />
                            </div>
                            {isAssignmentMode && (
                                <div className="assignment-mode-footer">
                                    <div className="assignment-info">
                                        <span className="assignment-title">Assign Recipients to All Fields</span>
                                        <span className="assignment-count">
                                            {textBoxes.filter(tb => tb.recipientId).length} of {textBoxes.length} assigned
                                        </span>
                                    </div>
                                    <div className="assignment-actions">
                                        <button
                                            className="assignment-btn assignment-cancel"
                                            onClick={handleCancelAssignment}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="assignment-btn assignment-confirm"
                                            onClick={handleCompleteAssignment}
                                        >
                                            Save PDF
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <p>Loading PDF from storage...</p>
                    )}
                </div>
                <RightSidebar ref={rightSidebarRef} onSave={handleSaveToServer} setReciepentModal={setReciepentModal} templateId={1} onRecipientUpdate={handleUpdateRecipients} />
            </div>
            <style>{`
                .assignment-mode-footer {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: white;
                    border-top: 2px solid #49806e;
                    padding: 16px 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
                    z-index: 100;
                }

                .assignment-info {
                    display: flex;
                    align-items: center;
                    gap: 24px;
                }

                .assignment-title {
                    font-weight: 600;
                    font-size: 16px;
                    color: #333;
                }

                .assignment-count {
                    font-size: 14px;
                    color: #666;
                    background: #f0f0f0;
                    padding: 4px 12px;
                    border-radius: 12px;
                }

                .assignment-actions {
                    display: flex;
                    gap: 12px;
                }

                .assignment-btn {
                    padding: 8px 20px;
                    border-radius: 4px;
                    border: none;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease-in-out;
                }

                .assignment-cancel {
                    background: #f0f0f0;
                    color: #333;
                }

                .assignment-cancel:hover {
                    background: #e0e0e0;
                }

                .assignment-confirm {
                    background: #49806e;
                    color: white;
                }

                .assignment-confirm:hover {
                    background: #3a6657;
                }

                .document-canvas {
                    padding-bottom: 80px;
                }

                @media (max-width: 768px) {
                    .assignment-mode-footer {
                        flex-direction: column;
                        gap: 12px;
                    }

                    .assignment-info {
                        flex-direction: column;
                        gap: 8px;
                        width: 100%;
                    }

                    .assignment-actions {
                        width: 100%;
                    }

                    .assignment-btn {
                        flex: 1;
                    }
                }
            `}</style>
        </div>
    );
};

const rootElement = document.getElementById("app");
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </React.StrictMode>
    );
}

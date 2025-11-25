import "./bootstrap";
import "../css/app.css";

import ReactDOM from "react-dom/client";
import React, { useState, useRef } from "react";
import { pdfjs } from "react-pdf";
import PdfViewer from "../components/PDFViewer";
import RightSidebar from "../components/RightSidebar";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
    uploadPdf,
    saveFieldAssignments,
    sendShareEmail,
    saveRecipientFieldValues,
    getTemplateData,
} from "./api/api";
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
        imageUrl?: string;
        imageData?: string;
    }

    interface Recipient {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
    }

    const [textBoxes, setTextBoxes] = React.useState<TextBox[]>([]);
    const hasFetchedRef = React.useRef(false);
    const [selectedTextBoxId, setSelectedTextBoxIdState] = React.useState<
        string | null
    >(null);
    const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
    const [fileName, setFileName] = React.useState<string>("testing.pdf");
    const [numPages, setNumPages] = React.useState<number>(0);
    const [reciepentModal, setReciepentModal] = useState(false);
    const [isAssignmentMode, setIsAssignmentMode] = useState(false);
    const [recipients, setRecipients] = React.useState<Recipient[]>([]);
    const [isSharedDocument, setIsSharedDocument] = React.useState(false);
    const [sharedToken, setSharedToken] = React.useState<string | null>(null);
    const [isLoadingTemplateData, setIsLoadingTemplateData] =
        React.useState(false);
    const [hasLoadedFromDatabase, setHasLoadedFromDatabase] =
        React.useState(false);

    const textBoxesRef = React.useRef<TextBox[]>(textBoxes);
    const rightSidebarRef = useRef<any>(null);

    const location = useLocation();
    const { fileName1 } = useParams();

    console.log("File Name:", fileName1);
    console.log("Current Path:", location.pathname);

    // Check if this is a shared document page
    const isSharedDocPage = location.pathname.startsWith("/document/");

    React.useEffect(() => {
        if (!hasFetchedRef.current) {
            hasFetchedRef.current = true;

            const fetchS3Pdf = async () => {
                try {
                    const response = await axios.get(
                        `http://localhost:8000/api/test`
                    );
                    console.log("response", response);
                } catch (error) {
                    console.error("Error fetching PDF from S3:", error);
                }
            };

            fetchS3Pdf();
        }

        const storedPdfUrl = "/storage/upload/testing.pdf";
        setPdfUrl(storedPdfUrl);

        // Check if this is a shared document with assigned fields
        if (isSharedDocPage && typeof window !== "undefined") {
            setIsSharedDocument(true);
            console.log("Detected shared document page:", location.pathname);

            // Function to get shared data from window or data attributes
            const getSharedData = () => {
                // Try window.sharedDocumentData first
                if ((window as any).sharedDocumentData) {
                    return (window as any).sharedDocumentData;
                }

                // Fallback to data attributes
                const appElement = document.getElementById("app");
                if (appElement) {
                    const assignedFieldsAttr = appElement.getAttribute(
                        "data-assigned-fields"
                    );
                    if (assignedFieldsAttr) {
                        try {
                            return {
                                token: appElement.getAttribute("data-token"),
                                assignedFields: JSON.parse(assignedFieldsAttr),
                                recipient: JSON.parse(
                                    appElement.getAttribute("data-recipient") ||
                                        "null"
                                ),
                                template: JSON.parse(
                                    appElement.getAttribute("data-template") ||
                                        "null"
                                ),
                            };
                        } catch (e) {
                            console.error("Error parsing data attributes:", e);
                        }
                    }
                }

                return null;
            };

            // Wait a bit for window.sharedDocumentData to be available (script tag in body)
            const checkSharedData = () => {
                const sharedData = getSharedData();
                console.log("Shared data:", sharedData);

                if (sharedData && sharedData.token) {
                    setSharedToken(sharedData.token);
                }

                if (
                    sharedData &&
                    sharedData.assignedFields &&
                    Array.isArray(sharedData.assignedFields) &&
                    sharedData.assignedFields.length > 0
                ) {
                    // Convert assigned fields to TextBox format
                    const fieldsAsTextBoxes: TextBox[] =
                        sharedData.assignedFields.map((field: any) => {
                            const textBox: TextBox = {
                                id:
                                    field.id ||
                                    `field-${Date.now()}-${Math.random()}`,
                                page: field.page || 1,
                                x: field.x || 0,
                                y: field.y || 0,
                                content: field.content || "",
                                fieldType: field.fieldType || "text",
                                width: field.width,
                                height: field.height,
                                recipientId: null, // Fields are already assigned to this recipient
                                imageData: field.imageData, // Include imageData directly in textBox
                            };

                            // Also store in localStorage as fallback for the PDFViewer to access
                            if (
                                field.imageData &&
                                (field.fieldType === "signature" ||
                                    field.fieldType === "stamp")
                            ) {
                                const imageKey = `pdf-image-${storedPdfUrl}-${field.id}`;
                                localStorage.setItem(imageKey, field.imageData);
                            }

                            return textBox;
                        });

                    console.log(
                        "Loading assigned fields from shared document:",
                        fieldsAsTextBoxes
                    );
                    setTextBoxes(fieldsAsTextBoxes);
                } else {
                    console.log(
                        "No assigned fields found, loading from localStorage"
                    );
                    // No assigned fields, load from localStorage if available
                    const storageKey = `pdf-textBoxes-${storedPdfUrl}`;
                    const savedTextBoxes = localStorage.getItem(storageKey);
                    if (savedTextBoxes) {
                        setTextBoxes(JSON.parse(savedTextBoxes));
                    }
                }
            };

            // Check immediately and also after a short delay to ensure script has loaded
            checkSharedData();
            setTimeout(checkSharedData, 100);
        } else {
            // Regular document view - load from database ONLY on initial load
            const loadTemplateDataFromDatabase = async () => {
                // Only load if we haven't loaded from database yet
                if (hasLoadedFromDatabase) {
                    console.log("Already loaded from database, skipping...");
                    return;
                }

                try {
                    setIsLoadingTemplateData(true);
                    console.log(
                        "Fetching template data from database (initial load)..."
                    );

                    const response = await getTemplateData(1, 1); // template_id=1, user_id=1
                    console.log("Template data response:", response);

                    if (
                        response.status &&
                        response.data &&
                        response.data.share_recipients
                    ) {
                        // Collect all fields from all recipients
                        const allFields: TextBox[] = [];

                        response.data.share_recipients.forEach(
                            (recipient: any) => {
                                if (
                                    recipient.fields &&
                                    Array.isArray(recipient.fields)
                                ) {
                                    recipient.fields.forEach((field: any) => {
                                        const textBox: TextBox = {
                                            id:
                                                field.id ||
                                                `field-${Date.now()}-${Math.random()}`,
                                            page: field.page || 1,
                                            x: field.x || 0,
                                            y: field.y || 0,
                                            content: field.content || "",
                                            fieldType:
                                                field.fieldType || "text",
                                            width: field.width,
                                            height: field.height,
                                            recipientId: recipient.recipient_id,
                                            imageData: field.imageData, // Include imageData from database
                                        };

                                        // If field has imageData, store it in localStorage as fallback
                                        if (
                                            field.imageData &&
                                            (field.fieldType === "signature" ||
                                                field.fieldType === "stamp")
                                        ) {
                                            const imageKey = `pdf-image-${storedPdfUrl}-${field.id}`;
                                            localStorage.setItem(
                                                imageKey,
                                                field.imageData
                                            );
                                        }

                                        allFields.push(textBox);
                                    });
                                }
                            }
                        );

                        if (allFields.length > 0) {
                            console.log(
                                "Loaded fields from database:",
                                allFields
                            );
                            setTextBoxes(allFields);
                            setHasLoadedFromDatabase(true);
                        } else {
                            console.log(
                                "No fields in database, loading from localStorage"
                            );
                            // Fallback to localStorage if no fields in database
                            const storageKey = `pdf-textBoxes-${storedPdfUrl}`;
                            const savedTextBoxes =
                                localStorage.getItem(storageKey);
                            if (savedTextBoxes) {
                                setTextBoxes(JSON.parse(savedTextBoxes));
                            }
                            setHasLoadedFromDatabase(true);
                        }
                    } else {
                        console.log(
                            "No template data, loading from localStorage"
                        );
                        // Fallback to localStorage
                        const storageKey = `pdf-textBoxes-${storedPdfUrl}`;
                        const savedTextBoxes = localStorage.getItem(storageKey);
                        if (savedTextBoxes) {
                            setTextBoxes(JSON.parse(savedTextBoxes));
                        }
                        setHasLoadedFromDatabase(true);
                    }
                } catch (error) {
                    console.error("Error loading template data:", error);
                    // Fallback to localStorage on error
                    const storageKey = `pdf-textBoxes-${storedPdfUrl}`;
                    const savedTextBoxes = localStorage.getItem(storageKey);
                    if (savedTextBoxes) {
                        setTextBoxes(JSON.parse(savedTextBoxes));
                    }
                    setHasLoadedFromDatabase(true);
                } finally {
                    setIsLoadingTemplateData(false);
                }
            };

            // Load from database only once on initial mount
            loadTemplateDataFromDatabase();
        }
    }, [isSharedDocument]);

    // Update ref with latest textBoxes
    React.useEffect(() => {
        textBoxesRef.current = textBoxes;
    }, [textBoxes]);

    // Save textBoxes to localStorage on page unload or route change
    React.useEffect(() => {
        const saveToStorage = () => {
            if (pdfUrl) {
                const storageKey = `pdf-textBoxes-${pdfUrl}`;
                localStorage.setItem(
                    storageKey,
                    JSON.stringify(textBoxesRef.current)
                );
            }
        };

        // Save on route change
        saveToStorage();

        // Save on page unload/refresh
        const handleBeforeUnload = () => {
            saveToStorage();
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [location.pathname, pdfUrl]);

    const addTextBox = (box: TextBox) => setTextBoxes((prev) => [...prev, box]);
    const updateTextBox = (id: string, content: string) =>
        setTextBoxes((prev) =>
            prev.map((tb) => (tb.id === id ? { ...tb, content } : tb))
        );
    const moveTextBox = (id: string, x: number, y: number) =>
        setTextBoxes((prev) =>
            prev.map((tb) => (tb.id === id ? { ...tb, x, y } : tb))
        );
    const resizeTextBox = (id: string, width: number, height: number) =>
        setTextBoxes((prev) =>
            prev.map((tb) => (tb.id === id ? { ...tb, width, height } : tb))
        );
    const removeTextBox = (id: string) =>
        setTextBoxes((prev) => prev.filter((tb) => tb.id !== id));
    const setSelectedTextBoxId = (id: string) => setSelectedTextBoxIdState(id);

    const wrapForSave = (
        content: string,
        fieldType: string | undefined,
        textBoxIndex: number
    ) => {
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
            toast.warning(
                "No recipients available. Please add recipients first."
            );
            return;
        }

        setIsAssignmentMode(true);
    };

    const handleCompleteAssignment = async () => {
        const unassignedFields = textBoxes.filter((tb) => !tb.recipientId);
        if (unassignedFields.length > 0) {
            toast.warning(
                `Please assign recipients to all ${unassignedFields.length} field(s).`
            );
            return;
        }

        setIsAssignmentMode(false);

        if (!pdfUrl) {
            toast.warning("PDF not found.");
            return;
        }

        try {
            // Prepare fields with imageData for signature/stamp fields
            const fieldsWithImages = textBoxes.map((tb) => {
                const fieldData: any = { ...tb };

                // Include imageData for signature and stamp fields
                if (tb.fieldType === "signature" || tb.fieldType === "stamp") {
                    const imageKey = `pdf-image-${pdfUrl}-${tb.id}`;
                    const imageData = localStorage.getItem(imageKey);
                    if (imageData) {
                        fieldData.imageData = imageData;
                    }
                }

                return fieldData;
            });

            await saveFieldAssignments(1, 1, fieldsWithImages);

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
            const blob = new Blob([pdfBytes as BlobPart], {
                type: "application/pdf",
            });
            const formData = new FormData();
            formData.append(
                "file",
                blob,
                fileName.replace(".pdf", "_filled.pdf")
            );

            const result = await uploadPdf(formData);

            const recipientIds = recipients.map((r) => r.id);
            if (recipientIds.length > 0) {
                await sendShareEmail(recipientIds, 1, 1);
                toast.success(
                    `PDF saved and emails sent to recipients successfully.`
                );
            } else {
                toast.success(`PDF and field assignments saved successfully.`);
            }
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

    const handleUpdateFieldRecipient = (
        textBoxId: string,
        recipientId: number | null
    ) => {
        // Don't allow recipient assignment in shared document view
        if (isSharedDocument) {
            return;
        }
        setTextBoxes((prev) =>
            prev.map((tb) =>
                tb.id === textBoxId ? { ...tb, recipientId } : tb
            )
        );
    };

    const handleSubmitRecipientFields = async () => {
        if (!sharedToken) {
            toast.error("Invalid document link");
            return;
        }

        if (!textBoxes || textBoxes.length === 0) {
            toast.warning("No fields to save");
            return;
        }

        try {
            // Prepare fields data for API, including image data
            const fieldsData = textBoxes.map((tb) => {
                const fieldData: any = {
                    id: tb.id,
                    content: tb.content || "",
                    fieldType: tb.fieldType || "text",
                    page: tb.page,
                    x: tb.x,
                    y: tb.y,
                    width: tb.width,
                    height: tb.height,
                };

                // Include image data for signature and stamp fields
                if (tb.fieldType === "signature" || tb.fieldType === "stamp") {
                    const imageKey = `pdf-image-${pdfUrl}-${tb.id}`;
                    const imageData = localStorage.getItem(imageKey);
                    if (imageData) {
                        fieldData.imageData = imageData;
                    }
                }

                return fieldData;
            });

            await saveRecipientFieldValues(sharedToken, fieldsData);
            toast.success("Field values saved successfully!");
        } catch (error: any) {
            console.error("Error saving field values:", error);
            toast.error(
                error.response?.data?.message || "Failed to save field values"
            );
        }
    };

    return (
        <div className="app-container">
            <ToastContainer position="top-center" autoClose={3000} />
            {reciepentModal && (
                <RecipientModal
                    onClose={() => {
                        setReciepentModal(false);
                    }}
                    onCreate={handleRecipientCreated}
                    templateId={1}
                />
            )}

            <div className="main-content">
                <div className="left-panel">
                    {isSharedDocument && (
                        <div className="recipient-submit-footer">
                            <div className="recipient-info">
                                <span className="recipient-title">
                                    Fill in your assigned fields
                                </span>
                                <span className="recipient-count">
                                    {textBoxes.length} field(s) assigned to you
                                </span>
                            </div>
                            <div className="recipient-actions">
                                <button
                                    className="recipient-submit-btn"
                                    onClick={handleSubmitRecipientFields}
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    )}
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
                                    onDocumentLoadSuccess={(pdf) =>
                                        setNumPages(pdf.numPages)
                                    }
                                    isAssignmentMode={
                                        isSharedDocument
                                            ? false
                                            : isAssignmentMode
                                    }
                                    recipients={recipients}
                                    onUpdateTextBox={handleUpdateFieldRecipient}
                                    isSharedDocument={isSharedDocument}
                                />
                            </div>
                            {!isSharedDocument && isAssignmentMode && (
                                <div className="assignment-mode-footer">
                                    <div className="assignment-info">
                                        <span className="assignment-title">
                                            Assign Recipients to All Fields
                                        </span>
                                        <span className="assignment-count">
                                            {
                                                textBoxes.filter(
                                                    (tb) => tb.recipientId
                                                ).length
                                            }{" "}
                                            of {textBoxes.length} assigned
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
                {!isSharedDocument && (
                    <RightSidebar
                        ref={rightSidebarRef}
                        onSave={handleSaveToServer}
                        setReciepentModal={setReciepentModal}
                        templateId={1}
                        onRecipientUpdate={handleUpdateRecipients}
                    />
                )}
            </div>
            <style>{`
                
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

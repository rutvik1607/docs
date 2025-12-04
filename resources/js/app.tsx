import "./bootstrap";
import "../css/app.css";

import ReactDOM from "react-dom/client";
import React, { useState, useRef, useMemo } from "react";
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
import SendDocumentModal from "../components/SendDocumentModal";
import DocumentSendModal from "../components/DocumentSendModel";
import AllParticipantsCompleteDocModal from "../components/AllParticipantsCompleteDocModal";
import DoneYourPartModal from "../components/DoneYourPartModal";
import { attachCertificateToDocument, formatCertificateDate, CertificateData } from "../utils/CertificateGenerator";
import { fetchIpGeolocation } from "../utils/IpGeolocation";

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
        isSubmitted?: boolean;
        recipientName?: string;
        recipientEmail?: string;
        isEditableByCurrentRecipient?: boolean;
        ipAddress?: string;
        location?: string;
    }

    interface Recipient {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        share_status?: number;
        send_date_time?: string;
        view_date_time?: string;
        completed_date_time?: string;
        ip_address?: string;
        location?: string;
        is_fully_submitted?: boolean;
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
    const [activeRecipientId, setActiveRecipientId] = React.useState<number | null>(null);
    const [sharedToken, setSharedToken] = React.useState<string | null>(null);
    const [isLoadingTemplateData, setIsLoadingTemplateData] =
        React.useState(false);
    const [hasLoadedFromDatabase, setHasLoadedFromDatabase] =
        React.useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);
    const [isAllRecipientsSubmitted, setIsAllRecipientsSubmitted] = React.useState(false);
    const [currentUserName, setCurrentUserName] = React.useState<string>("");
    const [assignmentStep, setAssignmentStep] = React.useState<'idle' | 'assigning' | 'review'>('idle');
    const [currentAssignmentFieldId, setCurrentAssignmentFieldId] = React.useState<string | null>(null);
    const [showSendDocumentModal, setShowSendDocumentModal] = useState(false);
    const [showDocumentSentModal, setShowDocumentSentModal] = useState(false);
    const [showAllParticipantsCompleteModal, setShowAllParticipantsCompleteModal] = useState(false);
    const [showDoneYourPartModal, setShowDoneYourPartModal] = useState(false);

    const handleStartAssignment = () => {
        const unassignedFields = textBoxes.filter(tb => !tb.recipientId);
        if (unassignedFields.length === 0) {
            setAssignmentStep('review');
            return;
        }
        console.log()
        setAssignmentStep('assigning');
        setCurrentAssignmentFieldId(unassignedFields[0].id);
    };

    const handleAssignField = (recipientId: number | null) => {
        if (!currentAssignmentFieldId) return;

        // Update current field
        setTextBoxes(prev => prev.map(tb => 
            tb.id === currentAssignmentFieldId ? { ...tb, recipientId } : tb
        ));

        // Find next unassigned field
        const remainingUnassigned = textBoxes.filter(tb => 
            !tb.recipientId && tb.id !== currentAssignmentFieldId
        );

        if (remainingUnassigned.length > 0) {
            setCurrentAssignmentFieldId(remainingUnassigned[0].id);
        } else {
            setAssignmentStep('review');
            setCurrentAssignmentFieldId(null);
        }
    };

    // Recipient Filling Mode Logic
    const [currentFillingFieldId, setCurrentFillingFieldId] = React.useState<string | null>(null);
    const [isFillingMode, setIsFillingMode] = React.useState(false);
    const [showFinishButton, setShowFinishButton] = React.useState(false);

    const isFieldFilled = (tb: TextBox) => {
        if (tb.isSubmitted) return true;
        const hasContent = tb.content && tb.content.trim() !== "";
        const hasImage = Boolean(tb.imageData || (tb.id && localStorage.getItem(`pdf-image-${pdfUrl}-${tb.id}`)));
        return hasContent || hasImage;
    };

    const startFilling = () => {
        if (!editableRecipientFields || editableRecipientFields.length === 0) {
            toast.info("No fields assigned to you.");
            return;
        }

        // Find first unfilled field
        const firstUnfilled = editableRecipientFields.find(tb => !isFieldFilled(tb));
        
        if (firstUnfilled) {
            setIsFillingMode(true);
            setCurrentFillingFieldId(firstUnfilled.id);
            setShowFinishButton(false);
        } else {
            // If all filled but not submitted, start review mode (filling mode but showing finish)
            const allFilled = editableRecipientFields.every(tb => isFieldFilled(tb));
            if (allFilled && editableRecipientFields.some(tb => !tb.isSubmitted)) {
                 setIsFillingMode(true);
                 setCurrentFillingFieldId(editableRecipientFields[0].id); // Go to first field
                 setShowFinishButton(true);
                 toast.success("All fields filled! You can review and submit.");
            } else {
                toast.info("All fields are already submitted.");
            }
        }
    };

    const nextField = () => {
        if (!currentFillingFieldId) return;

        // Find index of current field in editable fields
        const currentIndex = editableRecipientFields.findIndex(tb => tb.id === currentFillingFieldId);
        
        // Find next unfilled field after current
        let nextField = null;
        for (let i = currentIndex + 1; i < editableRecipientFields.length; i++) {
            if (!isFieldFilled(editableRecipientFields[i])) {
                nextField = editableRecipientFields[i];
                break;
            }
        }

        if (nextField) {
            setCurrentFillingFieldId(nextField.id);
            setShowFinishButton(false);
        } else {
            // No next unfilled field found. Check if ALL fields are filled.
            const allFilled = editableRecipientFields.every(tb => isFieldFilled(tb));
            
            if (allFilled) {
                setShowFinishButton(true);
                // Optional: Stay on current field or go to first? 
                // Let's stay on current, but show Finish button.
                toast.success("All fields filled! Click Finish to submit.");
            } else {
                // Wrap around to find any missed fields
                const anyUnfilled = editableRecipientFields.find(tb => !isFieldFilled(tb) && tb.id !== currentFillingFieldId);
                if (anyUnfilled) {
                     setCurrentFillingFieldId(anyUnfilled.id);
                     toast.info("Wrapping around to remaining fields.");
                } else {
                    // Should be covered by allFilled check, but just in case
                    setShowFinishButton(true);
                }
            }
        }
    };

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
                                allRecipientsSubmitted: false
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

                const currentSharedRecipientId = sharedData?.recipient?.id ?? null;
                setActiveRecipientId(currentSharedRecipientId);

                if (sharedData && sharedData.token) {
                    setSharedToken(sharedData.token);
                }

                if (sharedData?.recipient) {
                    const { first_name, last_name } = sharedData.recipient;
                    if (first_name || last_name) {
                        setCurrentUserName(`${first_name || ""} ${last_name || ""}`.trim());
                    }
                }

                if (sharedData && sharedData.allRecipientsSubmitted) {
                    setIsAllRecipientsSubmitted(true);
                }

                if (
                    sharedData &&
                    sharedData.assignedFields &&
                    Array.isArray(sharedData.assignedFields) &&
                    sharedData.assignedFields.length > 0
                ) {
                    // Convert assigned fields to TextBox format
                    const filteredAssignedFields = sharedData.assignedFields.filter((field: any) => {
                        const ownerRecipientId = field.recipientId != null
                            ? Number(field.recipientId)
                            : null;
                        if (ownerRecipientId === null || ownerRecipientId === currentSharedRecipientId) {
                            return true;
                        }
                        const resolvedContent = typeof field.content === "string" ? field.content.trim() : "";
                        const hasContent = resolvedContent.length > 0;
                        const hasImageData = Boolean(field.imageData);
                        return field.isSubmitted === true || hasContent || hasImageData;
                    });

                    const fieldsAsTextBoxes: TextBox[] =
                        filteredAssignedFields.map((field: any) => {
                            const ownerRecipientId = field.recipientId != null
                                ? Number(field.recipientId)
                                : null;
                            const isEditableByRecipient = ownerRecipientId === null || ownerRecipientId === currentSharedRecipientId;
                            const resolvedContent = field.content || "";
                            const hasContent = Boolean(resolvedContent?.trim());
                            const hasImageData = Boolean(field.imageData);
                            const textBox: TextBox = {
                                id:
                                    field.id ||
                                    `field-${Date.now()}-${Math.random()}`,
                                page: field.page || 1,
                                x: field.x || 0,
                                y: field.y || 0,
                                content: resolvedContent,
                                fieldType: field.fieldType || "text",
                                width: field.width,
                                height: field.height,
                                recipientId: ownerRecipientId,
                                recipientName: field.recipientName,
                                recipientEmail: field.recipientEmail,
                                imageData: field.imageData,
                                isSubmitted:
                                    field.isSubmitted === true ||
                                    (!isEditableByRecipient && (hasContent || hasImageData)),
                                isEditableByCurrentRecipient: isEditableByRecipient,
                                ipAddress: field.ipAddress,
                                location: field.location,
                            };

                            // Also store in localStorage as fallback for the PDFViewer to access
                            if (
                                field.imageData &&
                                (field.fieldType === "signature" ||
                                    field.fieldType === "stamp" ||
                                    field.fieldType === "initials")
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
            setActiveRecipientId(null);
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
                        if (response.data.all_recipients_submitted) {
                            setIsAllRecipientsSubmitted(true);
                        }
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
                                            isSubmitted: field.isSubmitted || false, // Include submission status from database
                                            ipAddress: field.ipAddress,
                                            location: field.location,
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
        const saveToStorage = async() => {
            if (pdfUrl) {
                const storageKey = `pdf-textBoxes-${pdfUrl}`;
                localStorage.setItem(
                    storageKey,
                    JSON.stringify(textBoxesRef.current)
                );
            }
        };
        const geolocation = fetchIpGeolocation();
                console.log(geolocation,"geolocation");

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

    const editableRecipientFields = useMemo(() => {
        if (!isSharedDocument) {
            return textBoxes;
        }
        return textBoxes.filter((tb) => {
            if (typeof tb.isEditableByCurrentRecipient === "boolean") {
                return tb.isEditableByCurrentRecipient;
            }
            if (tb.recipientId == null) {
                return true;
            }
            if (activeRecipientId == null) {
                return false;
            }
            return tb.recipientId === activeRecipientId;
        });
    }, [textBoxes, isSharedDocument, activeRecipientId]);

    const addTextBox = (box: TextBox) => setTextBoxes((prev) => [...prev, box]);
    const updateTextBox = (id: string, content: string) => {
        setTextBoxes((prev) =>
            prev.map((tb) => (tb.id === id ? { ...tb, content } : tb))
        );

        // Auto-advance for date fields if content looks like a date (MM/DD/YYYY)
        // We need to check the field type, but we only have ID here. 
        // We can find the field in the current state (textBoxesRef or just look it up)
        // However, updateTextBox is called on every keystroke for text fields, so we must be careful.
        // For date fields, the DatePicker calls this with a formatted date string.
        if (isFillingMode && id === currentFillingFieldId) {
             const field = textBoxes.find(tb => tb.id === id);
             if (field && field.fieldType === 'date' && content.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
                 setTimeout(() => {
                    nextField();
                 }, 300);
             }
        }
    };
    const moveTextBox = (id: string, x: number, y: number) =>
        setTextBoxes((prev) =>
            prev.map((tb) => (tb.id === id ? { ...tb, x, y } : tb))
        );
    const resizeTextBox = (id: string, width: number, height: number) =>
        setTextBoxes((prev) =>
            prev.map((tb) => (tb.id === id ? { ...tb, width, height } : tb))
        );
    const updateTextBoxData = (id: string, data: Partial<TextBox>) => {
        setTextBoxes((prev) =>
            prev.map((tb) => (tb.id === id ? { ...tb, ...data } : tb))
        );
        
        // Auto-advance if filling mode and image data is set (signature/stamp/initials)
        if (isFillingMode && id === currentFillingFieldId && data.imageData) {
            // Small delay to allow render update
            setTimeout(() => {
                nextField();
            }, 300);
        }
    };
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

    const convertDataUrlToBytes = (dataUrl: string) => {
        const base64 = dataUrl.includes(",")
            ? dataUrl.split(",")[1]
            : dataUrl;
        const binaryString = atob(base64);
        const length = binaryString.length;
        const bytes = new Uint8Array(length);
        for (let i = 0; i < length; i += 1) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    };

    const getFieldImageData = (textBox: TextBox) => {
        if (textBox.imageData) {
            return textBox.imageData;
        }
        if (!pdfUrl) {
            return null;
        }
        const imageKey = `pdf-image-${pdfUrl}-${textBox.id}`;
        return localStorage.getItem(imageKey);
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

        if(handleStartAssignment && (assignmentStep === 'idle' || assignmentStep === 'assigning')) {
            handleStartAssignment();
            setIsAssignmentMode(true);
            return;
        }else if(assignmentStep === 'review') {
            handleCompleteAssignment()
            return;
        }
    };

    const handleCompleteAssignment = async () => {
        const unassignedFields = textBoxes.filter((tb) => !tb.recipientId);
        if (unassignedFields.length > 0) {
            toast.warning(
                `Please assign recipients to all ${unassignedFields.length} field(s).`
            );
            return;
        }

        setShowSendDocumentModal(true);
    };

    const handleFinalSend = async (subject: string, body: string) => {
        setShowSendDocumentModal(false);
        setIsAssignmentMode(false);

        if (!pdfUrl) {
            toast.warning("PDF not found.");
            return;
        }

        try {
            // Prepare fields with imageData for signature/stamp fields
            const fieldsWithImages = textBoxes.map((tb) => {
                const fieldData: any = { ...tb };

                // Include imageData for signature, stamp, and initials fields
                if (tb.fieldType === "signature" || tb.fieldType === "stamp" || tb.fieldType === "initials") {
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
                await sendShareEmail(recipientIds, 1, 1, subject, body);
                setShowDocumentSentModal(true);
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

        if (!editableRecipientFields || editableRecipientFields.length === 0) {
            toast.info("No fields assigned to you");
            return;
        }

        if (editableRecipientFields.every((tb) => tb.isSubmitted)) {
            toast.info("Fields already submitted");
            return;
        }

        // Validate that all fields are filled
        const unfilledFields = editableRecipientFields.filter(tb => !isFieldFilled(tb));
        if (unfilledFields.length > 0) {
            toast.error(`Please fill all ${unfilledFields.length} assigned field(s) before finishing.`);
            
            // Optional: Jump to the first unfilled field
            setIsFillingMode(true);
            setCurrentFillingFieldId(unfilledFields[0].id);
            setShowFinishButton(false);
            return;
        }

        try {
            // Fetch IP Geolocation
            let ipData = { ipAddress: '', location: '' };
            try {
                const geolocation = await fetchIpGeolocation();
                ipData = {
                    ipAddress: geolocation.ipAddress,
                    location: geolocation.location
                };
            } catch (error) {
                console.error("Failed to fetch IP geolocation:", error);
            }

            const fieldsData = editableRecipientFields.map((tb) => {
                const fieldData: any = {
                    id: tb.id,
                    content: tb.content || "",
                    fieldType: tb.fieldType || "text",
                    page: tb.page,
                    x: tb.x,
                    y: tb.y,
                    width: tb.width,
                    height: tb.height,
                    isSubmitted: true,
                    ipAddress: ipData.ipAddress,
                    location: ipData.location,
                };

                if (tb.fieldType === "signature" || tb.fieldType === "stamp" || tb.fieldType === "initials") {
                    const imageKey = `pdf-image-${pdfUrl}-${tb.id}`;
                    const imageData = localStorage.getItem(imageKey);
                    if (imageData) {
                        fieldData.imageData = imageData;
                    }
                }

                return fieldData;
            });

            const response = await saveRecipientFieldValues(sharedToken, fieldsData);
            
            if (response.data && response.data.all_recipients_submitted) {
                setIsAllRecipientsSubmitted(true);
                setShowAllParticipantsCompleteModal(true);
            }
            
            const editableIds = new Set(editableRecipientFields.map((tb) => tb.id));
            setTextBoxes((prev) =>
                prev.map((tb) => (editableIds.has(tb.id) ? { 
                    ...tb, 
                    isSubmitted: true,
                    ipAddress: ipData.ipAddress,
                    location: ipData.location
                } : tb))
            );
            
            setIsFillingMode(false);
            setShowFinishButton(false);
            setCurrentFillingFieldId(null);

            setShowDoneYourPartModal(true);

            toast.success("Field values saved successfully!");
        } catch (error: any) {
            console.error("Error saving field values:", error);
            toast.error(
                error.response?.data?.message || "Failed to save field values"
            );
        }
    };

    const handleDownloadSubmittedPdf = async () => {
        if (!pdfUrl) {
            toast.error("PDF not found.");
            return;
        }

        const submittedFields = textBoxes.filter((tb) => tb.isSubmitted);
        if (submittedFields.length === 0) {
            toast.info("No submitted fields to download yet.");
            return;
        }

        try {
            setIsDownloadingPdf(true);
            const response = await fetch(pdfUrl);
            const arrayBuffer = await response.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const pages = pdfDoc.getPages();

            for (const tb of submittedFields) {
                const pageIndex = Math.max((tb.page || 1) - 1, 0);
                const page = pages[pageIndex];
                if (!page) {
                    continue;
                }
                const { height } = page.getSize();

                const isImageField =
                    tb.fieldType === "signature" ||
                    tb.fieldType === "stamp" ||
                    tb.fieldType === "initials";

                if (isImageField) {
                    const imageData = getFieldImageData(tb);
                    if (imageData) {
                        const imageBytes = convertDataUrlToBytes(imageData);
                        const image = imageData.includes("image/png")
                            ? await pdfDoc.embedPng(imageBytes)
                            : await pdfDoc.embedJpg(imageBytes);
                        const drawWidth = tb.width || 150;
                        const drawHeight = tb.height || 50;
                        page.drawImage(image, {
                            x: tb.x ?? 0,
                            y: height - (tb.y ?? 0) - drawHeight,
                            width: drawWidth,
                            height: drawHeight,
                        });
                        continue;
                    }
                }

                const content = tb.content?.toString().trim();
                if (content) {
                    page.drawText(content, {
                        x: tb.x ?? 0,
                        y: height - (tb.y ?? 0) - 12,
                        size: 12,
                        font,
                        color: rgb(0, 0, 0),
                    });
                }
            }

            // Add footer to every page
            const totalPages = pages.length;
            const footerHeight = 14;
            
            // Generate reference number: XXXX-XXXX-XXXX-XXXX (4 blocks of 5 alphanumeric chars)
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            const generateBlock = () => {
                let block = '';
                for (let i = 0; i < 5; i++) {
                    block += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return block;
            };
            const referenceNumber = `${generateBlock()}-${generateBlock()}-${generateBlock()}-${generateBlock()}`;
            
            pages.forEach((page, index) => {
                const { width, height } = page.getSize();
                
                // Resize page to accommodate footer
                page.setSize(width, height + footerHeight);

                const fontSize = 8;
                const textY = (footerHeight - fontSize) / 2 + 2; // Vertically center text
                
                // Draw Reference Number at bottom left
                const refText = `Document Ref: ${referenceNumber}`;
                // Draw footer background
                page.drawRectangle({
                    x: -(width - 15 - font.widthOfTextAtSize(refText, fontSize)),
                    y: 0,
                    width: width,
                    height: footerHeight,
                    color: rgb(0.827, 0.827, 0.827), // #d3d3d3
                });
                page.drawText(refText, {
                    x: 10,
                    y: textY,
                    size: fontSize,
                    font,
                    color: rgb(0, 0, 0),
                });

                // Draw Page Number at bottom right
                const pageText = `Page ${index + 1} of ${totalPages}`;
                const pageTextWidth = font.widthOfTextAtSize(pageText, fontSize);
                page.drawRectangle({
                    x: width - 25 - pageTextWidth,
                    y: 0,
                    width: width,
                    height: footerHeight,
                    color: rgb(0.827, 0.827, 0.827), // #d3d3d3
                });
                page.drawText(pageText, {
                    x: width - 20 - pageTextWidth,
                    y: textY,
                    size: fontSize,
                    font,
                    color: rgb(0, 0, 0),
                });
                
            });

            let pdfBytes = await pdfDoc.save();

            // Attach certificate page if all recipients have submitted
            if (isAllRecipientsSubmitted) {
                try {
                    // Collect recipient data for certificate
                    const recipientMap = new Map<number, any>();
                    recipients.forEach(r => {
                        recipientMap.set(r.id, {
                            name: `${r.first_name} ${r.last_name}`,
                            email: r.email,
                            status: r.share_status ?? 0,
                            isFullySubmitted: r.is_fully_submitted ?? false,
                            sentAt: r.send_date_time ? formatCertificateDate(r.send_date_time) : undefined,
                            viewedAt: r.view_date_time ? formatCertificateDate(r.view_date_time) : undefined,
                            signedAt: r.completed_date_time ? formatCertificateDate(r.completed_date_time) : undefined,
                            signature: undefined,
                            ipAddress: r.ip_address,
                            location: r.location
                        });
                    });

                    // Update with actual signature and initial data from submitted fields
                    submittedFields.forEach(field => {
                        if (field.recipientId && recipientMap.has(field.recipientId)) {
                            const recipient = recipientMap.get(field.recipientId);
                            console.log(recipient,"recipient")

                            // Collect signature data
                            if (field.fieldType === 'signature' && !recipient.signature) {
                                const imageData = getFieldImageData(field);
                                if (imageData) {
                                    recipient.signature = imageData;
                                }
                            }
                            
                            // Collect initial data as fallback
                            if (field.fieldType === 'initials' && !recipient.initial) {
                                const imageData = getFieldImageData(field);
                                if (imageData) {
                                    recipient.initial = imageData;
                                }
                            }
                        }
                    });

                    const certificateData: CertificateData = {
                        documentTitle: fileName.replace('.pdf', ''),
                        referenceNumber: referenceNumber,
                        completedAt: formatCertificateDate(new Date()),
                        recipients: Array.from(recipientMap.values())
                    };

                    // Attach certificate to PDF
                    pdfBytes = await attachCertificateToDocument(pdfBytes, certificateData);
                    console.log('Certificate page attached successfully');
                } catch (certError) {
                    console.error('Error attaching certificate:', certError);
                    // Continue with download even if certificate fails
                    toast.warning('PDF downloaded without certificate page');
                }
            }

            const blob = new Blob([pdfBytes as BlobPart], {
                type: "application/pdf",
            });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = fileName.replace(".pdf", "_submitted.pdf");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error("Error preparing PDF download:", error);
            toast.error("Failed to prepare PDF download.");
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    const assignedFieldCount = isSharedDocument ? editableRecipientFields.length : textBoxes.length;
    const hasAnyFields = assignedFieldCount > 0;
    const hasPendingFields = hasAnyFields
        ? (isSharedDocument
            ? editableRecipientFields.some((tb) => !tb.isSubmitted)
            : textBoxes.some((tb) => !tb.isSubmitted))
        : false;
    const bannerTitle = hasPendingFields
        ? "Fill in your assigned fields"
        : hasAnyFields
            ? "Submission received"
            : "No fields available";
    const bannerSubtitle = hasPendingFields
        ? `${assignedFieldCount} field(s) assigned to you`
        : hasAnyFields
            ? `${assignedFieldCount} field(s) submitted`
            : "Reach out to the sender for access";

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
                    {/* {isAssignmentMode && assignmentStep === 'idle' && (
                        <div className="recipient-submit-footer" style={{ borderTop: 'none', borderBottom: '2px solid #248567' }}>
                            <div className="recipient-info">
                                <span className="recipient-title">Assign Recipients</span>
                                <span className="recipient-subtitle">Assign recipients to each field in a guided workflow.</span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    className="recipient-submit-btn"
                                    onClick={handleStartAssignment}
                                >
                                    Start
                                </button>
                                <button
                                    className="recipient-submit-btn"
                                    style={{ background: 'white', color: '#333', border: '1px solid #ccc' }}
                                    onClick={() => setIsAssignmentMode(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )} */}
                    {isSharedDocument && (
                        <div className="recipient-submit-footer">
                            <div className="recipient-info">
                                <span className="recipient-title">
                                    {bannerTitle}
                                </span>
                                <span className="recipient-subtitle">
                                    {bannerSubtitle}
                                </span>
                            </div>
                            {/* {hasPendingFields && (
                                <button
                                    className="recipient-submit-btn"
                                    onClick={handleSubmitRecipientFields}
                                >
                                    Submit Fields
                                </button>
                            )} */}
                            {isSharedDocument && !isAllRecipientsSubmitted && editableRecipientFields.length > 0 && (
                                <div className="filling-nav" style={{
                                    display: 'flex',
                                    gap: '10px'
                                }}>
                                    {!isFillingMode ? (
                                        <button 
                                            onClick={startFilling}
                                            className="recipient-submit-btn"
                                        >
                                            Start
                                        </button>
                                    ) : (
                                        <>
                                            {/* <button 
                                                onClick={() => {
                                                    setIsFillingMode(false);
                                                    setCurrentFillingFieldId(null);
                                                    setShowFinishButton(false);
                                                }}
                                                className="recipient-submit-btn"
                                                style={{ backgroundColor: 'white', color: '#333', border: '1px solid #ccc' }}
                                            >
                                                Stop
                                            </button> */}
                                            
                                            {showFinishButton ? (
                                                <button 
                                                    onClick={handleSubmitRecipientFields}
                                                    className="recipient-submit-btn"
                                                >
                                                    Finish
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={nextField}
                                                    className="recipient-submit-btn"
                                                >
                                                    Next Field &rarr;
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                            {isAllRecipientsSubmitted && (
                                <button
                                    className="recipient-submit-btn"
                                    onClick={handleDownloadSubmittedPdf}
                                    disabled={isDownloadingPdf}
                                >
                                    {isDownloadingPdf ? "Preparing..." : "Download PDF"}
                                </button>
                            )}
                        </div>
                    )}
                    {/* {assignmentStep === 'review' && (
                         <div className="recipient-submit-footer" style={{ justifyContent: 'space-between' }}>
                            <div className="recipient-info">
                                <span className="recipient-title">
                                    All fields assigned
                                </span>
                                <span className="recipient-subtitle">
                                    Ready to send to recipients
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    className="rs-btn-cancel"
                                    style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', cursor: 'pointer' }}
                                    onClick={() => setAssignmentStep('idle')}
                                >
                                    Back
                                </button>
                                <button
                                    className="recipient-submit-btn"
                                    onClick={handleCompleteAssignment}
                                >
                                    Finish
                                </button>
                            </div>
                        </div>
                    )} */}
                    {pdfUrl ? (
                        <>
                            <div className="document-canvas">
                                <PdfViewer
                                    fileUrl={pdfUrl || ""}
                                    textBoxes={textBoxes}
                                    moveTextBox={moveTextBox}
                                    addTextBox={addTextBox}
                                    removeTextBox={removeTextBox}
                                    resizeTextBox={resizeTextBox}
                                    setSelectedTextBoxId={setSelectedTextBoxId}
                                    selectedTextBoxId={selectedTextBoxId}
                                    updateTextBox={updateTextBox}
                                    updateTextBoxData={updateTextBoxData}
                                    isAssignmentMode={isAssignmentMode || assignmentStep === 'assigning' || assignmentStep === 'review'}
                                    recipients={recipients}
                                    onUpdateTextBox={handleUpdateFieldRecipient}
                                    isSharedDocument={isSharedDocument}
                                    activeRecipientId={activeRecipientId}
                                    currentUserName={currentUserName}
                                    assignmentStep={assignmentStep}
                                    currentAssignmentFieldId={currentAssignmentFieldId}
                                    onAssignField={handleAssignField}
                                    currentFillingFieldId={currentFillingFieldId}
                                    isFillingMode={isFillingMode}
                                />
                            </div>
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
                        isAssignmentMode={isAssignmentMode}
                        assignedCount={textBoxes.filter((tb) => tb.recipientId && !tb.isSubmitted).length}
                        totalFields={textBoxes.filter((tb) => !tb.isSubmitted).length}
                        onCancelAssignment={handleCancelAssignment}
                        onCompleteAssignment={handleCompleteAssignment}
                        assignmentStep={assignmentStep}
                    />
                )}
            </div>
            <style>{`
                
            `}</style>
            {/* Send Document Modal */}
            {showSendDocumentModal && (
                <SendDocumentModal
                    onClose={() => setShowSendDocumentModal(false)}
                    onSend={handleFinalSend}
                    recipients={recipients}
                    senderName={currentUserName || "Me"}
                    fileName={fileName}
                />
            )}
            {showDocumentSentModal && (
                <DocumentSendModal
                    onClose={() => setShowDocumentSentModal(false)}
                />
            )}
            {/* <AllParticipantsCompleteDocModal
                isOpen={showAllParticipantsCompleteModal}
                onClose={() => setShowAllParticipantsCompleteModal(false)}
            /> */}
            <DoneYourPartModal
                isOpen={showDoneYourPartModal}
                onClose={() => setShowDoneYourPartModal(false)}
            />
        </div>
    );
};

export default App;

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

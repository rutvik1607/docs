import "./bootstrap";
import "../css/app.css";

import ReactDOM from "react-dom/client";
import React from "react";
import { pdfjs } from "react-pdf";
import PdfViewer from "../components/PDFViewer";
import RightSidebar from "../components/RightSidebar";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { uploadPdf } from "./api/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Initialize PDF.js worker
if (typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

// Helper function
const readFirstBytes = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result) {
                const arr = new Uint8Array(reader.result as ArrayBuffer).subarray(0, 5);
                const header = String.fromCharCode.apply(null, Array.from(arr));
                resolve(header);
            } else reject(new Error("Could not read file"));
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file.slice(0, 5));
    });
};

const App = () => {
    interface TextBox {
        id: string;
        page: number;
        x: number;
        y: number;
        content: string;
        fieldType?: string;
    }

    const [textBoxes, setTextBoxes] = React.useState<TextBox[]>([]);
    const [selectedTextBoxId, setSelectedTextBoxIdState] = React.useState<string | null>(null);
    const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
    const [pdfFile, setPdfFile] = React.useState<File | null>(null);
    const [fileName, setFileName] = React.useState<string>("No file selected");
    const [numPages, setNumPages] = React.useState<number>(0);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const addTextBox = (box: TextBox) => setTextBoxes((prev) => [...prev, box]);
    const updateTextBox = (id: string, content: string) => setTextBoxes((prev) => prev.map((tb) => (tb.id === id ? { ...tb, content } : tb)));
    const moveTextBox = (id: string, x: number, y: number) => setTextBoxes((prev) => prev.map((tb) => (tb.id === id ? { ...tb, x, y } : tb)));
    const removeTextBox = (id: string) => setTextBoxes((prev) => prev.filter((tb) => tb.id !== id));
    const setSelectedTextBoxId = (id: string) => setSelectedTextBoxIdState(id);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const firstBytes = await readFirstBytes(file);
                const isPDF = firstBytes.startsWith("%PDF");

                if (isPDF) {
                    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
                    const url = URL.createObjectURL(file);
                    setPdfUrl(url);
                    setPdfFile(file);
                    setFileName(file.name);
                    setNumPages(0);
                    toast.success("PDF uploaded successfully!");
                } else {
                    toast.error("Invalid file. Please upload a valid PDF.");
                }
            } catch (error) {
                console.error(error);
                toast.error("Error reading file. Please try again.");
            }
        }
    };

    const wrapForSave = (content: string) => {
        const raw = content == null ? "" : String(content);
        const unwrapped = raw.replace(/^\s*\{\{\s*/, "").replace(/\s*\}\}\s*$/, "");
        const ascii = unwrapped.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        let slug = ascii
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-+|-+$/g, "");
        if (!slug) return "{{ }}";
        return `{{ ${slug} }}`;
    };

    const handleSaveToServer = async () => {
        if (!pdfFile) {
            toast.warning("Please upload a PDF before saving.");
            return;
        }

        toast.info("Saving PDF to server...");

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

            textBoxes.forEach((tb) => {
                const page = pdfDoc.getPage(tb.page - 1);
                const { height } = page.getSize();
                page.drawText(wrapForSave(tb.content), {
                    x: tb.x,
                    y: height - tb.y,
                    size: 12,
                    font,
                    color: rgb(0, 0, 0),
                });
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });

            const formData = new FormData();
            formData.append("file", blob, fileName.replace(".pdf", "_filled.pdf"));

            const response = await uploadPdf(formData);

            toast.success(`PDF saved successfully!\nPath:${response.path}`, {
                style: { whiteSpace: "pre-line" },
            });
        } catch (error) {
            console.error(error);
            toast.error("Error while saving PDF to server.");
        }
    };

    return (
        <div className="app-container">
            <ToastContainer
                position="top-center"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />


            <div className="main-content">
                <div className="left-panel">
                    <div className="document-header">
                        <h2 className="document-main-title">{fileName}</h2>
                        <span className="page-count">
                            {numPages > 0 ? `${numPages} page${numPages !== 1 ? "s" : ""}` : ""}
                        </span>

                        <input
                            type="file"
                            accept=".pdf, .doc, .docx"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            style={{ display: "none" }}
                        />

                        <div className="btn-group">
                            <button className="add-page-btn" title="Upload Document" onClick={() => fileInputRef.current?.click()}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                </svg>
                            </button>

                            {pdfUrl && (
                                <>

                                    <button className="floating-download-btn" title="Save PDF" onClick={handleSaveToServer}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                                            <path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm3-10H6V5h9v2z" />
                                        </svg>

                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="document-canvas">
                        {pdfUrl && (
                            <PdfViewer
                                fileUrl={pdfUrl}
                                textBoxes={textBoxes}
                                updateTextBox={updateTextBox}
                                moveTextBox={moveTextBox}
                                addTextBox={addTextBox}
                                removeTextBox={removeTextBox}
                                setSelectedTextBoxId={setSelectedTextBoxId}
                                selectedTextBoxId={selectedTextBoxId}
                                onDocumentLoadSuccess={(pdf) => setNumPages(pdf.numPages)}
                            />
                        )}
                    </div>
                </div>
                <RightSidebar />
            </div>
        </div>
    );
};

const rootElement = document.getElementById("app");
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}

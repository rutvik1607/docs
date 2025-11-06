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
    const [fileName, setFileName] = React.useState<string>("testing.pdf");
    const [numPages, setNumPages] = React.useState<number>(0);


    React.useEffect(() => {
        const storedPdfUrl = "/storage/upload/testing.pdf"; 
        setPdfUrl(storedPdfUrl);
    }, []);

    const addTextBox = (box: TextBox) => setTextBoxes((prev) => [...prev, box]);
    const updateTextBox = (id: string, content: string) => setTextBoxes((prev) => prev.map((tb) => (tb.id === id ? { ...tb, content } : tb)));
    const moveTextBox = (id: string, x: number, y: number) => setTextBoxes((prev) => prev.map((tb) => (tb.id === id ? { ...tb, x, y } : tb)));
    const removeTextBox = (id: string) => setTextBoxes((prev) => prev.filter((tb) => tb.id !== id));
    const setSelectedTextBoxId = (id: string) => setSelectedTextBoxIdState(id);

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
        if (!pdfUrl) {
            toast.warning("PDF not found.");
            return;
        }

        toast.info("Saving PDF to server...");

        try {
            const response = await fetch(pdfUrl);
            const arrayBuffer = await response.arrayBuffer();
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
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const formData = new FormData();
            formData.append("file", blob, fileName.replace(".pdf", "_filled.pdf"));

            const result = await uploadPdf(formData);

            toast.success(`PDF saved successfully!\nPath: ${result.path}`, {
                style: { whiteSpace: "pre-line" },
            });
        } catch (error) {
            console.error(error);
            toast.error("Error while saving PDF to server.");
        }
    };

    return (
        <div className="app-container">
            <ToastContainer position="top-center" autoClose={3000} />

            <div className="main-content">
                <div className="left-panel">
                    {pdfUrl ? (
                        <>
                            <div className="btn-group">
                                <button
                                    className="floating-download-btn"
                                    title="Save PDF"
                                    onClick={handleSaveToServer}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="white"
                                    >
                                        <path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm3-10H6V5h9v2z" />
                                    </svg>
                                </button>
                            </div>

                            <div className="document-canvas">
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
                            </div>
                        </>
                    ) : (
                        <p>Loading PDF from storage...</p>
                    )}
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

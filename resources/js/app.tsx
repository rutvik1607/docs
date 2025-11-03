import "./bootstrap";
import "../css/app.css";

import ReactDOM from "react-dom/client";
import React from "react";
import { pdfjs } from 'react-pdf';
import PdfViewer from "../components/PDFViewer";
import RightSidebar from "../components/RightSidebar";

// Initialize PDF.js worker to local public path
if (typeof window !== 'undefined') {
    // Serve the module worker we copied into public/ as an ES module
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

// Helper function to read first bytes of file
const readFirstBytes = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result) {
                const arr = new Uint8Array(reader.result as ArrayBuffer).subarray(0, 5);
                const header = String.fromCharCode.apply(null, Array.from(arr));
                resolve(header);
            } else {
                reject(new Error('Could not read file'));
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file.slice(0, 5));
    });
};

// Example Root Component
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

    const addTextBox = (box: TextBox) => setTextBoxes((prev) => [...prev, box]);
    const updateTextBox = (id: string, content: string) => setTextBoxes((prev) => prev.map(tb => tb.id === id ? { ...tb, content } : tb));
    const moveTextBox = (id: string, x: number, y: number) => setTextBoxes((prev) => prev.map(tb => tb.id === id ? { ...tb, x, y } : tb));
    const removeTextBox = (id: string) => setTextBoxes((prev) => prev.filter(tb => tb.id !== id));
    const setSelectedTextBoxId = (id: string) => setSelectedTextBoxIdState(id);

    const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
    const [fileName, setFileName] = React.useState<string>("No file selected");
    const [numPages, setNumPages] = React.useState<number>(0);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                // Check if it's actually a PDF by reading the first few bytes
                const firstBytes = await readFirstBytes(file);
                const isPDF = firstBytes.startsWith('%PDF');
                
                if (isPDF) {
                    // Revoke previous URL to prevent memory leaks
                    if (pdfUrl) {
                        URL.revokeObjectURL(pdfUrl);
                    }
                    const url = URL.createObjectURL(file);
                    setPdfUrl(url);
                    setFileName(file.name);
                    setNumPages(0); // Reset page count until PDF loads
                } else {
                    alert('Invalid PDF file. Please upload a valid PDF.');
                }
            } catch (error) {
                console.error('Error reading file:', error);
                alert('Error reading file. Please try again.');
            }
        }
    };

    // Cleanup function to revoke object URL when component unmounts
    React.useEffect(() => {
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, []);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="app-container">
            <div className="main-content">
                <div className="left-panel">
                    <div className="document-header">
                        <h2 className="document-main-title">
                            {fileName}
                        </h2>
                        <span className="page-count">{numPages > 0 ? `${numPages} page${numPages !== 1 ? 's' : ''}` : ''}</span>
                        <input 
                            type="file"
                            accept=".pdf"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                        />
                        <button 
                            className="add-page-btn" 
                            title="Upload Document"
                            onClick={handleUploadClick}
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                            </svg>
                        </button>
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
                                    onDocumentLoadSuccess={(pdf) => {
                                        setNumPages(pdf.numPages);
                                    }}
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

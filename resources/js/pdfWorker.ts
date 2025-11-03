import { pdfjs } from 'react-pdf';

const setPdfWorker = () => {
    // Check if we're in the browser and worker isn't set
    if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
        // Set the worker URL relative to the public path
        const workerUrl = new URL('/build/pdfworker.js', window.location.origin);
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.href;
    }
};

export default setPdfWorker;
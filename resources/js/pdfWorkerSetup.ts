import { pdfjs } from 'react-pdf';

const setupPdfWorker = () => {
    const pdfjsVersion = pdfjs.version;
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;
};

export default setupPdfWorker;
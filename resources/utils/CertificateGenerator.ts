/**
 * Certificate Generator Utility
 * 
 * This module provides functionality to generate a certificate page from the HTML template
 * and attach it to PDF documents when users download them.
 */

import html2canvas from 'html2canvas';
import { PDFDocument, rgb } from 'pdf-lib';

/**
 * Interface for recipient information in the certificate
 */
export interface CertificateRecipient {
    name: string;
    email: string;
    status?: number; // 0=Send, 1=View, 2=Completed (all recipients done), 3=Cancel
    isFullySubmitted?: boolean; // Has this recipient submitted all their fields?
    sentAt?: string;
    viewedAt?: string;
    signedAt?: string; // When this recipient completed their part
    signature?: string;
    initial?: string; // Fallback if signature is not available
    ipAddress?: string;
    location?: string;
}

/**
 * Interface for certificate data
 */
export interface CertificateData {
    recipients: CertificateRecipient[];
    documentTitle: string;
    referenceNumber: string;
    completedAt: string;
}

/**
 * Loads the certificate HTML template from the public folder
 * @returns Promise<string> The HTML content
 */
async function loadCertificateTemplate(): Promise<string> {
    try {
        const response = await fetch('/certificate.html');
        if (!response.ok) {
            throw new Error('Failed to load certificate template');
        }
        return await response.text();
    } catch (error) {
        console.error('Error loading certificate template:', error);
        throw error;
    }
}

/**
 * Populates the certificate HTML template with dynamic data
 * @param templateHtml The HTML template string
 * @param data The certificate data to populate
 * @returns The populated HTML string
 */
function populateCertificateData(templateHtml: string, data: CertificateData): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(templateHtml, 'text/html');

    // Add a container div for dynamic content if it doesn't exist
    let contentContainer = doc.getElementById('certificate-content');
    if (!contentContainer) {
        contentContainer = doc.createElement('div');
        contentContainer.id = 'certificate-content';
        contentContainer.style.cssText = `
            position: absolute;
            top: 60px;
            left: 40px;
            right: 40px;
            padding: 40px;
            background: #ffffff;
            font-family: Arial, sans-serif;
            color: #333;
            height: 950px;
            z-index: 10;
        `;
        doc.body.appendChild(contentContainer);
    }

    console.log(data, "reciepentdata")

    // Create content HTML with detailed certificate layout
    const contentHtml = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="font-size: 28px; margin: 0 0 30px 0; font-weight: normal; letter-spacing: 2px;">
                CERTIFICATE <span style="font-style: italic;">of</span> SIGNATURE
            </h1>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; font-size: 10px; color: #666; margin-bottom: 20px;">
                <div style="text-align: left;">
                    <div style="font-size: 9px; color: #999;">REF NUMBER</div>
                    <div style="font-weight: bold; color: #000;">${data.referenceNumber}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 9px; color: #999;">DOCUMENT COMPLETED BY ALL PARTIES ON</div>
                    <div style="font-weight: bold; color: #000;">${data.completedAt}</div>
                </div>
            </div>
        </div>
        <div style="display: grid;grid-template-columns: 1fr 1fr 1fr;gap: 20px;">
            <div style="font-weight: bold; font-size: 11px; margin-bottom: 8px;">SIGNER</div>
            <div style="font-weight: bold; font-size: 11px; margin-bottom: 8px;">TIMESTAMP</div>
            <div style="font-weight: bold; font-size: 11px; margin-bottom: 8px;">SIGNATURE</div>
        </div>
        ${data.recipients.map((recipient, index) => `
            <div style="margin-bottom: 40px; border-top: ${index === 0 ? '2px' : '1px'} solid #000; padding-top: 20px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <!-- Column 1: Signer Info -->
                    <div style="text-align: start;">
                        <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">${recipient.name}</div>
                        <div style="font-size: 9px; color: #999; margin-bottom: 2px;">EMAIL</div>
                        <div style="font-size: 10px; margin-bottom: 15px;">${recipient.email}</div>
                    </div>
                    
                    <!-- Column 2: Timestamps -->
                    <div style="text-align: start;">
                        ${(recipient.status ?? 0) === 3 ? `
                            <div style="margin-bottom: 10px;">
                                <div style="font-size: 9px; color: #999; margin-bottom: 2px;">STATUS</div>
                                <div style="font-size: 10px; color: #d9534f; font-weight: bold;">CANCELLED</div>
                            </div>
                        ` : `
                            ${(recipient.status ?? 0) >= 0 ? `
                                <div style="margin-bottom: 10px;">
                                    <div style="font-size: 9px; color: #999; margin-bottom: 2px;">SENT</div>
                                    <div style="font-size: 10px;">${recipient.sentAt || 'N/A'}</div>
                                </div>
                            ` : ''}
                            ${(recipient.status ?? 0) >= 1 ? `
                                <div style="margin-bottom: 10px;">
                                    <div style="font-size: 9px; color: #999; margin-bottom: 2px;">VIEW</div>
                                    <div style="font-size: 10px;">${recipient.viewedAt || 'N/A'}</div>
                                </div>
                            ` : ''}
                            ${recipient.isFullySubmitted ? `
                                <div style="margin-bottom: 10px;">
                                    <div style="font-size: 9px; color: #999; margin-bottom: 2px;">SIGNED</div>
                                    <div style="font-size: 10px;">${recipient.signedAt || 'N/A'}</div>
                                </div>
                            ` : ''}
                            ${(recipient.status ?? 0) >= 2 ? `
                                <div style="margin-bottom: 10px;">
                                    <div style="font-size: 9px; color: #999; margin-bottom: 2px;">COMPLETED</div>
                                    <div style="font-size: 10px;">${recipient.signedAt || 'N/A'}</div>
                                </div>
                            ` : ''}
                        `}
                    </div>
                    
                    <!-- Column 3: Signature -->
                    <div style="text-align: start;">
                        <div style="border: 1px solid #000; padding: 10px; min-height: 40px; display: flex; align-items: center; justify-content: center; background: white;">
                            ${recipient.signature ? `
                                <img src="${recipient.signature}" style="max-width: 100%; max-height: 70px;" alt="Signature" />
                            ` : recipient.initial ? `
                                <img src="${recipient.initial}" style="max-width: 100%; max-height: 70px;" alt="Initial" />
                            ` : `
                                <div style="color: #ccc; font-size: 12px;">No signature</div>
                            `}
                        </div>
                        <div style="margin-top: 10px;">
                            <div style="font-size: 9px; color: #999; margin-bottom: 2px;">IP ADDRESS</div>
                            <div style="font-size: 10px; margin-bottom: 8px;">${recipient.ipAddress || 'N/A'}</div>
                            <div style="font-size: 9px; color: #999; margin-bottom: 2px;">LOCATION</div>
                            <div style="font-size: 10px;">${recipient.location || 'N/A'}</div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('')}
    `;


    contentContainer.innerHTML = contentHtml;

    return new XMLSerializer().serializeToString(doc);
}

/**
 * Converts HTML to a canvas element
 * @param html The HTML string to convert
 * @returns Promise<HTMLCanvasElement>
 */
async function htmlToCanvas(html: string): Promise<HTMLCanvasElement> {
    // Create a temporary container
    const container = document.createElement('div');
    container.style.cssText = `
        position: absolute;
        left: -9999px;
        top: -9999px;
        width: 816px;
        height: 1056px;
        background: white;
    `;
    container.innerHTML = html;
    document.body.appendChild(container);

    try {
        // Convert to canvas
        const canvas = await html2canvas(container, {
            width: 816,
            height: 1056,
            scale: 1,
            backgroundColor: '#ffffff',
            logging: false,
        });

        return canvas;
    } finally {
        // Clean up
        document.body.removeChild(container);
    }
}

/**
 * Generates a PDF page from the certificate data
 * @param data The certificate data
 * @param pageSize Optional page size (defaults to Letter: 612x792)
 * @returns Promise<Uint8Array> The PDF bytes
 */
export async function generateCertificatePage(
    data: CertificateData,
    pageSize: { width: number; height: number } = { width: 612, height: 792 }
): Promise<Uint8Array> {
    try {
        // Load and populate template
        const template = await loadCertificateTemplate();
        const populatedHtml = populateCertificateData(template, data);

        console.log(populatedHtml, 'populatedHtml')
        // Convert to canvas
        // We use a fixed high resolution for the canvas to ensure quality, 
        // then scale it down to the PDF page size
        const canvas = await htmlToCanvas(populatedHtml);

        // Create PDF document
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([pageSize.width, pageSize.height]);

        // Convert canvas to image
        const imageData = canvas.toDataURL('image/png');
        const pngImage = await pdfDoc.embedPng(imageData);

        // Draw image on page, scaling to fit
        page.drawImage(pngImage, {
            x: 0,
            y: 0,
            width: pageSize.width,
            height: pageSize.height,
        });

        // Save PDF
        const pdfBytes = await pdfDoc.save();
        return pdfBytes;
    } catch (error) {
        console.error('Error generating certificate page:', error);
        throw error;
    }
}

/**
 * Attaches a certificate page to an existing PDF document
 * @param documentBytes The original PDF document bytes
 * @param certificateData The certificate data
 * @returns Promise<Uint8Array> The merged PDF bytes
 */
export async function attachCertificateToDocument(
    documentBytes: Uint8Array,
    certificateData: CertificateData
): Promise<Uint8Array> {
    try {
        // Load the original document
        const pdfDoc = await PDFDocument.load(documentBytes);

        // Get dimensions of the first page to match orientation and size
        const pages = pdfDoc.getPages();
        let pageSize = { width: 612, height: 792 }; // Default to Letter

        if (pages.length > 0) {
            const firstPage = pages[0];
            const { width, height } = firstPage.getSize();
            pageSize = { width, height };
        }

        // Generate certificate page with matching dimensions
        const certificateBytes = await generateCertificatePage(certificateData, pageSize);
        const certificatePdf = await PDFDocument.load(certificateBytes);

        // Copy the certificate page to the original document
        const [certificatePage] = await pdfDoc.copyPages(certificatePdf, [0]);
        pdfDoc.addPage(certificatePage);

        // Save the merged document
        const mergedBytes = await pdfDoc.save();
        return mergedBytes;
    } catch (error) {
        console.error('Error attaching certificate to document:', error);
        throw error;
    }
}

/**
 * Helper function to format date for certificate
 * @param date Date object or ISO string
 * @returns Formatted date string
 */
export function formatCertificateDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });
}

import axios from "axios";

// Your Laravel backend API base URL
const API_BASE_URL = "http://127.0.0.1:8000/api";

// Upload PDF function
export const uploadPdf = async (formData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/upload-pdf`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    } catch (error) {
        console.error("PDF upload failed:", error);
        throw error;
    }
};

// Create recipient function
export const createRecipient = async (recipientData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/add-recipient`, recipientData);
        return response.data;
    } catch (error) {
        console.error("Recipient creation failed:", error);
        throw error;
    }
};

// Get recipients by template
export const getRecipientsByTemplate = async (templateId) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/recipients-by-template`, {
            template_id: templateId
        });
        return response.data;
    } catch (error) {
        console.error("Failed to fetch recipients:", error);
        throw error;
    }
};

// Delete recipient function
export const deleteRecipient = async (templateId, userId, recipientId) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/delete-recipient`, {
            template_id: templateId,
            user_id: userId,
            recipient_id: recipientId
        });
        return response.data;
    } catch (error) {
        console.error("Failed to delete recipient:", error);
        throw error;
    }
};

// Search recipients
export const searchRecipient = async (keyword, userId) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/search-recipient`, {
            keyword,
            user_id: userId
        });
        return response.data;
    } catch (error) {
        console.error("Failed to search recipients:", error);
        throw error;
    }
};

// Get recipients list
export const getRecipientsList = async (userId) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/recipients-list`, {
            user_id: userId
        });
        return response.data;
    } catch (error) {
        console.error("Failed to fetch recipients list:", error);
        throw error;
    }
};

// Share/Add recipients to template
export const shareRecipient = async (recipientIds, templateId, userId) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/share-recipient`, {
            recipient_ids: recipientIds,
            template_id: templateId,
            user_id: userId
        });
        return response.data;
    } catch (error) {
        console.error("Failed to add recipients to template:", error);
        throw error;
    }
};

// Save field assignments to database
export const saveFieldAssignments = async (templateId, userId, fields) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/save-field-assignments`, {
            template_id: templateId,
            user_id: userId,
            fields: fields
        });
        return response.data;
    } catch (error) {
        console.error("Failed to save field assignments:", error);
        throw error;
    }
};

/**
 * Send share email to recipients
 * @param {number[]} recipientIds 
 * @param {number} templateId 
 * @param {number} userId 
 * @param {string|null} subject 
 * @param {string|null} body 
 */
export const sendShareEmail = async (recipientIds, templateId, userId, subject = null, body = null) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/send-share-email`, {
            recipient_ids: recipientIds,
            template_id: templateId,
            user_id: userId,
            subject: subject,
            body: body
        });
        return response.data;
    } catch (error) {
        console.error("Failed to send share emails:", error);
        throw error;
    }
};

// Save recipient field values (for shared documents)
export const saveRecipientFieldValues = async (token, fields) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/save-recipient-field-values`, {
            token: token,
            fields: fields
        });
        return response.data;
    } catch (error) {
        console.error("Failed to save recipient field values:", error);
        throw error;
    }
};

// Get template data with shared recipient fields
export const getTemplateData = async (templateId, userId) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/get-template-data`, {
            template_id: templateId,
            user_id: userId
        });
        return response.data;
    } catch (error) {
        console.error("Failed to fetch template data:", error);
        throw error;
    }
};
// Get email templates
export const getEmailTemplates = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/email-templates`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch email templates:", error);
        throw error;
    }
};

// Create email template
export const createEmailTemplate = async (templateData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/email-templates`, templateData);
        return response.data;
    } catch (error) {
        console.error("Failed to create email template:", error);
        throw error;
    }
};

// Update email template
export const updateEmailTemplate = async (id, templateData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/email-templates/${id}`, templateData);
        return response.data;
    } catch (error) {
        console.error("Failed to update email template:", error);
        throw error;
    }
};

// Delete email template
export const deleteEmailTemplate = async (id) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/email-templates/${id}`);
        return response.data;
    } catch (error) {
        console.error("Failed to delete email template:", error);
        throw error;
    }
};

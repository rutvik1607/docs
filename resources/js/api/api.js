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

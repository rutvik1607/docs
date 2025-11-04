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

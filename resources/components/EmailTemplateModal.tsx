import React, { useState, useEffect } from "react";
import {
    getEmailTemplates,
    createEmailTemplate,
    updateEmailTemplate,
    deleteEmailTemplate,
} from "../js/api/api";
import { toast } from "react-toastify";
import "./EmailTemplateModal.css";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface EmailTemplate {
    id: number;
    name: string;
    subject: string;
    body: string;
}

interface EmailTemplateModalProps {
    onClose: () => void;
    onSelect: (subject: string, body: string) => void;
}

const EmailTemplateModal: React.FC<EmailTemplateModalProps> = ({
    onClose,
    onSelect,
}) => {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        subject: "",
        body: "",
    });
    const [loading, setLoading] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        templateId: number | null;
        templateName: string;
    }>({
        isOpen: false,
        templateId: null,
        templateName: "",
    });
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const response = await getEmailTemplates();
            if (response.status) {
                setTemplates(response.data);
            }
        } catch (error) {
            toast.error("Failed to load templates");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCreateClick = () => {
        setFormData({ name: "", subject: "", body: "" });
        setView('create');
    };

    const handleEditClick = (template: EmailTemplate, e: React.MouseEvent) => {
        e.stopPropagation();
        setFormData({
            name: template.name,
            subject: template.subject,
            body: template.body,
        });
        setSelectedTemplateId(template.id);
        setView('edit');
    };

    const handleDeleteClick = (id: number, name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirmation({
            isOpen: true,
            templateId: id,
            templateName: name,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirmation.templateId) return;

        setIsDeleting(true);
        try {
            await deleteEmailTemplate(deleteConfirmation.templateId);
            toast.success("Template deleted successfully");
            fetchTemplates();
            setDeleteConfirmation({ isOpen: false, templateId: null, templateName: "" });
        } catch (error) {
            toast.error("Failed to delete template");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmation({ isOpen: false, templateId: null, templateName: "" });
    };

    const handleSave = async () => {
        if (!formData.name || !formData.subject || !formData.body) {
            toast.error("Please fill in all fields");
            return;
        }

        try {
            if (view === 'create') {
                await createEmailTemplate(formData);
                toast.success("Template created successfully");
            } else if (view === 'edit' && selectedTemplateId) {
                await updateEmailTemplate(selectedTemplateId, formData);
                toast.success("Template updated successfully");
            }
            setView('list');
            fetchTemplates();
        } catch (error) {
            toast.error("Failed to save template");
        }
    };

    const handleSelectTemplate = (template: EmailTemplate) => {
        onSelect(template.subject, template.body);
    };

    const filteredTemplates = templates.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="et-modal-overlay">
            <div className="et-modal-content">
                <div className="et-modal-header">
                    <h3>Email templates</h3>
                    <button className="et-close-btn" onClick={onClose}>
                        &times;
                    </button>
                </div>
                
                <div className="et-modal-body">
                    {view === 'list' ? (
                        <div className="et-list-view">
                            <div className="et-search-bar">
                                <span className="et-search-icon">&#128269;</span>
                                <input 
                                    type="text" 
                                    placeholder="Search" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            
                            <button className="et-create-link" onClick={handleCreateClick}>
                                + Create new template
                            </button>

                            <div className="et-templates-list">
                                {filteredTemplates.length > 0 ? (
                                    filteredTemplates.map(template => (
                                        <div 
                                            key={template.id} 
                                            className="et-template-item"
                                            onClick={() => handleSelectTemplate(template)}
                                        >
                                            <span className="et-template-name">{template.name}</span>
                                            <div className="et-template-actions">
                                                <button 
                                                    className="et-action-btn edit"
                                                    onClick={(e) => handleEditClick(template, e)}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    className="et-action-btn delete"
                                                    onClick={(e) => handleDeleteClick(template.id, template.name, e)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="et-empty-state">
                                        <p>No saved templates yet</p>
                                    </div>
                                )}
                            </div>

                            <div className="et-footer-actions">
                                <button className="et-btn cancel" onClick={onClose}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div className="et-form-view">
                            <div className="et-form-header">
                                <button className="et-back-link" onClick={() => setView('list')}>
                                    &larr; Back
                                </button>
                                <h4>{view === 'create' ? 'Create Template' : 'Edit Template'}</h4>
                            </div>
                            
                            <div className="et-form-group">
                                <label>Template Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Welcome Email"
                                />
                            </div>
                            <div className="et-form-group">
                                <label>Subject</label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    placeholder="Email Subject"
                                />
                            </div>
                            <div className="et-form-group">
                                <label>Body</label>
                                <textarea
                                    name="body"
                                    value={formData.body}
                                    onChange={handleInputChange}
                                    rows={10}
                                    placeholder="Email Body..."
                                />
                            </div>
                            <div className="et-form-actions">
                                <button
                                    className="et-btn cancel"
                                    onClick={() => setView('list')}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="et-btn save"
                                    onClick={handleSave}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <DeleteConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="Delete Template"
                message={
                    <>
                        Are you sure you want to delete template{" "}
                        <strong>{deleteConfirmation.templateName}</strong>?
                    </>
                }
                warning="This action cannot be undone."
                isDeleting={isDeleting}
            />
        </div>
    );
};

export default EmailTemplateModal;

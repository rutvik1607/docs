import React, { useState, useCallback, useRef, useEffect } from "react";
import { searchRecipient, shareRecipient } from "../js/api/api";
import { toast } from "react-toastify";

interface ExistingRecipient {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface AddRecipientModalProps {
    onClose: () => void;
    onSuccess: () => void;
    templateId?: number;
    userId?: number;
    showAddRecipientModal?: boolean
}

const AddRecipientModal = ({ showAddRecipientModal, onClose, onSuccess, templateId = 1, userId = 1 }: AddRecipientModalProps) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<ExistingRecipient[]>([]);
    const [selectedRecipients, setSelectedRecipients] = useState<Set<number>>(new Set());
    const [isSearching, setIsSearching] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const searchTimeoutRef = useRef<any>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (showAddRecipientModal && searchInputRef.current) {
            searchInputRef.current.focus();
        }
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [showAddRecipientModal]);

    const handleSearch = useCallback(async (query: string) => {
        setSearchQuery(query);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (query.trim().length === 0) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await searchRecipient(query, userId);
            if (response.status) {
                setSearchResults(response.data);
            } else {
                toast.error(response.message || "Search failed");
            }
        } catch (error) {
            console.error("Search error:", error);
            toast.error("Failed to search recipients");
        } finally {
            setIsSearching(false);
        }
    }, [userId]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            handleSearch(query);
        }, 300);
    };

    const toggleRecipientSelection = (recipientId: number) => {
        const newSelected = new Set(selectedRecipients);
        if (newSelected.has(recipientId)) {
            newSelected.delete(recipientId);
        } else {
            newSelected.add(recipientId);
        }
        setSelectedRecipients(newSelected);
    };

    const handleAddRecipients = async () => {
        if (selectedRecipients.size === 0) {
            toast.warning("Please select at least one recipient");
            return;
        }

        setIsAdding(true);
        try {
            const recipientIds = Array.from(selectedRecipients);
            const response = await shareRecipient(recipientIds, templateId, userId);

            if (response.status) {
                toast.success("Recipients added successfully!");
                onSuccess();
                onClose();
            } else {
                toast.error(response.message || "Failed to add recipients");
            }
        } catch (error) {
            console.error("Add recipients error:", error);
            toast.error("Failed to add recipients to template");
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <>
            <div className="add-recipient-backdrop" style={{display:showAddRecipientModal?'block':'none'}} onClick={onClose}></div>
            <div className="add-recipient-modal" role="dialog" aria-modal="true">
                <header className="add-recipient-header">
                    <h2></h2>
                    <button className="add-recipient-close-btn" aria-label="Close" onClick={onClose}>
                        ×
                    </button>
                </header>

                <div className="sent-modal-content">
                    <div className="sent-modal-icon-box">
                        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="10" y="10" width="180" height="180" fill="#E8F5E9"/>

                          <polygon points="190,190 190,140 140,190" fill="#1B5E20"/>
                          
                          <path d="M55 100 L85 130 L145 70" stroke="#212121" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>

                    <h2 className="sent-modal-title">You've done your part!</h2>

                    <p className="sent-modal-desc">
                        Next, We'll notify you once all participants take action.
                    </p>
                </div>

                <style>{`
                    .add-recipient-backdrop {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.15);
                        z-index: 999;
                    }

                    .add-recipient-modal {
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        max-width: 500px;
                        width: 80%;
                        max-height: 80vh;
                        transform: translate(-50%, -50%);
                        background: white;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                        border-radius: 6px;
                        padding: 24px;
                        box-sizing: border-box;
                        z-index: 1000;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                    }

                    .add-recipient-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .add-recipient-header h2 {
                        font-weight: 600;
                        font-size: 18px;
                        margin: 0;
                        color: #333;
                    }

                    .add-recipient-close-btn {
                        border: none;
                        background: transparent;
                        font-size: 20px;
                        cursor: pointer;
                        padding: 4px;
                        line-height: 1;
                        color: #555;
                        transition: color 0.2s ease-in-out;
                    }

                    .add-recipient-close-btn:hover {
                        color: #000;
                    }

                    .add-recipient-content {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                        flex: 1;
                        overflow-y: auto;
                    }

                    .add-recipient-search-container {
                        position: relative;
                    }

                    .add-recipient-search-input {
                        width: 100%;
                        height: 40px;
                        padding: 8px 12px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-size: 14px;
                        font-family: inherit;
                        outline-offset: 2px;
                        transition: border-color 0.2s ease-in-out;
                        box-sizing: border-box;
                    }

                    .add-recipient-search-input:focus {
                        border-color: #a2b5a1;
                        outline: none;
                    }

                    .add-recipient-searching {
                        position: absolute;
                        right: 12px;
                        top: 50%;
                        transform: translateY(-50%);
                        font-size: 12px;
                        color: #999;
                    }

                    .add-recipient-results {
                        flex: 1;
                        overflow-y: auto;
                        border: 1px solid #eee;
                        border-radius: 4px;
                        background-color: #fafafa;
                        min-height: 150px;
                        padding: 12px;
                    }

                    .add-recipient-no-results,
                    .add-recipient-hint {
                        text-align: center;
                        color: #999;
                        font-size: 14px;
                        padding: 20px;
                        margin: 0;
                    }

                    .add-recipient-list {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }

                    .add-recipient-item {
                        display: flex;
                        align-items: flex-start;
                        gap: 12px;
                        padding: 12px;
                        background: white;
                        border-radius: 4px;
                        border: 1px solid #e0e0e0;
                        cursor: pointer;
                        transition: background-color 0.2s ease-in-out;
                    }

                    .add-recipient-item:hover {
                        background-color: #f5f5f5;
                    }

                    .add-recipient-checkbox {
                        margin-top: 4px;
                        cursor: pointer;
                        pointer-events: auto;
                    }

                    .add-recipient-item-label {
                        flex: 1;
                        cursor: pointer;
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }

                    .add-recipient-item-name {
                        font-weight: 500;
                        color: #333;
                        font-size: 14px;
                    }

                    .add-recipient-item-email {
                        font-size: 13px;
                        color: #666;
                    }

                    .add-recipient-selected-count {
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                        padding: 8px;
                        background-color: #e8f5e9;
                        border-radius: 4px;
                    }

                    .add-recipient-footer {
                        margin-top: 24px;
                        display: flex;
                        justify-content: flex-start;
                        gap: 12px;
                    }

                    .add-recipient-btn {
                        border-radius: 4px;
                        font-weight: 700;
                        padding: 8px 16px;
                        font-size: 14px;
                        cursor: pointer;
                        border: none;
                        transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
                    }

                    .add-recipient-cancel-btn {
                        background: #eee;
                        color: #555;
                    }

                    .add-recipient-cancel-btn:hover:not(:disabled) {
                        background: #ddd;
                    }

                    .add-recipient-add-btn {
                        background: #a2b5a1;
                        color: white;
                    }

                    .add-recipient-add-btn:hover:not(:disabled) {
                        background: #8a9a8a;
                    }

                    .add-recipient-add-btn:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }

                    .sent-modal-content {
                        text-align: center;
                        padding: 30px 20px;
                    }

                    .sent-modal-icon-box {
                        display: flex;
                        justify-content: center;
                        margin-bottom: 25px;
                    }

                    .sent-modal-icon {
                        width: 80px;
                        height: 80px;
                    }

                    .sent-modal-title {
                        font-size: 20px;
                        font-weight: 600;
                        margin-bottom: 12px;
                        color: #333;
                    }

                    .sent-modal-desc {
                        font-size: 14px;
                        color: #666;
                        line-height: 1.5;
                        margin-bottom: 25px;
                        max-width: 350px;
                        margin-left: auto;
                        margin-right: auto;
                    }

                    .bottom-text {
                        font-size: 12px;
                        color: #666;
                        line-height: 1.5;
                        max-width: 350px;
                        margin-left: auto;
                        margin-right: auto;
                        margin-bottom: 7px;
                    }
                    
                    @media (max-width: 480px) {
                        .add-recipient-modal {
                            width: 95%;
                            padding: 16px 20px;
                        }

                        .add-recipient-footer {
                            flex-direction: column;
                            gap: 10px;
                        }

                        .add-recipient-btn {
                            width: 100%;
                        }
                    }
                `}</style>
            </div>
        </>
    );
};

export default AddRecipientModal;

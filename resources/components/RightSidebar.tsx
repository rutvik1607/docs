const RightSidebar = () => {
    return (
        <div className="right-sidebar">
            <div className="field-categories">
                <div className="field-row">
                    <button
                        className="field-btn active"
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer?.setData(
                                'application/json',
                                JSON.stringify({ type: 'field', fieldType: 'text', label: 'Text field' })
                            );
                            e.dataTransfer!.effectAllowed = 'copy';
                        }}
                    >
                        <span className="field-icon">A</span>
                        Text field
                    </button>
                    <button
                        className="field-btn"
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer?.setData(
                                'application/json',
                                JSON.stringify({ type: 'field', fieldType: 'signature', label: 'Signature' })
                            );
                            e.dataTransfer!.effectAllowed = 'copy';
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                        Signature
                    </button>
                </div>
                <div className="field-row">
                    <button
                        className="field-btn"
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer?.setData(
                                'application/json',
                                JSON.stringify({ type: 'field', fieldType: 'initials', label: 'Initials' })
                            );
                            e.dataTransfer!.effectAllowed = 'copy';
                        }}
                    >
                        <span className="field-icon">IN</span>
                        Initials
                    </button>
                    <button
                        className="field-btn"
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer?.setData(
                                'application/json',
                                JSON.stringify({ type: 'field', fieldType: 'date', label: 'Date' })
                            );
                            e.dataTransfer!.effectAllowed = 'copy';
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-9H19V1h-2v1H7V1H5v1H3.5C2.67 2 2 2.67 2 3.5v15C2 19.33 2.67 20 3.5 20h17c.83 0 1.5-.67 1.5-1.5v-15C22 2.67 21.33 2 20.5 2z" />
                        </svg>
                        Date
                    </button>
                </div>
                <div className="field-row">
                    <button
                        className="field-btn"
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer?.setData(
                                'application/json',
                                JSON.stringify({ type: 'field', fieldType: 'checkbox', label: 'Checkbox' })
                            );
                            e.dataTransfer!.effectAllowed = 'copy';
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        Checkbox
                    </button>
                    <button
                        className="field-btn"
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer?.setData(
                                'application/json',
                                JSON.stringify({ type: 'field', fieldType: 'radio', label: 'Radio buttons' })
                            );
                            e.dataTransfer!.effectAllowed = 'copy';
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <circle cx="12" cy="12" r="2" />
                            <circle
                                cx="12"
                                cy="12"
                                r="8"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            />
                        </svg>
                        Radio buttons
                    </button>
                </div>
                <div className="field-row">
                    <button
                        className="field-btn"
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer?.setData(
                                'application/json',
                                JSON.stringify({ type: 'field', fieldType: 'dropdown', label: 'Dropdown' })
                            );
                            e.dataTransfer!.effectAllowed = 'copy';
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M7 10l5 5 5-5z" />
                        </svg>
                        Dropdown
                    </button>
                    <button
                        className="field-btn"
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer?.setData(
                                'application/json',
                                JSON.stringify({ type: 'field', fieldType: 'billing', label: 'Billing details' })
                            );
                            e.dataTransfer!.effectAllowed = 'copy';
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                        </svg>
                        Billing details
                    </button>
                </div>
                <div className="field-row single">
                    <button
                        className="field-btn"
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer?.setData(
                                'application/json',
                                JSON.stringify({ type: 'field', fieldType: 'stamp', label: 'Stamp' })
                            );
                            e.dataTransfer!.effectAllowed = 'copy';
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        Stamp
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RightSidebar;
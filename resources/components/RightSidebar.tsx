// import React from "react";
// import "./RightSidebar.css";

import { DragEvent, JSX } from "react";

// Button model to standardize icon or svg
type FieldButton = {
  type: string;
  label: string;
  icon?: string; // e.g., "A", "IN"
  svg?: JSX.Element; // for glyphs
};

const fieldButtons: FieldButton[][] = [
  [
    { icon: "A", type: "text", label: "Enter Value" },
    {
      svg: <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />,
      type: "signature",
      label: "Signature",
    },
  ],
  [
    { icon: "IN", type: "initials", label: "Initials" },
    {
      svg: <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-9H19V1h-2v1H7V1H5v1H3.5C2.67 2 2 2.67 2 3.5v15C2 19.33 2.67 20 3.5 20h17c.83 0 1.5-.67 1.5-1.5v-15C22 2.67 21.33 2 20.5 2z" />,
      type: "date",
      label: "Date",
    },
  ],
  [
    {
      svg: <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />,
      type: "billing",
      label: "Billing details",
    },
    {
      svg: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
      type: "stamp",
      label: "Stamp",
    },
  ],
];

interface RightSidebarProps {
  onSave?: () => void;
}

const RightSidebar = ({ onSave }: RightSidebarProps) => {
  const handleDragStart = (
    e: DragEvent<HTMLButtonElement>,
    type: string,
    label: string
  ) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ type: "field", fieldType: type, label })
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <aside className="right-sidebar">
      {/* Header area like screenshot: title and close icon placeholder */}
      <div className="rs-header">
        <h3 className="rs-title">Add Fields</h3>
      </div>

      {/* Grid of field buttons */}
      <div className="rs-grid">
        {fieldButtons.map((row, rowIndex) => (
          <div className="rs-row" key={rowIndex}>
            {row.map((field, i) => (
              <button
                key={i}
                className={`rs-btn ${field.type}`}
                draggable
                onDragStart={(e) => handleDragStart(e, field.type, field.label)}
              >
                <span className="rs-btn-inner">
                  <span className="rs-glyph">
                    {field.icon ? (
                      <span className="rs-icon-text">{field.icon}</span>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        {field.svg}
                      </svg>
                    )}
                  </span>
                  <span className="rs-label">{field.label}</span>
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Download button at the bottom */}
      {onSave && (
        <div className="rs-download-container">
          <button
            className="rs-download-btn"
            title="Save PDF"
            onClick={onSave}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm3-10H6V5h9v2z" />
            </svg>
            Save PDF
          </button>
        </div>
      )}
    </aside>
  );
};

export default RightSidebar;

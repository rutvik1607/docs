import React, { useState } from "react";
import { createRecipient } from "../js/api/api";
import { toast } from "react-toastify";

const CreateRecipientModal = ({ onClose, onCreate, templateId = 1 }:{onClose:() => void, onCreate: (recipient: any) => void, templateId:number}) => {
  const [showMoreFields, setShowMoreFields] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    streetAddress: "",
    city: "",
    postalCode: "",
    country: "",
    stateRegion: "",
  });

  const handleChange = (e:any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleFields = () => setShowMoreFields((prev) => !prev);

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Transform form data to match API expectations (camelCase to snake_case)
      const apiData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
        company: formData.company || null,
        job_title: formData.jobTitle || null,
        street_address: formData.streetAddress || null,
        city: formData.city || null,
        postal_code: formData.postalCode || null,
        country: formData.country || null,
        state: formData.stateRegion || null,
        template_id: templateId,
      };

      const response = await createRecipient(apiData);

      if (response.status) {
        toast.success("Recipient created successfully!");
        onCreate(response.data);
        onClose();
      } else {
        toast.error(response.message || "Failed to create recipient");
      }
    } catch (error:any) {
      console.error("Error creating recipient:", error);
      const errorMessage = error.response?.data?.message || "Failed to create recipient";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-container" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal-header">
          <h2 id="modal-title">Create new recipient</h2>
          <button className="close-btn" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit} className="form">
          <div className="grid-2-columns">
            <label>
              FIRST NAME
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                autoComplete="given-name"
                required
              />
            </label>
            <label>
              LAST NAME
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                autoComplete="family-name"
                required
              />
            </label>
          </div>

          <label>
            EMAIL
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </label>

          <label>
            PHONE NUMBER
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              autoComplete="tel"
            />
          </label>

          <button
            type="button"
            className="toggle-fields-btn"
            onClick={toggleFields}
            aria-expanded={showMoreFields}
          >
            {showMoreFields ? "Less fields ▲" : "More fields ▼"}
          </button>

          {showMoreFields && (
            <>
              <label>
                COMPANY
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  autoComplete="organization"
                />
              </label>

              <label>
                JOB TITLE
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  autoComplete="organization-title"
                />
              </label>

              <label>
                STREET ADDRESS
                <input
                  type="text"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  autoComplete="street-address"
                />
              </label>

              <div className="grid-2-columns">
                <label>
                  CITY
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    autoComplete="address-level2"
                  />
                </label>

                <label>
                  POSTAL CODE
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    autoComplete="postal-code"
                  />
                </label>
              </div>

              <div className="grid-2-columns">
                <label>
                  COUNTRY
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    autoComplete="country-name"
                  />
                </label>

                <label>
                  STATE/REGION
                  <input
                    type="text"
                    name="stateRegion"
                    value={formData.stateRegion}
                    onChange={handleChange}
                    autoComplete="address-level1"
                  />
                </label>
              </div>
            </>
          )}

          <footer className="modal-footer">
            <button type="button" className="btn cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn create-btn" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create"}
            </button>
          </footer>
        </form>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.15);
          z-index: 999;
        }

        .modal-container {
          position: fixed;
          top: 50%;
          left: 50%;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          transform: translate(-50%, -50%);
          background: white;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          padding: 24px;
          box-sizing: border-box;
          z-index: 1000;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .modal-header h2 {
          font-weight: 600;
          font-size: 18px;
          margin: 0;
          color: #333;
        }

        .close-btn {
          border: none;
          background: transparent;
          font-size: 20px;
          cursor: pointer;
          padding: 4px;
          line-height: 1;
          color: #555;
          transition: color 0.2s ease-in-out;
        }
        .close-btn:hover {
          color: #000;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        label {
          font-size: 11px;
          font-weight: 600;
          color: #666;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        input {
          height: 32px;
          padding: 6px 8px;
          border: 1px solid #ddd;
          border-radius: 3px;
          font-size: 14px;
          font-family: inherit;
          outline-offset: 2px;
          transition: border-color 0.2s ease-in-out;
        }
        input:focus {
          border-color: #a2b5a1;
          outline: none;
        }

        .grid-2-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .toggle-fields-btn {
          border: none;
          background: transparent;
          color: #3f7d6e;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          align-self: flex-start;
          padding: 0;
          margin-top: -12px;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .toggle-fields-btn:hover {
          text-decoration: underline;
        }

        .modal-footer {
          margin-top: 24px;
          display: flex;
          justify-content: flex-start;
          gap: 12px;
        }

        .btn {
          border-radius: 4px;
          font-weight: 700;
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          border: none;
          transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
        }

        .cancel-btn {
          background: #eee;
          color: #555;
        }
        .cancel-btn:hover {
          background: #ddd;
        }

        .create-btn {
          background: #a2b5a1;
          color: white;
        }
        .create-btn:hover {
          background: #8a9a8a;
        }

        @media (max-width: 480px) {
          .grid-2-columns {
            grid-template-columns: 1fr;
          }
          .modal-container {
            width: 95%;
            padding: 16px 20px;
          }
          .modal-footer {
            flex-direction: column;
            gap: 10px;
          }
          .btn {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
};

export default CreateRecipientModal;

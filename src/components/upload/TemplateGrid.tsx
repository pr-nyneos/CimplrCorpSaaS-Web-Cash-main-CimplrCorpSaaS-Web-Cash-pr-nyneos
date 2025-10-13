import React, { useState } from "react";
import { Download } from "lucide-react"; 

type Template = {
  id: string | number;
  name: string;
  type: string;
  description?: string;
  headers?: string[];
  sampleRow?: any[];
};

type Format = "csv" | "xlsx";
const formats: Format[] = ["csv", "xlsx"];

type TemplateGridProps = {
  templates: Template[];
  handleDownload: (template: Template, format: Format) => void;
};

const TemplateGrid: React.FC<TemplateGridProps> = ({ templates, handleDownload }) => {
  const [downloadMenuOpen, setDownloadMenuOpen] = useState<string | number | null>(null);

  React.useEffect(() => {
    const handleClick = () => setDownloadMenuOpen(null);
    if (downloadMenuOpen !== null) {
      window.addEventListener("click", handleClick);
      return () => window.removeEventListener("click", handleClick);
    }
  }, [downloadMenuOpen]);

  return (
    <div className="bg-secondary-color-lt p-6 rounded-lg shadow-sm border border-border">
      <div className="wi-full px-4 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-secondary-text-dark mb-2">
            Download Templates
          </h1>
          <p className="text-secondary-text text-sm">
            Use our standardized templates to ensure your data is formatted correctly.
          </p>
        </div>
        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-primary-xl p-6 rounded-lg shadow-sm border border-border hover:shadow-md transition-shadow duration-200 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-medium text-secondary-text-dark mb-1 ">
                    {template.name}
                  </h3>
                  <p className="text-sm text-primary mb-1">{template.type}</p>
                  {template.description && (
                    <p className="text-xs text-secondary-text">{template.description}</p>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDownloadMenuOpen(downloadMenuOpen === template.id ? null : template.id);
                    }}
                    className="ml-4 p-1 text-primary-lt hover:text-primary transition-colors duration-200"
                    aria-label={`Download ${template.name}`}
                  >
                    <Download size={16} />
                  </button>
                  {downloadMenuOpen === template.id && (
                    <div
                      className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10 overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                      role="menu"
                      tabIndex={-1}
                      aria-label={`Download format options for ${template.name}`}
                    >
                      {formats.map((format) => (
                        <button
                          key={format}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                          role="menuitem"
                          tabIndex={0}
                          onClick={() => {
                            // Defensive check for headers presence before download
                            if (template.headers && template.headers.length > 0) {
                              handleDownload(template, format);
                            } else {
                              alert("This template has no headers defined for download.");
                            }
                            setDownloadMenuOpen(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              if (template.headers && template.headers.length > 0) {
                                handleDownload(template, format);
                              } else {
                                alert("This template has no headers defined for download.");
                              }
                              setDownloadMenuOpen(null);
                            }
                          }}
                        >
                          Download as {format.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplateGrid;

import type { ReactNode } from 'react';
import { saveAs } from 'file-saver';

interface ChartContainerProps {
  title: string;
  children: ReactNode;
  className?: string;
  exportEnabled?: boolean;
  onExport?: () => void;
  actions?: ReactNode;
  exportFileName?: string;
  selectedFilters?: Array<{
    label: string;
    value: string;
  }>;
}

// Utility function to export chart as SVG
export const exportChartAsSvg = (chartTitle: string, fileName: string = 'chart.svg') => {
  const chartContainers = document.querySelectorAll('.glass-card');
  let chartSvg = null;
  
  chartContainers.forEach(container => {
    const title = container.querySelector('h2');
    if (title && title.textContent?.includes(chartTitle)) {
      chartSvg = container.querySelector('svg');
    }
  });
  
  if (!chartSvg) {
    console.warn(`Chart with title "${chartTitle}" not found`);
    return;
  }
  
  const xml = new XMLSerializer().serializeToString(chartSvg);
  const svg64 = btoa(unescape(encodeURIComponent(xml)));
  const b64start = "data:image/svg+xml;base64,";
  saveAs(b64start + svg64, fileName);
};

export const ChartContainer = ({
  title,
  children,
  className = '',
  exportEnabled = true,
  onExport,
  actions,
  exportFileName = 'chart.svg',
  selectedFilters = []
}: ChartContainerProps) => {
  
  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      // Use the built-in export function if no custom export function is provided
      exportChartAsSvg(title, exportFileName);
    }
  };
  return (
    <div
      className={`bg-secondary-color-lt flex flex-col p-4 grow shrink basis-0 min-w-0 max-w-full rounded-2xl shadow-xl border border-border overflow-hidden glass-card ${className}`}
      style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(8px)",
      }}
    >
      <h2 className="text-xl font-semibold text-primary-lt pt-2 pb-2 text-center">
        {title}
      </h2>
      <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center">
        <div
          className="w-full h-full max-w-full"
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 2px 12px 0 #e3f2fd",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: 10,
              top: 10,
              zIndex: 2,
              display: "flex",
              gap: 8,
            }}
          >
            {exportEnabled && (
              <button
                className="px-2 py-1 rounded bg-primary text-white text-xs shadow"
                onClick={handleExport}
              >
                Export
              </button>
            )}
            {actions}
          </div>
          
          {/* Selected Filters Display */}
          {selectedFilters.length > 0 && (
            <div
              style={{
                position: "absolute",
                left: 10,
                top: 10,
                zIndex: 2,
                display: "flex",
                flexDirection: "row",
                gap: 4,
                maxWidth: "400px",
              }}
            >
              {selectedFilters.map((filter, index) => (
                <div
                  key={index}
                  className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs shadow border border-blue-200"
                  style={{
                    fontSize: "10px",
                    fontWeight: "500",
                  }}
                >
                  <span className="font-semibold">{filter.label}:</span> {filter.value}
                </div>
              ))}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};
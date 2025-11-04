import { useState } from 'react';
import Button from './Button';
import { downloadCSV, downloadJSON } from '@/utils/exportUtils';

export default function ExportMenu({ data, filename, formatData, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExportCSV = () => {
    const formattedData = formatData ? formatData(data) : data;
    downloadCSV(formattedData, filename);
    setIsOpen(false);
  };

  const handleExportJSON = () => {
    const formattedData = formatData ? formatData(data) : data;
    downloadJSON(formattedData, filename);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        📥 Export
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
              <button
                onClick={handleExportCSV}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
              >
                📄 Export as CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
              >
                📋 Export as JSON
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FileUploadModal({ isOpen, onClose }: FileUploadModalProps) {
  const [reports, setReports] = useState([{ ticker: '', year: '' }]);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resets the state
  const resetState = () => {
    setReports([{ ticker: '', year: '' }]);
    setFile(null);
    setError(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const addReportRow = () => {
    setReports([...reports, { ticker: '', year: '' }]);
  };

  const updateReport = (index: number, field: 'ticker' | 'year', value: string) => {
    const newReports = [...reports];
    newReports[index][field] = value;
    setReports(newReports);
  };

  const removeReport = (index: number) => {
    const newReports = reports.filter((_, i) => i !== index);
    setReports(newReports);
  };

  const handleSubmitReports = async () => {
    const isValid = reports.every(
      (report) =>
        report.ticker.trim() !== '' && report.year.trim() !== '' && !isNaN(Number(report.year))
    );

    if (!isValid) {
      setError('Please fill all ticker and year fields with valid data.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8156/upload_report/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_tickers: reports.map((r) => r.ticker),
          year: reports.map((r) => Number(r.year)),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      alert('Reports uploaded successfully!');
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8156/upload_file/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'File upload failed');
      }

      alert('File uploaded successfully!');
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Upload SEC 10-K Reports</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-200"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          {reports.map((report, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Company Ticker"
                value={report.ticker}
                onChange={(e) => updateReport(index, 'ticker', e.target.value)}
                className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                disabled={isLoading}
              />
              <input
                type="number"
                placeholder="Year"
                value={report.year}
                onChange={(e) => updateReport(index, 'year', e.target.value)}
                className="w-24 p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                disabled={isLoading}
              />
              {reports.length > 1 && (
                <button
                  onClick={() => removeReport(index)}
                  className="text-red-400 hover:text-red-600"
                  disabled={isLoading}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="text-gray-400 text-center mb-4">OR</div>

        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Upload a file</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-gray-400 bg-gray-700 border border-gray-600 rounded p-2"
            disabled={isLoading}
          />
        </div>

        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

        <div className="flex justify-end space-x-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-600 rounded text-gray-400 hover:bg-gray-700 hover:text-white"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={file ? handleFileUpload : handleSubmitReports}
            className={`px-4 py-2 rounded ${
              isLoading
                ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

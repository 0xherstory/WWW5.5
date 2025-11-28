'use client';

import React, { useState, useRef } from 'react';
import { Camera, ImagePlus, Sparkles, X, ArrowRight, Upload } from 'lucide-react';
import { Transaction } from '@/lib/constants';
import { ImportPreviewModal } from './ImportPreviewModal';
import { detectFileType, processMultipleFiles } from '@/utils/fileParser';

interface AIInputHubProps {
  onAnalyze: (text: string, image?: File) => void;
  isLoading: boolean;
  parsedResult: Transaction | null;
  onConfirmTransaction: () => void;
  onBatchImport?: (transactions: Transaction[]) => void;
}

export const AIInputHub: React.FC<AIInputHubProps> = ({ 
  onAnalyze, 
  isLoading,
  parsedResult,
  onConfirmTransaction,
  onBatchImport
}) => {
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedData, setImportedData] = useState<Transaction[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    onAnalyze(text, selectedImage || undefined);
  };

  const handleImportSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImportLoading(true);
    setImportStatus('Processing files...');

    try {
      const fileArray = Array.from(files);
      const firstFileType = detectFileType(fileArray[0]);

      // Handle different file types with appropriate API
      if (firstFileType === 'csv' || firstFileType === 'excel') {
        // Process first file only
        const file = fileArray[0];
        const base64 = await fileToBase64(file);
        
        const response = await fetch('/api/import-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            fileData: base64,
            fileName: file.name 
          })
        });

        const result = await response.json();
        console.log('=== CSV Import Response ===');
        console.log('Full result:', result);
        console.log('Data array:', result.data);
        console.log('Data length:', result.data?.length);

        if (result.success) {
          console.log('Setting importedData with', result.data.length, 'items');
          setImportedData(result.data);
          setShowImportModal(true);
          console.log('Modal should now be visible with data');
        } else {
          alert(result.error || 'File parsing failed');
        }
      } else if (firstFileType === 'image') {
        // Batch process images
        setImportStatus(`Processing ${fileArray.length} images...`);
        const images = await Promise.all(
          fileArray.map(file => fileToBase64(file))
        );

        const response = await fetch('/api/import-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images })
        });

        const result = await response.json();
        console.log('=== Image Import Response ===');
        console.log('Full result:', result);
        console.log('Data array:', result.data);
        console.log('Data length:', result.data?.length);

        if (result.success) {
          console.log('Setting importedData with', result.data.length, 'items');
          setImportedData(result.data);
          setShowImportModal(true);
          if (result.errors && result.errors.length > 0) {
            console.warn('Some images failed to process:', result.errors);
          }
        } else {
          alert(result.error || 'Image recognition failed');
        }
      } else if (firstFileType === 'pdf') {
        // Process PDF
        const file = fileArray[0];
        const base64 = await fileToBase64(file);
        
        const response = await fetch('/api/import-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileData: base64 })
        });

        const result = await response.json();
        console.log('=== PDF Import Response ===');
        console.log('Full result:', result);
        console.log('Data array:', result.data);
        console.log('Data length:', result.data?.length);

        if (result.success) {
          console.log('Setting importedData with', result.data.length, 'items');
          setImportedData(result.data);
          setShowImportModal(true);
          console.log('Modal should now be visible with data');
        } else {
          alert(result.error || 'PDF parsing failed');
        }
      } else {
        alert('Unsupported file format');
      }
    } catch (error: any) {
      console.error('File import error:', error);
      alert(error.message || 'File import failed');
    } finally {
      setImportLoading(false);
      setImportStatus('');
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const handleConfirmImport = (data: Transaction[]) => {
    if (onBatchImport) {
      onBatchImport(data);
    }
    setShowImportModal(false);
    setImportedData([]);
  };

  // Helper function: Convert file to Base64
  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return (
    <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-primary">AI Quick Add</h3>
        </div>

        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type naturally, e.g., 'Lunch at Starbucks for $12.50' or upload a receipt..."
            className="w-full min-h-[80px] text-lg text-primary placeholder:text-gray-300 border-none focus:ring-0 resize-none bg-transparent p-0"
            disabled={isLoading}
          />
          
          {/* Image Preview Area */}
          {imagePreview && (
            <div className="mt-4 relative inline-block group">
              <img 
                src={imagePreview} 
                alt="Upload preview" 
                className="h-24 w-auto rounded-xl border border-gray-200 shadow-sm object-cover"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-100 text-gray-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-50">
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              className="hidden"
              accept="image/*"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-secondary hover:text-primary hover:bg-gray-50 rounded-full transition-colors tooltip flex items-center gap-2"
              title="Upload Receipt"
              disabled={importLoading}
            >
              <ImagePlus className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Add Receipt</span>
            </button>
            
            {/* Import File Button */}
            <input
              type="file"
              ref={importInputRef}
              onChange={handleImportSelect}
              className="hidden"
              accept=".csv,.xlsx,.xls,.jpg,.jpeg,.png,.pdf"
              multiple
            />
            <button 
              onClick={() => importInputRef.current?.click()}
              className="p-2 text-secondary hover:text-primary hover:bg-gray-50 rounded-full transition-colors tooltip flex items-center gap-2"
              title="Import Files (CSV, Excel, Images, PDF)"
              disabled={importLoading}
            >
              <Upload className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">
                {importLoading ? importStatus : 'Import File'}
              </span>
            </button>
            
            <button 
              className="p-2 text-secondary hover:text-primary hover:bg-gray-50 rounded-full transition-colors md:hidden"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading || (!text && !selectedImage)}
            className={`
              flex items-center px-6 py-2.5 rounded-full font-medium text-white shadow-lg transition-all
              ${isLoading || (!text && !selectedImage) 
                ? 'bg-gray-200 cursor-not-allowed text-gray-400 shadow-none' 
                : 'bg-primary hover:bg-black hover:shadow-primary/30'
              }
            `}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                Analyze Expense
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Transaction Result Confirmation */}
      {parsedResult && (
        <div className="bg-[#fcfcfc] p-4 border-t border-gray-100 animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                        $
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-primary">${parsedResult.amount.toFixed(2)}</span>
                            <span className="text-sm text-secondary truncate max-w-[150px]">{parsedResult.description}</span>
                        </div>
                        <div className="flex gap-2 text-xs text-gray-500 mt-0.5">
                            <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">
                                {parsedResult.category}
                            </span>
                            <span>{parsedResult.date}</span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={onConfirmTransaction}
                    className="px-4 py-2 bg-white border border-gray-200 hover:border-green-500 hover:text-green-600 text-gray-600 rounded-lg text-sm font-medium transition-all shadow-sm"
                >
                    Confirm
                </button>
            </div>
        </div>
      )}

      {/* Import Preview Modal */}
      <ImportPreviewModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        parsedData={importedData}
        onConfirmImport={handleConfirmImport}
      />
    </div>
  );
};
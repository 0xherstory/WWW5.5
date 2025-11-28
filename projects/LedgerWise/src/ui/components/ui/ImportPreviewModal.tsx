'use client';

import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { Transaction } from '@/lib/constants';

interface ImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedData: Transaction[];
  onConfirmImport: (data: Transaction[]) => void;
}

export const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({
  isOpen,
  onClose,
  parsedData,
  onConfirmImport
}) => {
  const [editableData, setEditableData] = useState<Transaction[]>(parsedData);

  // Fix: Sync editableData when parsedData changes
  useEffect(() => {
    console.log('=== ImportPreviewModal Data Update ===');
    console.log('Received parsedData:', parsedData);
    console.log('parsedData length:', parsedData?.length);
    console.log('isOpen:', isOpen);

    if (parsedData && parsedData.length > 0) {
      setEditableData(parsedData);
      console.log('Updated editableData with', parsedData.length, 'records');
    }
  }, [parsedData, isOpen]);

  if (!isOpen) return null;

  const handleFieldChange = (index: number, field: keyof Transaction, value: any) => {
    const updated = [...editableData];
    updated[index] = { ...updated[index], [field]: value };
    setEditableData(updated);
  };

  const handleDelete = (index: number) => {
    setEditableData(editableData.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    onConfirmImport(editableData);
    onClose();
  };

  const incomeCount = editableData.filter(t => t.type === 'income').length;
  const expenseCount = editableData.filter(t => t.type === 'expense').length;
  const totalAmount = editableData.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-serif font-bold text-primary flex items-center gap-3">
                <CheckCircle className="w-7 h-7 text-green-500" />
                Import Preview
              </h2>
              <p className="text-sm text-secondary mt-1">
                Successfully identified <span className="font-bold text-primary">{editableData.length}</span> records - please review and edit
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-y-auto max-h-[calc(90vh-240px)] px-8 py-6">
          {editableData.length === 0 ? (
            <div className="text-center py-12 text-secondary">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No records identified</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {editableData.map((transaction, index) => (
                  <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <select
                        value={transaction.type}
                        onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={transaction.date}
                        onChange={(e) => handleFieldChange(index, 'date', e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-primary/20 focus:border-primary w-full"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={transaction.amount}
                        onChange={(e) => handleFieldChange(index, 'amount', parseFloat(e.target.value) || 0)}
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-primary/20 focus:border-primary w-24"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={transaction.category}
                        onChange={(e) => handleFieldChange(index, 'category', e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="Food">Food</option>
                        <option value="Transport">Transport</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Rent & Bills">Rent & Bills</option>
                        <option value="Investments">Investments</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={transaction.description}
                        onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-primary/20 focus:border-primary w-full"
                        placeholder="Description"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete this record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-secondary">Income: <span className="font-bold text-green-600">{incomeCount}</span> records</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-secondary">Expenses: <span className="font-bold text-red-600">{expenseCount}</span> records</span>
              </div>
              <div className="text-secondary">
                Total: <span className="font-bold text-primary">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={editableData.length === 0}
                className="px-6 py-2.5 bg-primary text-white rounded-full hover:bg-black transition-colors font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Import ({editableData.length} records)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};




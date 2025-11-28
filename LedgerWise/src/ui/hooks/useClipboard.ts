import { useState } from 'react';

interface UseClipboardReturn {
  copied: boolean;
  copyToClipboard: (text: string) => Promise<void>;
  resetCopied: () => void;
}

export function useClipboard(timeout: number = 2000): UseClipboardReturn {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      // Auto-reset after timeout
      setTimeout(() => {
        setCopied(false);
      }, timeout);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), timeout);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const resetCopied = () => setCopied(false);

  return { copied, copyToClipboard, resetCopied };
}

import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../utils/cn';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  type = 'danger'
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={cn(
              "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
              type === 'danger' ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            )}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                {message}
              </p>
            </div>
            <button 
              onClick={onCancel}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
          >
            {cancelText || t('common.cancel', 'Cancel')}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors",
              type === 'danger' 
                ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" 
                : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
            )}
          >
            {confirmText || t('common.confirm', 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

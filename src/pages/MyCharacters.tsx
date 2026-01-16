import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Edit2, Trash2, Bot } from 'lucide-react';
import { Character } from '../types';
import { storage } from '../utils/storage';
import { cn } from '../utils/cn';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const MyCharacters: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [charToDelete, setCharToDelete] = useState<string | null>(null);

  useEffect(() => {
    setCharacters(storage.getCustomCharacters());
  }, []);

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCharToDelete(id);
  };

  const handleConfirmDelete = () => {
    if (charToDelete) {
      storage.deleteCustomCharacter(charToDelete);
      setCharacters(storage.getCustomCharacters());
      setCharToDelete(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t('myCharacters.title', 'My AI Characters')}
          </h1>
        </div>
        
        <button
          onClick={() => navigate('/create-character')}
          className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors shadow-lg shadow-emerald-500/30 gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('create.createNew')}
        </button>
      </div>

      {characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
            <Bot className="w-12 h-12 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            {t('myCharacters.empty', 'No Custom Characters Yet')}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm text-center">
            {t('myCharacters.emptyDesc', 'Create unique AI personalities powered by Ollama or OpenAI to join your roundtables.')}
          </p>
          <button
            onClick={() => navigate('/create-character')}
            className="inline-flex items-center px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
          >
            {t('create.createNew')}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((char) => (
            <div 
              key={char.id}
              onClick={() => navigate(`/create-character?edit=${char.id}`)}
              className="group bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all cursor-pointer shadow-sm hover:shadow-md relative overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-16 h-16 rounded-full overflow-hidden border-2 flex-shrink-0",
                  char.color
                )}>
                  <img 
                    src={char.avatar} 
                    alt={char.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white truncate pr-6">
                    {char.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full truncate max-w-[120px]">
                      {char.tag}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase",
                      char.modelConfig?.provider === 'ollama' 
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                        : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 border-green-200 dark:border-green-800"
                    )}>
                      {char.modelConfig?.provider}
                    </span>
                    <span className="text-xs text-slate-400 truncate">
                      {char.modelConfig?.model}
                    </span>
                  </div>
                </div>
              </div>

              <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/create-character?edit=${char.id}`);
                  }}
                  className="p-1.5 bg-white dark:bg-slate-700 text-slate-400 hover:text-blue-500 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm"
                  title={t('common.edit', 'Edit')}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleDeleteClick(e, char.id)}
                  className="p-1.5 bg-white dark:bg-slate-700 text-slate-400 hover:text-rose-500 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm"
                  title={t('common.delete', 'Delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!charToDelete}
        title={t('common.delete', 'Delete')}
        message={t('myCharacters.deleteConfirm', 'Are you sure you want to delete this character?')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setCharToDelete(null)}
        type="danger"
      />
    </div>
  );
};

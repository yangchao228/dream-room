import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCharacters } from '../data/characters';
import { Character, Team } from '../types';
import { CharacterCard } from '../components/CharacterCard';
import { storage } from '../utils/storage';
import { ArrowRight, Users, MessageSquare } from 'lucide-react';
import { cn } from '../utils/cn';

export const CreateTeam: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [error, setError] = useState('');

  const currentCharacters = useMemo(() => getCharacters(i18n.language), [i18n.language]);

  const handleSelectCharacter = (character: Character) => {
    setError('');
    if (selectedIds.includes(character.id)) {
      setSelectedIds(selectedIds.filter(id => id !== character.id));
    } else {
      if (selectedIds.length >= 3) {
        setError(t('create.error.selectChars'));
        return;
      }
      setSelectedIds([...selectedIds, character.id]);
    }
  };

  const handleCreate = () => {
    if (selectedIds.length < 2) {
      setError(t('create.error.selectChars'));
      return;
    }
    if (!topic.trim()) {
      setError(t('create.error.enterTopic'));
      return;
    }

    const selectedCharacters = currentCharacters.filter(c => selectedIds.includes(c.id));

    const newTeam: Team = {
      id: crypto.randomUUID(),
      name: `${selectedCharacters[0].name} & Friends`, // Fallback name
      topic: topic.trim(),
      characters: selectedCharacters,
      createdAt: Date.now()
    };

    storage.saveTeam(newTeam);
    navigate(`/chat/${newTeam.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
        {t('create.title')}
      </h1>

      <div className="space-y-8">
        {/* Step 1: Select Characters */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
              1
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('create.step1')}
            </h2>
            <span className="ml-auto text-sm font-medium text-slate-500">
              {t('create.selected')}: {selectedIds.length}/3
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {currentCharacters.map(char => (
              <CharacterCard
                key={char.id}
                character={char}
                isSelected={selectedIds.includes(char.id)}
                onSelect={handleSelectCharacter}
              />
            ))}
          </div>
        </section>

        {/* Step 2: Enter Topic */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
              2
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {t('create.step2')}
            </h2>
          </div>

          <div className="relative">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t('create.topicPlaceholder')}
              className="w-full px-6 py-4 text-lg bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:ring-0 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </section>

        {/* Error & Submit */}
        <div className="sticky bottom-6 pt-4 bg-gradient-to-t from-slate-50 to-transparent dark:from-slate-900 pb-2">
           {error && (
            <div className="text-rose-500 text-center mb-4 font-medium animate-pulse">
              {error}
            </div>
          )}
          
          <button
            onClick={handleCreate}
            disabled={selectedIds.length < 2 || !topic.trim()}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2",
              selectedIds.length >= 2 && topic.trim()
                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30 transform hover:scale-[1.02]"
                : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
            )}
          >
            {t('create.start')}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

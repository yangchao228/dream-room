import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCharacters } from '../data/characters';
import { Character, Team, TeamType } from '../types';
import { CharacterCard } from '../components/CharacterCard';
import { storage } from '../utils/storage';
import { ArrowRight, Users, MessageSquare, Plus, ArrowLeft, MessageCircle, Gavel, Lightbulb, Mic } from 'lucide-react';
import { cn } from '../utils/cn';

export const CreateTeam: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [teamType, setTeamType] = useState<TeamType>('chat');
  const [error, setError] = useState('');

  const builtInCharacters = useMemo(() => getCharacters(i18n.language), [i18n.language]);
  const customCharacters = storage.getCustomCharacters();

  // Combine both lists for selection logic, but display them separately
  const allCharacters = [...builtInCharacters, ...customCharacters];

  const handleSelectCharacter = (character: Character) => {
    setError('');
    if (selectedIds.includes(character.id)) {
      setSelectedIds(selectedIds.filter(id => id !== character.id));
    } else {
      if (selectedIds.length >= 4) {
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

    const selectedCharacters = allCharacters.filter(c => selectedIds.includes(c.id));

    const newTeam: Team = {
      id: crypto.randomUUID(),
      name: `${selectedCharacters[0].name} & Friends`, // Fallback name
      topic: topic.trim(),
      type: teamType,
      characters: selectedCharacters,
      createdAt: Date.now()
    };

    storage.saveTeam(newTeam);
    navigate(`/chat/${newTeam.id}`);
  };
  
  const getTypeIcon = (type: TeamType) => {
    switch (type) {
        case 'chat': return <MessageCircle className="w-6 h-6" />;
        case 'debate': return <Gavel className="w-6 h-6" />;
        case 'brainstorm': return <Lightbulb className="w-6 h-6" />;
        case 'interview': return <Mic className="w-6 h-6" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
        </button>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {t('create.title')}
        </h1>
      </div>

      <div className="space-y-8">
        {/* Step 1: Select Type */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
              1
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              {t('create.step1')}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(['chat', 'debate', 'brainstorm', 'interview'] as TeamType[]).map((type) => (
                <button
                    key={type}
                    onClick={() => setTeamType(type)}
                    className={cn(
                        "flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left",
                        teamType === type
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                >
                    <div className={cn(
                        "p-3 rounded-full shrink-0",
                        teamType === type ? "bg-blue-100 text-blue-600" : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                    )}>
                        {getTypeIcon(type)}
                    </div>
                    <div>
                        <h3 className={cn(
                            "font-semibold mb-1",
                            teamType === type ? "text-blue-700 dark:text-blue-300" : "text-slate-900 dark:text-white"
                        )}>
                            {t(`create.type.${type}`)}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {t(`create.type.${type}Desc`)}
                        </p>
                    </div>
                </button>
            ))}
          </div>
        </section>

        {/* Step 2: Select Characters */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
              2
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('create.step2')}
            </h2>
            <span className="ml-auto text-sm font-medium text-slate-500">
              {t('create.selected')}: {selectedIds.length}/4
            </span>
          </div>

          {/* Custom Characters Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('create.myCharacters')}
              </h3>
              <button 
                onClick={() => navigate('/create-character')}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                {t('create.createNew')}
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {customCharacters.map(char => (
                <CharacterCard
                  key={char.id}
                  character={char}
                  isSelected={selectedIds.includes(char.id)}
                  onSelect={handleSelectCharacter}
                />
              ))}
              
              {customCharacters.length === 0 && (
                <button 
                  onClick={() => navigate('/create-character')}
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all text-slate-400 hover:text-emerald-600 h-full min-h-[140px]"
                >
                  <Plus className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">{t('create.addCustom')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Built-in Characters Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
              {t('create.standardCharacters')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {builtInCharacters.map(char => (
                <CharacterCard
                  key={char.id}
                  character={char}
                  isSelected={selectedIds.includes(char.id)}
                  onSelect={handleSelectCharacter}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Step 3: Enter Topic */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
              3
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {t('create.step3')}
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

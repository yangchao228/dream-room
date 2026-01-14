import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Team } from '../types';
import { MessageSquare, Users } from 'lucide-react';
import { getCharacterById } from '../data/characters';

interface TeamCardProps {
  team: Team;
}

export const TeamCard: React.FC<TeamCardProps> = ({ team }) => {
  const { t, i18n } = useTranslation();

  return (
    <Link 
      to={`/chat/${team.id}`}
      className="block p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-emerald-500/50 transition-all duration-200"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
          {team.topic}
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
          {new Date(team.createdAt).toLocaleDateString()}
        </span>
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <div className="flex -space-x-3 overflow-hidden">
          {team.characters.map((char) => {
            const localizedChar = getCharacterById(char.id, i18n.language);
            return (
              <img
                key={char.id}
                className={`inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-slate-800 object-cover border-2 ${char.color}`}
                src={char.avatar}
                alt={localizedChar?.name || char.name}
              />
            );
          })}
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">
          {team.characters.length} {t('teamCard.members')}
        </span>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-1">
          <MessageSquare className="w-4 h-4" />
          <span>{t('teamCard.enterChat')}</span>
        </div>
      </div>
    </Link>
  );
};

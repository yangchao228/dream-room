import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Team } from '../types';
import { storage } from '../utils/storage';
import { TeamCard } from '../components/TeamCard';

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    setTeams(storage.getTeams());
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          {t('home.myTeams')}
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          {t('home.subtitle')}
        </p>
      </div>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700">
          <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
            <Plus className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            {t('home.emptyState')}
          </h3>
          <Link
            to="/create"
            className="inline-flex items-center px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors shadow-lg shadow-emerald-500/30"
          >
            {t('home.createFirst')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <Link
            to="/create"
            className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all duration-200 group h-full min-h-[160px]"
          >
            <div className="p-3 bg-white dark:bg-slate-800 rounded-full mb-3 group-hover:scale-110 transition-transform shadow-sm">
              <Plus className="w-6 h-6 text-emerald-500" />
            </div>
            <span className="font-semibold text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              {t('home.create')}
            </span>
          </Link>
          
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
};

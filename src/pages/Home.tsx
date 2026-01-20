import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Users, Download, Upload } from 'lucide-react';
import { Team } from '../types';
import { storage } from '../utils/storage';
import { TeamCard } from '../components/TeamCard';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [teamToReset, setTeamToReset] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTeams(storage.getTeams());
  }, []);

  const handleExport = () => {
    const dataStr = storage.exportData();
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dream_room_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert(t('home.exportSuccess'));
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target?.result as string;
        if (storage.importData(content)) {
            alert(t('home.importSuccess'));
            window.location.reload();
        } else {
            alert(t('home.importError'));
        }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleDeleteClick = (id: string) => {
    setTeamToDelete(id);
  };

  const handleResetClick = (id: string) => {
    setTeamToReset(id);
  };

  const handleDuplicate = (team: Team) => {
    const newTeam: Team = {
        ...team,
        id: crypto.randomUUID(),
        name: `${team.name} (Copy)`,
        createdAt: Date.now()
    };
    storage.saveTeam(newTeam);
    setTeams(storage.getTeams());
  };

  const handleConfirmDelete = () => {
    if (teamToDelete) {
      storage.deleteTeam(teamToDelete);
      setTeams(storage.getTeams());
      setTeamToDelete(null);
    }
  };

  const handleConfirmReset = () => {
    if (teamToReset) {
        storage.saveMessages(teamToReset, []);
        setTeamToReset(null);
        // Optional: Show toast notification
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end px-4 gap-4">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <Download className="w-4 h-4" />
          {t('home.exportData')}
        </button>
        <button
          onClick={handleImportClick}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <Upload className="w-4 h-4" />
          {t('home.importData')}
        </button>
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
        />
        <Link 
          to="/my-characters"
          className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <Users className="w-4 h-4" />
          {t('home.manageCharacters', 'My Characters')}
        </Link>
      </div>

      <div className="text-center space-y-4 py-4">
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
            <TeamCard 
              key={team.id} 
              team={team} 
              onDelete={handleDeleteClick}
              onDuplicate={handleDuplicate}
              onReset={handleResetClick}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!teamToDelete}
        title={t('common.delete', 'Delete')}
        message={t('home.deleteTeamConfirm', 'Are you sure you want to delete this team?')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTeamToDelete(null)}
        type="danger"
      />
      
      <ConfirmDialog
        isOpen={!!teamToReset}
        title={t('chat.resetTitle', 'Reset Roundtable')}
        message={t('chat.resetConfirm', 'Are you sure you want to reset? This will clear all messages.')}
        onConfirm={handleConfirmReset}
        onCancel={() => setTeamToReset(null)}
        confirmText={t('chat.resetConfirmBtn', 'Reset')}
        type="warning"
      />
    </div>
  );
};

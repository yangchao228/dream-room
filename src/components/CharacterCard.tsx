import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Character } from '../types';
import { cn } from '../utils/cn';
import { Check, Edit2 } from 'lucide-react';

interface CharacterCardProps {
  character: Character;
  isSelected: boolean;
  onSelect: (character: Character) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, isSelected, onSelect }) => {
  const navigate = useNavigate();

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selection when clicking edit
    navigate(`/create-character?edit=${character.id}`);
  };

  return (
    <div 
      onClick={() => onSelect(character)}
      className={cn(
        "relative cursor-pointer group flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200",
        isSelected 
          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" 
          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
      )}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-sm z-10">
          <Check className="w-4 h-4" />
        </div>
      )}

      {/* Edit button for custom characters */}
      {character.isCustom && !isSelected && (
        <div 
          onClick={handleEdit}
          className="absolute top-2 right-2 w-7 h-7 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-300 shadow-sm opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-600 hover:text-blue-500 transition-all z-10"
          title="Edit Character"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </div>
      )}
      
      <div className={cn(
        "relative w-20 h-20 rounded-full mb-3 overflow-hidden border-2 p-0.5",
        character.color
      )}>
        <img 
          src={character.avatar} 
          alt={character.name} 
          className="w-full h-full object-cover rounded-full"
        />
      </div>
      
      <h3 className="font-bold text-slate-900 dark:text-white text-center mb-1 line-clamp-1 w-full">
        {character.name}
      </h3>
      
      <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full max-w-full truncate">
        {character.tag}
      </span>
    </div>
  );
};

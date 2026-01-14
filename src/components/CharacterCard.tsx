import React from 'react';
import { Character } from '../types';
import { cn } from '../utils/cn';
import { Check } from 'lucide-react';

interface CharacterCardProps {
  character: Character;
  isSelected: boolean;
  onSelect: (character: Character) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, isSelected, onSelect }) => {
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
      
      <h3 className="font-bold text-slate-900 dark:text-white text-center mb-1">
        {character.name}
      </h3>
      
      <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
        {character.tag}
      </span>
    </div>
  );
};

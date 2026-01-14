import React from 'react';
import { useTranslation } from 'react-i18next';
import { Message, Character } from '../types';
import { getCharacterById } from '../data/characters';
import { cn } from '../utils/cn';

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const { i18n } = useTranslation();
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';
  const character = !isUser && !isSystem ? (message.sender as Character) : null;
  
  // Get localized character data if available, fallback to message snapshot
  const displayCharacter = character ? getCharacterById(character.id, i18n.language) : null;
  const displayName = displayCharacter?.name || character?.name;

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex w-full mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && character && (
        <div className="flex-shrink-0 mr-3">
          <img 
            src={character.avatar} 
            alt={displayName} 
            className={cn("w-10 h-10 rounded-full object-cover border-2", character.color)}
          />
        </div>
      )}
      
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
        isUser 
          ? "bg-emerald-500 text-white rounded-br-none" 
          : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none"
      )}>
        {!isUser && character && (
          <div className="text-xs font-bold mb-1 opacity-70">
            {displayName}
          </div>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
      </div>

      {isUser && (
        <div className="flex-shrink-0 ml-3">
           <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
             <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Me</span>
           </div>
        </div>
      )}
    </div>
  );
};

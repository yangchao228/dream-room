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
  const isHost = typeof message.sender !== 'string' && message.sender.id === 'host';
  const isUser = message.sender === 'user' || isHost;
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
      
      <div className="flex flex-col max-w-[80%]">
        {!isUser && character && (
          <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 ml-1">
            {displayName}
          </span>
        )}
        <div className={cn(
          "rounded-2xl px-4 py-3 shadow-sm",
          isUser 
            ? "bg-emerald-500 text-white rounded-br-none" 
            : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none"
        )}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 ml-3">
           {isHost ? (
             <img 
               src={(message.sender as Character).avatar} 
               alt={(message.sender as Character).name}
               className={cn("w-10 h-10 rounded-full object-cover border-2", (message.sender as Character).color)}
             />
           ) : (
             <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border-2 border-emerald-500 overflow-hidden">
                <img 
                   src="https://api.dicebear.com/7.x/avataaars/svg?seed=Host&backgroundColor=b6e3f4" 
                   alt="Host"
                   className="w-full h-full object-cover"
                />
             </div>
           )}
        </div>
      )}
    </div>
  );
};

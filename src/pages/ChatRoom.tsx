import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Team, Message, Character } from '../types';
import { storage } from '../utils/storage';
import { getCharacterById } from '../data/characters';
import { ChatBubble } from '../components/ChatBubble';
import { cn } from '../utils/cn';
import i18nInstance from '../i18n';
import { llmService, ChatMessage } from '../services/llm';

export const ChatRoom: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [team, setTeam] = useState<Team | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  
  // Thinking state for AI characters
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingCharacter, setThinkingCharacter] = useState<Character | null>(null);
  
  // Refs for simulation loop
  const messagesRef = useRef<Message[]>([]);
  const teamRef = useRef<Team | null>(null);
  const speakerIndexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync refs with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    teamRef.current = team;
  }, [team]);

  // Initial Load
  useEffect(() => {
    if (!teamId) return;
    const teams = storage.getTeams();
    const foundTeam = teams.find(t => t.id === teamId);
    
    if (!foundTeam) {
      navigate('/');
      return;
    }

    setTeam(foundTeam);
    
    // Load existing messages or start new
    const existingMessages = storage.getMessages(teamId);
    if (existingMessages.length > 0) {
      setMessages(existingMessages);
    } else {
      // Start with system message
      const systemMsg: Message = {
        id: crypto.randomUUID(),
        sender: 'system',
        content: t('chat.systemIntro', { topic: foundTeam.topic }),
        timestamp: Date.now()
      };
      addMessage(systemMsg, teamId);
    }

    // Start simulation
    startSimulation();

    return () => stopSimulation();
  }, [teamId, navigate]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const addMessage = (msg: Message, currentTeamId: string) => {
    setMessages(prev => {
      const newMessages = [...prev, msg];
      storage.saveMessages(currentTeamId, newMessages);
      return newMessages;
    });
  };

  const getRandomPhrase = (characterId: string, topic: string) => {
    // Always fetch fresh data based on current language
    const currentCharacter = getCharacterById(characterId, i18nInstance.language);
    if (!currentCharacter || !currentCharacter.phrases.length) return '...';
    
    const phraseTemplate = currentCharacter.phrases[Math.floor(Math.random() * currentCharacter.phrases.length)];
    return phraseTemplate.replace(/{topic}/g, topic);
  };

  const generateAIResponse = async (character: Character, topic: string, history: Message[]) => {
    if (!character.modelConfig) return '...';

    // Prepare history for LLM
    // Limit history to last 10 messages to save tokens/context
    const recentHistory = history.slice(-10);
    const chatMessages: ChatMessage[] = recentHistory.map(msg => {
      if (msg.sender === 'system') {
        return { role: 'system', content: msg.content };
      }
      if (msg.sender === 'user') {
        return { role: 'user', content: msg.content };
      }
      // If sender is a character
      return { 
        role: msg.sender.id === character.id ? 'assistant' : 'user',
        content: `${msg.sender.name}: ${msg.content}` 
      };
    });

    // Add current topic context if not present
    if (chatMessages.length === 0 || chatMessages[0].role !== 'system') {
      chatMessages.unshift({
        role: 'system',
        content: `Current Topic: ${topic}`
      });
    }

    try {
      const service = llmService.getService(character.modelConfig.provider);
      return await service.chat(character.modelConfig, chatMessages);
    } catch (error) {
      console.error('LLM generation failed:', error);
      return `(Error: Failed to connect to ${character.modelConfig.provider} model)`;
    }
  };

  const startSimulation = () => {
    stopSimulation();
    scheduleNextTurn();
  };

  const stopSimulation = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const scheduleNextTurn = () => {
    // If already thinking, don't schedule
    if (isThinking) return;

    timeoutRef.current = setTimeout(async () => {
      if (!teamRef.current) return;
      
      const currentTeam = teamRef.current;
      const characters = currentTeam.characters;
      const speaker = characters[speakerIndexRef.current % characters.length];
      
      // Determine if speaker is AI or Static
      if (speaker.provider === 'ai' && speaker.modelConfig) {
        setIsThinking(true);
        setThinkingCharacter(speaker);
        
        // Pause simulation while thinking
        stopSimulation();
        
        const text = await generateAIResponse(speaker, currentTeam.topic, messagesRef.current);
        
        setIsThinking(false);
        setThinkingCharacter(null);
        
        const newMsg: Message = {
          id: crypto.randomUUID(),
          sender: speaker,
          content: text,
          timestamp: Date.now()
        };

        addMessage(newMsg, currentTeam.id);
        
        // Advance and resume
        speakerIndexRef.current++;
        scheduleNextTurn();
      } else {
        // Static character logic
        const text = getRandomPhrase(speaker.id, currentTeam.topic);
        
        const newMsg: Message = {
          id: crypto.randomUUID(),
          sender: speaker,
          content: text,
          timestamp: Date.now()
        };

        addMessage(newMsg, currentTeam.id);
        
        // Advance turn
        speakerIndexRef.current++;
        scheduleNextTurn();
      }
    }, 1500); // 1.5s interval
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !team) return;

    // Stop current timer to inject user message
    stopSimulation();

    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      content: inputText,
      timestamp: Date.now()
    };

    addMessage(userMsg, team.id);
    setInputText('');

    // Restart simulation after a short delay
    // If an AI was thinking, this might interrupt it, but that's acceptable for now
    // Ideally we might want to let the AI finish or cancel its request
    setTimeout(() => {
        scheduleNextTurn();
    }, 1000);
  };

  if (!team) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[600px] max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm absolute top-0 w-full z-10">
        <Link 
          to="/" 
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="text-center">
          <h2 className="font-bold text-slate-900 dark:text-white text-sm md:text-base line-clamp-1 px-4">
            {team.topic}
          </h2>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
             <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
             Live Roundtable
          </div>
        </div>
        <div className="w-9"></div> {/* Spacer for centering */}
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 pt-20 pb-4 scroll-smooth space-y-4 bg-slate-50 dark:bg-slate-950/50"
      >
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        
        {/* Thinking Indicator */}
        {isThinking && thinkingCharacter && (
          <div className="flex justify-start mb-4 animate-in fade-in slide-in-from-bottom-2">
             <div className="flex items-end gap-2 max-w-[80%]">
               <div className={cn(
                  "w-8 h-8 rounded-full border-2 flex-shrink-0 bg-slate-200 dark:bg-slate-800",
                  thinkingCharacter.color || "border-slate-200"
                )}>
                  <img 
                    src={thinkingCharacter.avatar} 
                    alt={thinkingCharacter.name}
                    className="w-full h-full rounded-full object-cover"
                  />
               </div>
               <div className="p-3 rounded-2xl rounded-bl-none bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('chat.thinking')}</span>
                  </div>
               </div>
             </div>
          </div>
        )}
        
        {/* Invisible element to pad bottom for scrolling */}
        <div className="h-4"></div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <form 
          onSubmit={handleSendMessage}
          className="flex gap-2 items-center"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('chat.inputPlaceholder')}
            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 border-0 rounded-full focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className={cn(
              "p-3 rounded-full transition-all duration-200 flex items-center justify-center",
              inputText.trim() 
                ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30" 
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

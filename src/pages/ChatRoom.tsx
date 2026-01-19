import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Send, Loader2, ChevronDown, Lock, Unlock, RefreshCw } from 'lucide-react';
import { Team, Message, Character } from '../types';
import { storage } from '../utils/storage';
import { getCharacterById } from '../data/characters';
import { ChatBubble } from '../components/ChatBubble';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { cn } from '../utils/cn';
import i18nInstance from '../i18n';
import { llmService, ChatMessage } from '../services/llm';

// New types for meeting flow
type MeetingPhase = 
  | 'intro' 
  | 'round_robin' 
  | 'debate' 
  | 'closing'
  // Opinion Discussion Phases
  | 'opinion_pioneer'
  | 'opinion_rational'
  | 'opinion_realist'
  | 'opinion_rebuttal'
  | 'opinion_followup'
  | 'opinion_converge'
  | 'opinion_statements'
  | 'opinion_summary';

export const ChatRoom: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [team, setTeam] = useState<Team | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  
  // Meeting State
  const [phase, setPhase] = useState<MeetingPhase>('intro');
  // const [currentSpeakerId, setCurrentSpeakerId] = useState<string | null>(null); // Kept for potential UI highlighting
  const [roundRobinIndex, setRoundRobinIndex] = useState(0);

  // Thinking state for AI characters
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingCharacter, setThinkingCharacter] = useState<Character | null>(null);
  
  // Auto-scroll state
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Refs for simulation loop
  const messagesRef = useRef<Message[]>([]);
  const teamRef = useRef<Team | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initializedTeamIdRef = useRef<string | null>(null);
  
  // Refs for flow control
  const phaseRef = useRef<MeetingPhase>('intro');
  const roundRobinIndexRef = useRef(0);
  const nextSpeakerIdRef = useRef<string | null>(null);

  // Sync refs with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    teamRef.current = team;
  }, [team]);
  
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  
  useEffect(() => {
    roundRobinIndexRef.current = roundRobinIndex;
  }, [roundRobinIndex]);

  // Initial Load
  useEffect(() => {
    if (!teamId) return;
    
    // Prevent double initialization in Strict Mode
    if (initializedTeamIdRef.current === teamId) return;
    initializedTeamIdRef.current = teamId;

    const teams = storage.getTeams();
    const foundTeam = teams.find(t => t.id === teamId);
    
    if (!foundTeam) {
      navigate('/');
      return;
    }

    // UPDATE: Replace team characters with latest data from storage/source
    const customCharacters = storage.getCustomCharacters();
    const updatedCharacters = foundTeam.characters.map(char => {
      if (char.isCustom) {
        const latestChar = customCharacters.find(c => c.id === char.id);
        return latestChar || char;
      }
      return char;
    });
    
    const teamWithLiveCharacters = {
      ...foundTeam,
      characters: updatedCharacters
    };

    setTeam(teamWithLiveCharacters);
    
    // Load existing messages or start new
    const existingMessages = storage.getMessages(teamId);
    if (existingMessages.length > 0) {
      setMessages(existingMessages);
      // Determine phase based on message history length as a heuristic if rejoining
      // Simple heuristic: if > 2 messages per character + host, maybe in debate
      // For now, reset to intro or just assume free flow if returning
      // Let's just default to 'debate' if returning to an active room to allow free flow
      if (existingMessages.length > 3) {
          setPhase('debate');
          phaseRef.current = 'debate';
      }
    } else {
      // Start with Host message
      // User is now the Host, so we don't auto-generate the host intro.
      // But we initialize the phase.
      
      // Initialize flow - explicitly set phase to intro if creating new session
      setPhase('intro');
      phaseRef.current = 'intro';
      
      // Force start simulation after a short delay
    }

    // Start simulation
    // Use a slight delay to allow state updates to propagate
    const timerId = setTimeout(() => {
        startSimulation();
    }, 100);

    return () => {
        clearTimeout(timerId);
        stopSimulation();
    };
  }, [teamId, navigate]);

  // Auto-scroll effect
  useEffect(() => {
    if (isAutoScrollEnabled && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isThinking, isAutoScrollEnabled]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 80;
    
    if (!isAtBottom && isAutoScrollEnabled) setIsAutoScrollEnabled(false);
    if (isAtBottom && !isAutoScrollEnabled) setIsAutoScrollEnabled(true);
    setShowScrollButton(!isAtBottom);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
      setIsAutoScrollEnabled(true);
    }
  };

  const toggleAutoScroll = () => {
    setIsAutoScrollEnabled(prev => {
      const newState = !prev;
      if (newState && scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
      return newState;
    });
  };

  const addMessage = (msg: Message, currentTeamId: string) => {
    setMessages(prev => {
      const newMessages = [...prev, msg];
      storage.saveMessages(currentTeamId, newMessages);
      return newMessages;
    });
  };

  const getRandomPhrase = (characterId: string, topic: string) => {
    const currentCharacter = getCharacterById(characterId, i18nInstance.language);
    if (!currentCharacter || !currentCharacter.phrases.length) return '...';
    
    const phraseTemplate = currentCharacter.phrases[Math.floor(Math.random() * currentCharacter.phrases.length)];
    return phraseTemplate.replace(/{topic}/g, topic);
  };

  const generateAIResponse = async (character: Character, topic: string, history: Message[], phaseOverride?: MeetingPhase) => {
    if (!character.modelConfig) return '...';

    const recentHistory = history.slice(-15); // Increased context window
    const chatMessages: ChatMessage[] = recentHistory.map(msg => {
      if (msg.sender === 'system') return { role: 'system', content: msg.content };
      if (msg.sender === 'user') return { role: 'user', content: msg.content };
      
      const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender.id;
      const senderName = typeof msg.sender === 'string' ? 'User' : msg.sender.name;
      
      return { 
        role: senderId === character.id ? 'assistant' : 'user',
        content: `${senderName}: ${msg.content}` 
      };
    });

    // Add context system prompt
    const currentPhase = phaseOverride || phaseRef.current;
    let phaseInstruction = '';
    
    if (currentPhase === 'round_robin') {
        phaseInstruction = `You are participating in a roundtable discussion. It is your turn to speak. 
        Briefly introduce yourself and state your core position on the topic: "${topic}". 
        Keep it concise (under 3 sentences). Do not argue with others yet.`;
    } else if (currentPhase === 'debate') {
        phaseInstruction = `You are in a free debate about "${topic}". 
        React to the previous speaker if relevant, or advance your own viewpoint. 
        Keep the discussion lively but stay in character. 
        Your character description: ${character.description || character.tag}.`;
    } 
    // Opinion Discussion Prompts
    else if (currentPhase === 'opinion_pioneer') {
        phaseInstruction = `You are ${character.name}. Your core character description is: "${character.description || character.tag}".
        Current Role: You are acting as 'The Pioneer' in this discussion.
        Task: Make a simple, extreme judgment on the topic "${topic}" that creates tension. Be bold and provocative.
        Instruction: Combine your character's personality with the Pioneer's boldness.`;
    } else if (currentPhase === 'opinion_rational') {
        phaseInstruction = `You are ${character.name}. Your core character description is: "${character.description || character.tag}".
        Current Role: You are acting as 'The Rationalist'.
        Task: Point out the uncertainty, conditions, or probabilities in the previous judgment on "${topic}". Identify logic gaps.
        Instruction: Use your character's logical faculties to analyze the situation.`;
    } else if (currentPhase === 'opinion_realist') {
        phaseInstruction = `You are ${character.name}. Your core character description is: "${character.description || character.tag}".
        Current Role: You are acting as 'The Realist'.
        Task: Bring the discussion on "${topic}" back to reality. Mention costs, practical difficulties, or the perspective of ordinary people.
        Instruction: Ground the discussion through the lens of your character's practical experience.`;
    } else if (currentPhase === 'opinion_rebuttal') {
        phaseInstruction = `You are ${character.name}. Your core character description is: "${character.description || character.tag}".
        Current Role: 'The Pioneer' (Rebuttal).
        Task: Respond to criticism. Reinforce your stance on "${topic}" with attitude. Frame the risk as an opportunity.
        Instruction: Defend your position using your character's voice.`;
    } else if (currentPhase === 'opinion_followup') {
        phaseInstruction = `You are ${character.name}. Your core character description is: "${character.description || character.tag}".
        Current Role: 'The Rationalist' (Follow-up).
        Task: Calm things down. Point out survivorship bias or boundary conditions regarding "${topic}".
        Instruction: Maintain your character's analytical demeanor.`;
    } else if (currentPhase === 'opinion_converge') {
        phaseInstruction = `You are ${character.name}. Your core character description is: "${character.description || character.tag}".
        Current Role: 'The Converger'.
        Task: Identify the root cause of the disagreement on "${topic}" (e.g., risk tolerance, stage of life). Do not give a conclusion, just summarize the conflict dimensions.
        Instruction: Use your character's wisdom to synthesize the viewpoints.`;
    } else if (currentPhase === 'opinion_statements') {
        phaseInstruction = `You are ${character.name}. Your core character description is: "${character.description || character.tag}".
        Task: Give a one-sentence closing statement on your position regarding "${topic}". Make it memorable.`;
    }

    if (chatMessages.length === 0 || chatMessages[0].role !== 'system') {
      chatMessages.unshift({
        role: 'system',
        content: `Current Topic: ${topic}. ${phaseInstruction}`
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
  
  // Unused host response generator commented out for now to satisfy linter
  /*
  const generateHostResponse = async (topic: string, history: Message[], nextSpeakerName?: string) => {
      // Host is simulated by simple logic or a lightweight model call if we had one.
      // For now, we'll use a simple logic or assume Host is "System" for simplicity, 
      // but to make it dynamic we could use an LLM if we assigned one to Host.
      // Here we'll just return pre-set phrases for flow control to ensure stability.
      
      if (phaseRef.current === 'intro') {
          return t('chat.hostRoundRobinStart', 'Let\'s start by hearing from each of you. Please briefly state your position.');
      }
      
      if (nextSpeakerName) {
          return `Thank you. Next, let's hear from ${nextSpeakerName}.`;
      }
      
      return "Interesting point. Who would like to respond?";
  };
  */

  const handleReset = () => {
    if (!team) return;
    
    stopSimulation();
    setMessages([]);
    storage.saveMessages(team.id, []);
    
    // Reset flow state
    setPhase('intro');
    phaseRef.current = 'intro';
    setRoundRobinIndex(0);
    roundRobinIndexRef.current = 0;
    nextSpeakerIdRef.current = null;
    
    // Re-initialize host intro after short delay
    setTimeout(() => {
        // Start with Host message
        const hostCharacter: Character = {
            id: 'host',
            name: t('chat.hostName', 'Host'),
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Host&backgroundColor=b6e3f4',
            tag: 'Host',
            description: 'Roundtable Host',
            personality: 'custom',
            phrases: [],
            isCustom: false,
            color: 'border-blue-500'
        };

        const hostMsg: Message = {
            id: crypto.randomUUID(),
            sender: hostCharacter,
            content: team.type === 'chat' 
                ? t('chat.opinionIntro', { topic: team.topic }) 
                : t('chat.hostIntro', { topic: team.topic }),
            timestamp: Date.now()
        };
        addMessage(hostMsg, team.id);
        
        // For opinion flow, jump straight to pioneer
        if (team.type === 'chat') {
            setPhase('opinion_pioneer');
            phaseRef.current = 'opinion_pioneer';
        }
        
        startSimulation();
    }, 500);
    
    setShowResetConfirm(false);
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
    if (isThinking) return;

    timeoutRef.current = setTimeout(async () => {
      if (!teamRef.current) return;
      
      const currentTeam = teamRef.current;
      const characters = currentTeam.characters;
      
      // --- MEETING FLOW LOGIC ---
      
      // Handle 'chat' mode (opinion discussion) specifically
      if (currentTeam.type === 'chat') {
          await handleOpinionDiscussionFlow(currentTeam, characters);
          return;
      }
      
      // Default Flow (Debate/Others)
      // 1. INTRO PHASE: Host just spoke (in useEffect). Transition to Round Robin.
      if (phaseRef.current === 'intro') {
          setPhase('round_robin');
          phaseRef.current = 'round_robin';
          setRoundRobinIndex(0);
          roundRobinIndexRef.current = 0;
          scheduleNextTurn();
          return;
      }
      
      // 2. ROUND ROBIN PHASE: Each character speaks once.
      if (phaseRef.current === 'round_robin') {
          const idx = roundRobinIndexRef.current;
          
          if (idx < characters.length) {
              const speaker = characters[idx];
              
              // Host transition message before first speaker? 
              // Maybe not needed if Host Intro covered it, but let's be smooth.
              
              await processSpeakerTurn(speaker, currentTeam);
              
              setRoundRobinIndex(prev => prev + 1);
              roundRobinIndexRef.current += 1;
              scheduleNextTurn();
          } else {
              // All spoke. Transition to Debate.
              setPhase('debate');
              phaseRef.current = 'debate';
              
              // Host announces debate start -> Removed as User is Host
              
              scheduleNextTurn();
          }
          return;
      }
      
      // 3. DEBATE PHASE: Random/Weighted selection or User Input
      if (phaseRef.current === 'debate') {
          let speaker: Character;
          
          // Check for priority override (e.g. from user mention)
          if (nextSpeakerIdRef.current) {
              const forcedSpeaker = characters.find(c => c.id === nextSpeakerIdRef.current);
              if (forcedSpeaker) {
                  speaker = forcedSpeaker;
              } else {
                  // Fallback if forced speaker not found
                  const lastMsg = messagesRef.current[messagesRef.current.length - 1];
                  const lastSpeakerId = typeof lastMsg?.sender === 'string' ? lastMsg.sender : lastMsg?.sender?.id;
                  let availableSpeakers = characters.filter(c => c.id !== lastSpeakerId);
                  if (availableSpeakers.length === 0) availableSpeakers = characters;
                  speaker = availableSpeakers[Math.floor(Math.random() * availableSpeakers.length)];
              }
              // Clear override
              nextSpeakerIdRef.current = null;
          } else {
              // Pick a random speaker for now (simple debate)
              // Avoid same speaker twice in a row if possible
              const lastMsg = messagesRef.current[messagesRef.current.length - 1];
              const lastSpeakerId = typeof lastMsg?.sender === 'string' ? lastMsg.sender : lastMsg?.sender?.id;
              
              let availableSpeakers = characters.filter(c => c.id !== lastSpeakerId);
              if (availableSpeakers.length === 0) availableSpeakers = characters;
              
              speaker = availableSpeakers[Math.floor(Math.random() * availableSpeakers.length)];
          }
          
          await processSpeakerTurn(speaker, currentTeam);
          scheduleNextTurn();
      }

    }, 2000); // 2s interval between turns
  };
  
  const handleOpinionDiscussionFlow = async (currentTeam: Team, characters: Character[]) => {
      // Check for forced speaker override (e.g. from Mention)
      if (nextSpeakerIdRef.current) {
          const forcedSpeaker = characters.find(c => c.id === nextSpeakerIdRef.current);
          if (forcedSpeaker) {
              // We pause the state machine for one turn to let the mentioned character respond
              // We pass 'debate' phase override to prompt so they respond naturally to user
              await processSpeakerTurn(forcedSpeaker, currentTeam, 'debate'); 
              nextSpeakerIdRef.current = null;
              scheduleNextTurn();
              return;
          }
      }

      // Step 0: Intro (Handled by initialization, but we transition to Pioneer)
      if (phaseRef.current === 'intro') {
          // Host already spoke the general intro. 
          // Host explicitly sets the stage for 4 roles -> Removed auto host message
          
          setPhase('opinion_pioneer');
          phaseRef.current = 'opinion_pioneer';
          scheduleNextTurn();
          return;
      }

      // Helper to find a character by role index (modulo if < 4)
      const getCharacterByRole = (roleIndex: number) => characters[roleIndex % characters.length];

      // Step 1: Pioneer (Role 0)
      if (phaseRef.current === 'opinion_pioneer') {
          const speaker = getCharacterByRole(0);
          await processSpeakerTurn(speaker, currentTeam, 'opinion_pioneer');
          setPhase('opinion_rational');
          phaseRef.current = 'opinion_rational';
          scheduleNextTurn();
          return;
      }

      // Step 2: Rationalist (Role 1)
      if (phaseRef.current === 'opinion_rational') {
          const speaker = getCharacterByRole(1);
          await processSpeakerTurn(speaker, currentTeam, 'opinion_rational');
          setPhase('opinion_realist');
          phaseRef.current = 'opinion_realist';
          scheduleNextTurn();
          return;
      }

      // Step 3: Realist (Role 2)
      if (phaseRef.current === 'opinion_realist') {
          const speaker = getCharacterByRole(2);
          await processSpeakerTurn(speaker, currentTeam, 'opinion_realist');
          setPhase('opinion_rebuttal');
          phaseRef.current = 'opinion_rebuttal';
          scheduleNextTurn();
          return;
      }

      // Step 4: Pioneer Rebuttal (Role 0)
      if (phaseRef.current === 'opinion_rebuttal') {
          const speaker = getCharacterByRole(0);
          await processSpeakerTurn(speaker, currentTeam, 'opinion_rebuttal');
          setPhase('opinion_followup');
          phaseRef.current = 'opinion_followup';
          scheduleNextTurn();
          return;
      }

      // Step 5: Rationalist Follow-up (Role 1)
      if (phaseRef.current === 'opinion_followup') {
          const speaker = getCharacterByRole(1);
          await processSpeakerTurn(speaker, currentTeam, 'opinion_followup');
          setPhase('opinion_converge');
          phaseRef.current = 'opinion_converge';
          scheduleNextTurn();
          return;
      }

      // Step 6: Converger (Role 3, or Role 2 if only 3 chars)
      if (phaseRef.current === 'opinion_converge') {
          const speaker = getCharacterByRole(3); // Might wrap to 0 if only 3 chars, ideally Role 3
          await processSpeakerTurn(speaker, currentTeam, 'opinion_converge');
          
          setPhase('opinion_statements');
          phaseRef.current = 'opinion_statements';
          
          // Host announces Closing Statements
          // Wait a bit before host speaks to let previous msg settle? 
          // Actually, let's inject host message right away but scheduled
          
          setTimeout(() => {
              // Removed Auto Host Message
              
              setRoundRobinIndex(0);
              roundRobinIndexRef.current = 0;
              scheduleNextTurn();
          }, 1000);
          
          return;
      }

      // Step 7: Position Statements (Round Robin)
      if (phaseRef.current === 'opinion_statements') {
          const idx = roundRobinIndexRef.current;
          if (idx < characters.length) {
              const speaker = characters[idx];
              await processSpeakerTurn(speaker, currentTeam, 'opinion_statements');
              setRoundRobinIndex(prev => prev + 1);
              roundRobinIndexRef.current += 1;
              scheduleNextTurn();
          } else {
              setPhase('opinion_summary');
              phaseRef.current = 'opinion_summary';
              scheduleNextTurn();
          }
          return;
      }

      // Step 8: System Summary (Host)
      if (phaseRef.current === 'opinion_summary') {
          // Trigger Host Summary Generation
          // For now static, ideally dynamic
          // Removed Auto Host Message
          // End flow
      }
  };

  const processSpeakerTurn = async (speaker: Character, currentTeam: Team, currentPhaseOverride?: MeetingPhase) => {
      if (speaker.provider === 'ai' && speaker.modelConfig) {
        setIsThinking(true);
        setThinkingCharacter(speaker);
        stopSimulation();
        
        const text = await generateAIResponse(speaker, currentTeam.topic, messagesRef.current, currentPhaseOverride);
        
        setIsThinking(false);
        setThinkingCharacter(null);
        
        const newMsg: Message = {
          id: crypto.randomUUID(),
          sender: speaker,
          content: text,
          timestamp: Date.now()
        };
        addMessage(newMsg, currentTeam.id);
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
      }
  };

  const handleMentionClick = (characterName: string) => {
    setInputText(prev => `${prev}@${characterName} `);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !team) return;

    stopSimulation();

    // Check for mentions
    const mentionedCharacter = team.characters.find(c => inputText.includes(`@${c.name}`));
    if (mentionedCharacter) {
      nextSpeakerIdRef.current = mentionedCharacter.id;
      // Force switch to debate phase OR specific opinion phase to allow immediate response
      if (team.type === 'chat') {
           // For opinion flow, we might need a specific 'interrupt' handling or just let it slide into next step
           // But since opinion flow is strict steps, forcing a speaker might break the 'Role' logic (e.g. Pioneer vs Rationalist)
           // HOWEVER, user wants them to answer.
           // Let's keep the phase but force the speaker in the NEXT turn logic.
           // The scheduleNextTurn logic for opinion flow relies on phase to pick speaker.
           // We need to override that.
           
           // Actually, opinion flow logic (handleOpinionDiscussionFlow) strictly picks speaker based on phase.
           // To support mentions, we might need to temporarily switch to a 'user_response' phase or similar, 
           // OR we just hack it by letting the mentioned character speak "out of turn" and then resume?
           
           // Simpler approach for now: If mentioned in opinion flow, we just force them to speak 
           // but we need to handle the state machine.
           // Let's make a special check in scheduleNextTurn.
      } else {
          // For standard debate
          if (phaseRef.current !== 'debate') {
              setPhase('debate');
              phaseRef.current = 'debate';
          }
      }
    }

    const hostCharacter: Character = {
        id: 'host',
        name: t('chat.hostName', 'Host'),
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Host&backgroundColor=b6e3f4',
        tag: 'Host',
        description: 'Roundtable Host',
        personality: 'custom',
        phrases: [],
        isCustom: false,
        color: 'border-blue-500'
    };

    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: hostCharacter,
      content: inputText,
      timestamp: Date.now()
    };

    addMessage(userMsg, team.id);
    setInputText('');
    setIsAutoScrollEnabled(true);
    
    // If user interrupts, maybe reset flow or just continue debate
    if (phaseRef.current === 'intro' || phaseRef.current === 'round_robin') {
        // User interrupted early phases, maybe just switch to debate to handle it?
        // Or just let the next scheduled event happen.
        // Let's force switch to debate so the AI reacts to the user
        setPhase('debate');
        phaseRef.current = 'debate';
    }

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
             {phase === 'intro' && <span className="ml-1 px-1 bg-blue-100 text-blue-700 rounded text-[10px]">Intro</span>}
             {phase === 'round_robin' && <span className="ml-1 px-1 bg-purple-100 text-purple-700 rounded text-[10px]">Statements</span>}
             {phase === 'debate' && <span className="ml-1 px-1 bg-orange-100 text-orange-700 rounded text-[10px]">Debate</span>}
             {phase.startsWith('opinion') && <span className="ml-1 px-1 bg-indigo-100 text-indigo-700 rounded text-[10px]">Opinion Flow</span>}
          </div>
        </div>
        
        <div className="flex gap-2">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={t('chat.reset', 'Reset Roundtable')}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            <button
              onClick={toggleAutoScroll}
              className={cn(
                "p-2 rounded-full transition-colors",
                isAutoScrollEnabled 
                  ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" 
                  : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
              title={isAutoScrollEnabled ? t('chat.autoScrollOn', 'Auto-scroll On') : t('chat.autoScrollOff', 'Auto-scroll Off')}
            >
              {isAutoScrollEnabled ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showResetConfirm}
        onCancel={() => setShowResetConfirm(false)}
        onConfirm={handleReset}
        title={t('chat.resetTitle', 'Reset Roundtable')}
        message={t('chat.resetConfirm', 'Are you sure you want to reset? This will clear all messages and restart the discussion.')}
        confirmText={t('chat.resetConfirmBtn', 'Reset')}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Participants Sidebar (Desktop) */}
        <div className="hidden md:flex w-24 flex-col gap-3 overflow-y-auto pt-20 pb-4 px-2 border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 no-scrollbar items-center flex-shrink-0">
          {team.characters.map((char) => (
            <button
              key={char.id}
              onClick={() => handleMentionClick(char.name)}
              className="flex flex-col items-center gap-1 p-2 w-full hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group"
              title={char.name}
            >
              <div className={cn(
                "w-12 h-12 rounded-full p-0.5 border-2 transition-transform group-hover:scale-105", 
                char.color
              )}>
                <img 
                  src={char.avatar} 
                  alt={char.name} 
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 text-center line-clamp-2 w-full leading-tight">
                {char.name}
              </span>
            </button>
          ))}
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 pt-20 pb-4 scroll-smooth space-y-4 bg-slate-50 dark:bg-slate-950/50 relative"
        >
          {/* Participants Bar (Mobile) */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
            {team.characters.map((char) => (
              <button
                key={char.id}
                onClick={() => handleMentionClick(char.name)}
                className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
              >
                <img 
                  src={char.avatar} 
                  alt={char.name} 
                  className={cn("w-5 h-5 rounded-full object-cover border", char.color)}
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {char.name}
                </span>
              </button>
            ))}
          </div>

          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          
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
          
          <div className="h-4"></div>
        </div>
      </div>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 p-3 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-all animate-in fade-in zoom-in duration-200 z-20"
          title={t('chat.scrollToBottom', 'Scroll to Bottom')}
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

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

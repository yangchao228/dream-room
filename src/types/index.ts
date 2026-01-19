export type PersonalityType = 'musk' | 'einstein' | 'luxun' | 'kobe' | 'custom';

export type CharacterProvider = 'static' | 'ai';

export type ModelProvider = 'ollama' | 'openai' | 'deepseek' | 'moonshot' | 'zhipu' | 'bailian' | 'qwen';

export interface ModelConfig {
  provider: ModelProvider;
  model: string;             // e.g. 'llama3', 'gpt-3.5-turbo'
  apiEndpoint?: string;      // Ollama default 'http://localhost:11434', OpenAI default 'https://api.openai.com/v1'
  apiKey?: string;           // OpenAI needs this, Ollama doesn't
  temperature?: number;      // 0-1, controls randomness
  systemPrompt?: string;     // Core personality instructions
  contextWindow?: number;    // Optional context window size
}

export interface Character {
  id: string;
  name: string;
  avatar: string;
  tag: string;
  personality: PersonalityType;
  color: string;
  
  // Static character fields
  phrases: string[];
  
  // AI character fields
  provider?: CharacterProvider; // 'static' | 'ai'
  description?: string;      // Short description
  modelConfig?: ModelConfig; // Required when provider === 'ai'
  
  // Metadata
  isCustom?: boolean;        // Is this a user-created character
  createdAt?: number;
}

export type TeamType = 'chat' | 'debate' | 'brainstorm' | 'interview';

export interface Team {
  id: string;
  name: string;
  topic: string;
  type?: TeamType; // Optional for backward compatibility
  characters: Character[];
  createdAt: number;
}

export interface Message {
  id: string;
  sender: 'system' | 'user' | Character;
  content: string;
  timestamp: number;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  currentSpeakerIndex: number;
}

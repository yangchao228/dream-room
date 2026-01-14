export type PersonalityType = 'musk' | 'einstein' | 'luxun' | 'kobe';

export interface Character {
  id: string;
  name: string;
  avatar: string;
  tag: string;
  personality: PersonalityType;
  color: string;
  phrases: string[];
}

export interface Team {
  id: string;
  name: string; // Auto-generated or same as topic for simplicity? PRD says "Team Name" in UI, but creation flow only asks for Topic. We can derive name from characters or topic. Let's use Topic as primary display, maybe auto-gen name like "Musk & Einstein's Room"
  topic: string;
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

import { Team, Message, Character } from '../types';

const TEAMS_KEY = 'dream_room_teams';
const CUSTOM_CHARACTERS_KEY = 'dream_room_custom_characters';
const MESSAGES_KEY_PREFIX = 'dream_room_messages_';

export const storage = {
  // Teams
  getTeams: (): Team[] => {
    try {
      const stored = localStorage.getItem(TEAMS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to parse teams from storage', e);
      return [];
    }
  },

  saveTeam: (team: Team): void => {
    try {
      const teams = storage.getTeams();
      // Check if team already exists (update) or is new
      const index = teams.findIndex(t => t.id === team.id);
      if (index >= 0) {
        teams[index] = team;
      } else {
        teams.unshift(team); // Add new team to the beginning
      }
      localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
    } catch (e) {
      console.error('Failed to save team to storage', e);
    }
  },

  deleteTeam: (id: string): void => {
    try {
      const teams = storage.getTeams();
      const newTeams = teams.filter(t => t.id !== id);
      localStorage.setItem(TEAMS_KEY, JSON.stringify(newTeams));
      
      // Also cleanup messages
      localStorage.removeItem(`${MESSAGES_KEY_PREFIX}${id}`);
    } catch (e) {
      console.error('Failed to delete team from storage', e);
    }
  },

  // Custom Characters
  getCustomCharacters: (): Character[] => {
    try {
      const stored = localStorage.getItem(CUSTOM_CHARACTERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to parse custom characters from storage', e);
      return [];
    }
  },

  saveCustomCharacter: (character: Character): void => {
    try {
      const characters = storage.getCustomCharacters();
      const index = characters.findIndex(c => c.id === character.id);
      
      if (index >= 0) {
        characters[index] = character;
      } else {
        characters.unshift(character);
      }
      
      localStorage.setItem(CUSTOM_CHARACTERS_KEY, JSON.stringify(characters));
    } catch (e) {
      console.error('Failed to save custom character to storage', e);
    }
  },

  deleteCustomCharacter: (id: string): void => {
    try {
      const characters = storage.getCustomCharacters();
      const newCharacters = characters.filter(c => c.id !== id);
      localStorage.setItem(CUSTOM_CHARACTERS_KEY, JSON.stringify(newCharacters));
    } catch (e) {
      console.error('Failed to delete custom character from storage', e);
    }
  },

  // Messages
  getMessages: (teamId: string): Message[] => {
    try {
      const stored = localStorage.getItem(`${MESSAGES_KEY_PREFIX}${teamId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to parse messages from storage', e);
      return [];
    }
  },

  saveMessages: (teamId: string, messages: Message[]): void => {
    try {
      localStorage.setItem(`${MESSAGES_KEY_PREFIX}${teamId}`, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save messages to storage', e);
    }
  },

  // Export/Import
  exportData: (): string => {
    const data: Record<string, string | null> = {};
    
    // Core data
    data[TEAMS_KEY] = localStorage.getItem(TEAMS_KEY);
    data[CUSTOM_CHARACTERS_KEY] = localStorage.getItem(CUSTOM_CHARACTERS_KEY);
    
    // Messages for each team
    try {
        const teamsStr = localStorage.getItem(TEAMS_KEY);
        if (teamsStr) {
            const teams: Team[] = JSON.parse(teamsStr);
            teams.forEach(team => {
                const msgKey = `${MESSAGES_KEY_PREFIX}${team.id}`;
                data[msgKey] = localStorage.getItem(msgKey);
            });
        }
    } catch (e) {
        console.error('Error collecting messages for export', e);
    }
    
    return JSON.stringify(data);
  },

  importData: (jsonData: string): boolean => {
    try {
        const data = JSON.parse(jsonData);
        
        // Basic validation
        if (!data || typeof data !== 'object') return false;
        
        // Restore all keys
        Object.keys(data).forEach(key => {
            if (data[key] !== null && typeof data[key] === 'string') {
                localStorage.setItem(key, data[key]);
            }
        });
        
        return true;
    } catch (e) {
        console.error('Import failed', e);
        return false;
    }
  }
};

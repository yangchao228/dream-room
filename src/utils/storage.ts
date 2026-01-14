import { Team, Message } from '../types';

const TEAMS_KEY = 'dream_room_teams';
const MESSAGES_KEY_PREFIX = 'dream_room_messages_';

export const storage = {
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
  }
};

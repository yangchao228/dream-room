import { ModelConfig, ModelProvider } from '../types';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMService {
  chat(config: ModelConfig, messages: ChatMessage[]): Promise<string>;
  testConnection(config: ModelConfig): Promise<boolean>;
  getModels(provider: ModelProvider, endpoint?: string): Promise<string[]>;
}

class OllamaService implements LLMService {
  private async request(endpoint: string, path: string, method: string, body?: any) {
    try {
      const url = `${endpoint.replace(/\/$/, '')}${path}`;
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Ollama request failed:', error);
      throw error;
    }
  }

  async chat(config: ModelConfig, messages: ChatMessage[]): Promise<string> {
    const endpoint = config.apiEndpoint || 'http://localhost:11434';
    
    // Construct the prompt. Ollama's chat API handles role-based messages.
    // If system prompt is provided in config, prepend it if not already present.
    const finalMessages = [...messages];
    if (config.systemPrompt && (finalMessages.length === 0 || finalMessages[0].role !== 'system')) {
      finalMessages.unshift({
        role: 'system',
        content: config.systemPrompt
      });
    }

    const response = await this.request(endpoint, '/api/chat', 'POST', {
      model: config.model,
      messages: finalMessages,
      stream: false, // Use non-streaming for simplicity for now
      options: {
        temperature: config.temperature ?? 0.7,
      }
    });

    return response.message.content;
  }

  async testConnection(config: ModelConfig): Promise<boolean> {
    try {
      const endpoint = config.apiEndpoint || 'http://localhost:11434';
      await this.request(endpoint, '/api/tags', 'GET');
      return true;
    } catch {
      return false;
    }
  }

  async getModels(provider: ModelProvider, endpoint: string = 'http://localhost:11434'): Promise<string[]> {
    try {
      const data = await this.request(endpoint, '/api/tags', 'GET');
      return data.models.map((m: any) => m.name);
    } catch (error) {
      console.warn('Failed to fetch Ollama models:', error);
      return [];
    }
  }
}

class OpenAIService implements LLMService {
  async chat(config: ModelConfig, messages: ChatMessage[]): Promise<string> {
    if (!config.apiKey) {
      throw new Error('OpenAI API Key is required');
    }

    const endpoint = config.apiEndpoint || 'https://api.openai.com/v1';
    
    const finalMessages = [...messages];
    if (config.systemPrompt && (finalMessages.length === 0 || finalMessages[0].role !== 'system')) {
      finalMessages.unshift({
        role: 'system',
        content: config.systemPrompt
      });
    }

    try {
      const response = await fetch(`${endpoint.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: finalMessages,
          temperature: config.temperature ?? 0.7,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API error');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI request failed:', error);
      throw error;
    }
  }

  async testConnection(config: ModelConfig): Promise<boolean> {
    try {
      // Try a simple models list call to verify key
      if (!config.apiKey) return false;
      const endpoint = config.apiEndpoint || 'https://api.openai.com/v1';
      
      const response = await fetch(`${endpoint.replace(/\/$/, '')}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        }
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }

  async getModels(provider: ModelProvider, endpoint: string = 'https://api.openai.com/v1'): Promise<string[]> {
    // For OpenAI, we might just return a static list of popular models to avoid needing a key just to list
    // Or we can implement the API call if a key is provided.
    return ['gpt-3.5-turbo', 'gpt-4o', 'gpt-4-turbo'];
  }
}

export const llmService = {
  ollama: new OllamaService(),
  openai: new OpenAIService(),
  
  getService(provider: ModelProvider): LLMService {
    if (provider === 'openai') {
      return this.openai;
    }
    return this.ollama;
  }
};

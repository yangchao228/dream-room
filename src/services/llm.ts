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
      // Use direct fetch without proxy headers if possible, or ensure CORS is handled by the provider
      // Most providers support CORS for browser usage if configured, but for safety in local dev:
      // We are just doing a standard fetch. If there are CORS issues, the user might need a proxy.
      // However, the error might be due to endpoint construction.
      
      const baseUrl = endpoint.replace(/\/$/, '');
      // Some endpoints might already include /v1, some might not.
      // Standard OpenAI SDK appends /chat/completions to base URL.
      // If user provided "https://api.deepseek.com/v1", we append "/chat/completions" -> "https://api.deepseek.com/v1/chat/completions"
      
      // Fix for OpenAI official API: it should be https://api.openai.com/v1, but sometimes user might just provide https://api.openai.com
      // Also, check if it's actually OpenAI provider to ensure correct endpoint
      
      let finalEndpoint = baseUrl;
      // If the URL ends with /v1/v1 (double v1), fix it
      if (finalEndpoint.endsWith('/v1/v1')) {
          finalEndpoint = finalEndpoint.substring(0, finalEndpoint.length - 3);
      }
      
      const response = await fetch(`${finalEndpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: finalMessages,
          temperature: config.temperature ?? 0.7,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `API Error: ${response.status} ${response.statusText}`;
        try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.error?.message) errorMsg = errorJson.error.message;
        } catch (e) {
            // ignore parse error
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      let content = data.choices[0].message.content;
      
      // Clean up <think> tags if present (common in reasoning models like DeepSeek R1)
      // Handle escaped HTML entities just in case (e.g. &lt;think&gt;)
      content = content
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/&lt;think&gt;[\s\S]*?&lt;\/think&gt;/gi, '')
        .trim();
      
      return content;
    } catch (error: any) {
      console.error('LLM request failed:', error);
      throw new Error(error.message || 'Failed to connect to LLM provider');
    }
  }

  async testConnection(config: ModelConfig): Promise<boolean> {
    try {
      if (!config.apiKey) return false;
      const endpoint = config.apiEndpoint || 'https://api.openai.com/v1';
      
      // Some providers don't support /models endpoint or have strict CORS
      // A better test might be a cheap chat completion
      
      const baseUrl = endpoint.replace(/\/$/, '');
      
      // Try /models first as it's read-only
      try {
          const response = await fetch(`${baseUrl}/models`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${config.apiKey}`
            }
          });
          if (response.ok) return true;
      } catch (e) {
          // If /models fails (e.g. CORS or 404), try a minimal chat completion
          console.warn('Models endpoint failed, trying chat completion...', e);
      }

      // Fallback: Try a minimal chat completion
      
      let finalEndpoint = baseUrl;
      if (finalEndpoint.endsWith('/v1/v1')) {
          finalEndpoint = finalEndpoint.substring(0, finalEndpoint.length - 3);
      }

      const response = await fetch(`${finalEndpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Test connection failed:', error);
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
    if (provider === 'ollama') {
      return this.ollama;
    }
    // All other providers (deepseek, moonshot, etc.) use OpenAI compatible API
    return this.openai;
  }
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Character, ModelConfig, ModelProvider, PersonalityType } from '../types';
import { storage } from '../utils/storage';
import { llmService } from '../services/llm';
import { cn } from '../utils/cn';

export const CreateCharacter: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Form State
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  
  // Model Config State
  const [provider, setProvider] = useState<ModelProvider>('ollama');
  const [modelName, setModelName] = useState('llama3');
  const [customModelName, setCustomModelName] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('http://localhost:11434');
  const [apiKey, setApiKey] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);

  // UI State
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Ollama models on mount
  useEffect(() => {
    if (provider === 'ollama') {
      fetchOllamaModels();
    } else {
      setApiEndpoint('https://api.openai.com/v1');
    }
  }, [provider]);

  const fetchOllamaModels = async () => {
    setIsLoadingModels(true);
    const models = await llmService.ollama.getModels('ollama', apiEndpoint);
    setOllamaModels(models);
    setIsLoadingModels(false);
    
    // If models found and current modelName not in list, select first one
    if (models.length > 0 && !models.includes(modelName) && !customModelName) {
      setModelName(models[0]);
    }
  };

  const handleTestConnection = async () => {
    setConnectionStatus('idle');
    const config: ModelConfig = {
      provider,
      model: customModelName || modelName,
      apiEndpoint,
      apiKey,
      temperature
    };

    const service = llmService.getService(provider);
    const success = await service.testConnection(config);
    setConnectionStatus(success ? 'success' : 'error');
  };

  const handleSubmit = async () => {
    if (!name || !tag || !systemPrompt) return;

    setIsSubmitting(true);
    
    const newCharacter: Character = {
      id: crypto.randomUUID(),
      name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`, // Simple avatar generation
      tag,
      personality: 'custom' as PersonalityType,
      color: 'border-purple-500', // Default color for custom characters
      phrases: [],
      provider: 'ai',
      description,
      isCustom: true,
      createdAt: Date.now(),
      modelConfig: {
        provider,
        model: customModelName || modelName,
        apiEndpoint,
        apiKey: provider === 'openai' ? apiKey : undefined,
        temperature,
        systemPrompt
      }
    };

    storage.saveCustomCharacter(newCharacter);
    
    // Simulate short delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsSubmitting(false);
    navigate('/create');
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/create')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
        </button>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {t('character.title')}
        </h1>
      </div>

      <div className="space-y-8">
        {/* Basic Info Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">1</span>
            {t('character.basicInfo')}
          </h2>
          
          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('character.name')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('character.namePlaceholder')}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('character.tag')}
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder={t('character.tagPlaceholder')}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('character.description')}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('character.descPlaceholder')}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Model Configuration */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">2</span>
            {t('character.modelConfig')}
          </h2>

          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('character.provider')}
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setProvider('ollama')}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-xl border-2 transition-all font-medium",
                    provider === 'ollama'
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "border-slate-200 dark:border-slate-700 hover:border-blue-300"
                  )}
                >
                  {t('character.localOllama')}
                </button>
                <button
                  onClick={() => setProvider('openai')}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-xl border-2 transition-all font-medium",
                    provider === 'openai'
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "border-slate-200 dark:border-slate-700 hover:border-blue-300"
                  )}
                >
                  {t('character.openai')}
                </button>
              </div>
            </div>

            {/* Ollama Specific */}
            {provider === 'ollama' && (
              <div className="space-y-4">
                 <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('character.modelSelection')}
                  </label>
                  {ollamaModels.length > 0 ? (
                    <div className="flex gap-2">
                      <select
                        value={modelName}
                        onChange={(e) => {
                          setModelName(e.target.value);
                          setCustomModelName('');
                        }}
                        className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {ollamaModels.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <button 
                        onClick={fetchOllamaModels}
                        className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600"
                        title={t('character.refresh')}
                      >
                        <Sparkles className={cn("w-5 h-5", isLoadingModels && "animate-spin")} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={customModelName}
                        onChange={(e) => setCustomModelName(e.target.value)}
                        placeholder="e.g. llama3"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {t('character.manualInput')}
                      </p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('character.apiEndpoint')}
                  </label>
                  <input
                    type="text"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* OpenAI Specific */}
            {provider === 'openai' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('character.model')}
                  </label>
                  <select
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="gpt-4-turbo">gpt-4-turbo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('character.apiKey')}
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {t('character.apiKeyHint')}
                  </p>
                </div>
              </div>
            )}

            {/* Test Connection Button */}
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={handleTestConnection}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                {t('character.testConnection')}
              </button>
              {connectionStatus === 'success' && (
                <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {t('character.connected')}
                </span>
              )}
              {connectionStatus === 'error' && (
                <span className="text-sm text-rose-600 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  {t('character.connectionFailed')}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Personality Configuration */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">3</span>
            {t('character.personality')}
          </h2>

          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('character.systemPrompt')}
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder={t('character.systemPromptPlaceholder')}
                rows={6}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                {t('character.systemPromptHint')}
              </p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('character.temperature')}
                </label>
                <span className="text-sm font-mono text-slate-500">{temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>{t('character.precise')}</span>
                <span>{t('character.creative')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Submit Action */}
        <div className="sticky bottom-6 pt-4 bg-gradient-to-t from-slate-50 to-transparent dark:from-slate-900 pb-2">
          <button
            onClick={handleSubmit}
            disabled={!name || !tag || !systemPrompt || isSubmitting}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2",
              name && tag && systemPrompt && !isSubmitting
                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30 transform hover:scale-[1.02]"
                : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <span className="animate-pulse">{t('character.creating')}</span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {t('character.createAction')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

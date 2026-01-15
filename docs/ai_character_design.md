# AI 角色与模型集成设计方案

## 1. 概述
本方案旨在为 Dream Room 增加自定义 AI 角色功能。用户不仅可以使用预设的静态角色，还可以创建由大语言模型（LLM）驱动的角色。
当前阶段重点支持：
1.  **自定义角色存储**: 角色数据存储在本地浏览器 (LocalStorage)，为后续迁移到 Supabase 做准备。
2.  **多模型支持**:
    *   **本地模型**: Ollama (已支持)。
    *   **在线模型**: 预留 OpenAI (ChatGPT) 接口，支持通过 API Key 接入。
3.  **自定义人设**: 支持用户配置角色的系统提示词 (System Prompt) 和背景信息。

## 2. 数据结构设计 (`src/types/index.ts`)

我们需要扩展现有的 `Character` 接口，并引入新的类型来支持模型配置。

```typescript
/**
 * 角色类型定义
 * static: 传统的基于预设语录的角色
 * ai: 基于 LLM 的 AI 角色
 */
export type CharacterProvider = 'static' | 'ai';

/**
 * AI 模型提供商
 * ollama: 本地 Ollama 模型
 * openai: OpenAI (ChatGPT)
 */
export type ModelProvider = 'ollama' | 'openai';

/**
 * AI 模型配置
 */
export interface ModelConfig {
  provider: ModelProvider;
  model: string;             // 例如: 'llama3', 'gpt-3.5-turbo'
  apiEndpoint?: string;      // Ollama 默认为 'http://localhost:11434', OpenAI 为 'https://api.openai.com/v1'
  apiKey?: string;           // OpenAI 需要，Ollama 不需要
  temperature?: number;      // 0-1, 控制随机性
  systemPrompt?: string;     // 核心人设提示词
  contextWindow?: number;    // 上下文窗口大小 (可选)
}

export interface Character {
  id: string;
  name: string;
  avatar: string;
  tag: string;
  personality: PersonalityType; // 用于 UI 颜色/图标风格
  color: string;
  
  // 静态角色字段
  phrases?: string[]; 
  
  // AI 角色字段
  type: CharacterProvider;   // 'static' | 'ai'
  description?: string;      // 角色简短描述
  modelConfig?: ModelConfig; // AI 配置，当 type === 'ai' 时必填
  
  // 元数据
  isCustom?: boolean;        // 是否为用户自定义角色
  createdAt?: number;
}
```

## 3. 存储层设计 (`src/utils/storage.ts`)

为了支持自定义角色，我们需要在 LocalStorage 中增加对 `custom_characters` 的管理。

### 3.1 存储键值
*   `dream_room_teams`: 现有的团队列表。
*   `dream_room_custom_characters`: **新增**，用于存储用户创建的角色列表。

### 3.2 新增方法
*   `getCustomCharacters()`: 获取所有自定义角色。
*   `saveCustomCharacter(character: Character)`: 保存或更新自定义角色。
*   `deleteCustomCharacter(id: string)`: 删除自定义角色。
*   `getAllCharacters()`: 获取所有角色（内置 + 自定义）。

> **Supabase 对接预留**: 后续将 `storage` 对象的方法替换为 Supabase SDK 调用即可，保持接口一致性。

## 4. UI/UX 设计

### 4.1 角色创建页面 (`/create-character`)
新增一个页面，包含以下表单项：
1.  **基本信息**:
    *   头像 (支持上传或 AI 生成 - 暂用随机/默认)。
    *   名称 (Name)。
    *   标签 (Tag)。
    *   描述 (Description)。
2.  **模型配置**:
    *   **是否本地模型**: 单选项，默认为 "是"。
    *   **模型源**: 是本地模型，则默认选 "Ollama"，如果是否，默认选 "OpenAI"。
    *   **模型名称**: 
        *   Ollama: 下拉选择，通过 API 获取列表供选择，兜底手动输入。
        *   OpenAI: 下拉选择 (`gpt-3.5-turbo`, `gpt-4o`)。
    *   **API Key**: 当选择 OpenAI 时显示。
    *   **API 地址**: 默认自动填充，允许修改。
3.  **人设配置 (Prompt Engineering)**:
    *   **系统提示词 (System Prompt)**: 提供一个大的文本区域，预设一些模板（例如：“你是一个暴躁的厨师...”）。
    *   **温度 (Temperature)**: 滑动条 0.0 - 1.0。

### 4.2 团队创建流程优化 (`CreateTeam.tsx`)
在选择角色步骤：
*   展示“内置角色”和“我的角色”两个分组。
*   添加一个“+ 新建角色”按钮，跳转到 `/create-character`。

## 5. 服务层与 API 集成

### 5.1 统一 LLM 服务 (`src/services/llm.ts`)
创建一个统一的接口来屏蔽不同提供商的差异。

```typescript
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMService {
  chat(config: ModelConfig, messages: ChatMessage[]): Promise<string>;
  testConnection(config: ModelConfig): Promise<boolean>;
  getModels(provider: ModelProvider, endpoint?: string): Promise<string[]>;
}
```

### 5.2 Ollama 实现
*   复用之前的 `OllamaService` 逻辑。
*   增加 `getModels` 方法，调用 `/api/tags` 获取本地已安装模型列表。

### 5.3 OpenAI 实现 (预留)
*   实现标准的 OpenAI API 调用格式。
*   需要处理 API Key 的安全存储（目前仅存 LocalStorage，风险较低；后端化后需加密存储）。

## 6. 开发计划

1.  **重构数据类型**: 更新 `Character` 和 `Team` 定义。
2.  **升级存储层**: 实现 `custom_characters` 的 CRUD。
3.  **实现 LLM 服务层**: 封装 Ollama 和 OpenAI 的通用调用接口。
4.  **开发角色创建页**: 实现表单和验证逻辑。
5.  **集成到聊天室**: 修改 `ChatRoom` 逻辑，支持读取自定义角色的配置并调用 LLM 服务。

## 7. 设计决策确认
*   **OpenAI Key 管理**: 采用 BYOK (Bring Your Own Key) 模式。Key 由用户自行填入，仅加密存储在用户浏览器的 LocalStorage 中，平台不进行服务器端存储。
*   **Ollama 模型选择**: 采用“自动扫描 + 手动兜底”策略。优先尝试调用本地接口 `http://localhost:11434/api/tags` 获取模型列表；若调用失败（例如未配置 CORS），则允许用户手动输入模型名称。

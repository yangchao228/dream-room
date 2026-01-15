# 本地 Ollama 模型集成设计方案

## 1. 概述
本方案旨在为 Dream Room 添加本地 LLM 支持，允许创建一个可以直接调用本地 Ollama 接口的角色，从而实现更真实、智能的对话体验。

## 2. 快速开始 (Mac OS)

为了方便用户快速搭建环境，我们提供了一个自动化脚本。

1.  打开终端，进入项目根目录。
2.  运行脚本：
    ```bash
    ./scripts/setup_ollama_mac.sh
    ```
3.  脚本将自动：
    *   检查并安装 Ollama。
    *   配置 `OLLAMA_ORIGINS="*"` 解决跨域问题。
    *   启动 Ollama 服务。
    *   拉取默认的 `llama3` 模型。

## 3. 数据结构扩展 (`src/types/index.ts`)

为了区分静态语录角色和 AI 驱动的角色，我们需要扩展 `Character` 接口。

```typescript
/**
 * 角色类型定义
 * static: 传统的基于预设语录的角色
 * ollama: 基于本地 Ollama 模型的 AI 角色
 */
export type CharacterProvider = 'static' | 'ollama';

export interface Character {
  id: string;
  name: string;
  avatar: string;
  tag: string;
  personality: PersonalityType; // 保持原有字段，可能用于 UI 风格区分
  color: string;
  phrases: string[]; // static 模式下使用
  
  // 新增字段
  provider?: CharacterProvider; // 默认为 'static'
  
  // AI 角色配置
  modelConfig?: {
    model: string;             // Ollama 模型名称，例如: 'llama3', 'mistral', 'qwen2'
    apiEndpoint?: string;      // API 地址，默认为 'http://localhost:11434'
    temperature?: number;      // 随机性控制 (0-1)
    systemPrompt?: string;     // 系统提示词，用于设定角色人设
  };
}
```

## 4. 服务层 (`src/services/ollama.ts`)

新增 `OllamaService` 用于封装与本地 API 的通信。

### 4.1 接口定义
```typescript
interface ChatRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  stream?: boolean; // 暂时建议使用非流式，简化实现
  options?: {
    temperature?: number;
  };
}

interface ChatResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}
```

### 4.2 核心方法
*   `checkConnection(endpoint: string)`: 检测本地 Ollama 服务是否可用。
*   `chat(config: Character['modelConfig'], history: Message[])`: 发送对话请求。需要将应用内的 `Message` 格式转换为 Ollama 兼容的格式。

### 4.3 跨域问题 (CORS)
由于浏览器安全策略，Web 应用直接访问本地 `localhost:11434` 会遇到 CORS 限制。
**解决方案**: 用户启动 Ollama 时需要设置环境变量：
`OLLAMA_ORIGINS="*" ollama serve`
这一点需要在文档或 UI 提示中明确告知用户。

## 5. 聊天流程改造 (`src/pages/ChatRoom.tsx`)

当前的聊天室逻辑是基于 `setTimeout` 的同步模拟，需要改造为支持异步等待。

### 5.1 状态机调整
*   当前逻辑: `scheduleNextTurn` -> 随机语录 -> `addMessage` -> `scheduleNextTurn`
*   新逻辑:
    1.  `scheduleNextTurn` 触发。
    2.  确定下一个发言角色 (`nextSpeaker`)。
    3.  **判断角色类型**:
        *   **Static**: 维持原有逻辑，随机取语录。
        *   **Ollama**: 
            *   设置状态 `isThinking: true` (UI 上显示 "对方正在输入...")。
            *   调用 `OllamaService.chat()`。
            *   等待 Promise 返回。
            *   设置 `isThinking: false`。
    4.  `addMessage` (添加消息到列表)。
    5.  `scheduleNextTurn` (继续下一轮)。

### 5.2 错误处理
如果 Ollama 调用失败（例如服务未启动），应回退到 fallback 机制：
1.  显示系统提示：“无法连接到本地模型，请检查 Ollama 是否运行。”
2.  或者临时使用该角色的预设 `phrases` 作为兜底回复。

## 6. UI 变更
*   **创建/选择角色**: 暂时可以通过代码硬编码一个测试角色，后续可在创建页面添加“高级设置”来配置模型参数。
*   **聊天界面**: 当 AI 角色思考时，展示加载动画或输入状态指示器。

## 7. 测试计划
1.  修改 `src/data/characters.ts`，添加一个 `provider: 'ollama'` 的测试角色（例如 "Local AI"）。
2.  确保本地运行 Ollama (`ollama run llama3`) 并配置了 CORS。
3.  进入聊天室，验证该角色是否能根据上下文生成回复，而不是随机语录。

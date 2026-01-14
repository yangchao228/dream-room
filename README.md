# Dream Room 🌌

> **Assemble your personal AI think tank. Watch legends discuss the future.**

**Dream Room** is a single-page web application (MVP) that allows users to create a virtual roundtable of 2-3 "AI Idols" and watch them discuss a specific topic.

Experience what it's like to have **Elon Musk**, **Albert Einstein**, **Lu Xun**, and **Kobe Bryant** in the same room, debating the topics you care about.

![Dream Room Preview](./public/preview.png)

## 📖 Project Background

In an era of fragmented information, we often wonder: *What would great minds think about today's problems?*

**Dream Room** was born from this curiosity. It provides a lightweight, immersive environment where users can:
-   Select iconic figures with distinct personalities.
-   Input controversial or deep topics (e.g., "Will AI destroy humanity?").
-   Observe a simulated, personality-driven group chat.

This MVP demonstrates the core value of **multi-character personalized dialogue** without needing a complex backend, using frontend simulation to deliver a high-fidelity prototype experience.

## ✨ Core Features

-   **🧠 Assemble Your Think Tank**: Choose 2-3 characters from a roster of legends (Musk, Einstein, Lu Xun, Kobe).
-   **💬 Simulated Roundtable**: Watch characters discuss your chosen topic with personality-specific phrasing and viewpoints.
-   **🎭 Authentic Personalities**:
    -   **Musk**: Aggressive, first-principles thinking, obsessed with Mars and speed.
    -   **Einstein**: Philosophical, imaginative, constantly referencing physics and God.
    -   **Lu Xun**: Sharp, critical, deeply concerned with society and human nature.
    -   **Kobe**: Mamba Mentality, relentless, focused on hard work and greatness.
-   **🌍 Multi-language Support**: Seamlessly switch between **English** and **Chinese** (中文).
-   **⚡️ Instant Interaction**: Users can interrupt and join the chat at any time.
-   **📱 Modern UI**: Fully responsive design built with Tailwind CSS, featuring a clean, immersive dark/light aesthetic.

## 🛠 Tech Stack

-   **Framework**: [React 18](https://react.dev/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Routing**: [React Router v6](https://reactrouter.com/)
-   **Internationalization**: [i18next](https://www.i18next.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites

-   Node.js (v16 or higher)
-   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yangchao228/dream-room.git
    cd dream-room
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```

4.  **Open in browser**
    Visit `http://localhost:5173` to start your Dream Room experience!

## 🔮 Future Roadmap

-   [ ] **Real LLM Integration**: Connect to OpenAI/Anthropic APIs for real-time, dynamic intelligence.
-   [ ] **Custom Characters**: Allow users to upload avatars and define personalities.
-   [ ] **Voice Mode**: Text-to-Speech (TTS) for an audible roundtable experience.
-   [ ] **Shareable Rooms**: Generate links to share interesting debates with friends.

## 📄 License

This project is licensed under the MIT License.

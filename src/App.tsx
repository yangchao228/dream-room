import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { CreateTeam } from './pages/CreateTeam';
import { ChatRoom } from './pages/ChatRoom';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateTeam />} />
          <Route path="/chat/:teamId" element={<ChatRoom />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

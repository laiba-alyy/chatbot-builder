// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import{ AuthProvider}  from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewChatbot from './pages/NewChatbot';
import MyBot from './pages/MyBot';
import Conversations from './pages/Conversations';
import Analytics from './pages/Analytics';
import Training from './pages/Training';
// integrations page removed
import Team from './pages/Team';
import Settings from './pages/Settings';
import Billing from './pages/Billing';
// Bot editing is disabled for now
// import BotEditor from './pages/BotEditor';
// ChatbotSettings page is not currently accessible


function App() {
  return (
    <AuthProvider>
      <div className="neural-bg"></div>

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes — require login */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/new-chatbot" element={<ProtectedRoute><NewChatbot /></ProtectedRoute>} />
        <Route path="/my-bots" element={<ProtectedRoute><MyBot /></ProtectedRoute>} />
        <Route path="/conversations" element={<ProtectedRoute><Conversations /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/training" element={<ProtectedRoute><Training /></ProtectedRoute>} />
        {/* integrations route removed */}
        <Route path="/teams" element={<ProtectedRoute><Team /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        {/* dedicated billing page for plan selection */}
        <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
        {/* bot editor removed - feature not available */}
      </Routes>
    </AuthProvider>
  );
}

export default App;

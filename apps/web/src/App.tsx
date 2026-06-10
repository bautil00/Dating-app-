import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Matches from './pages/Matches';
import Messages from './pages/Messages';
import Chat from './pages/Chat';

function AppLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
        <p className="text-sm font-medium text-gray-500">Warming up your matches...</p>
      </div>
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) return <AppLoading />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/discover" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/discover" /> : <Register />} />
        <Route path="/" element={<Navigate to={user ? '/discover' : '/register'} />} />
        <Route path="/discover" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/matches" element={user ? <Matches /> : <Navigate to="/login" />} />
        <Route path="/sparks" element={user ? <Matches /> : <Navigate to="/login" />} />
        <Route path="/messages" element={user ? <Messages /> : <Navigate to="/login" />} />
        <Route path="/chat/:userId" element={user ? <Chat /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={user ? '/discover' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

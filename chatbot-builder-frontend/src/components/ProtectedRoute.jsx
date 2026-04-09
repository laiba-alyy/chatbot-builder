// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import  useAuth  from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Still checking token on first load — show nothing
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0a0a0f',
        color: '#40e0d0',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  // Not logged in — redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

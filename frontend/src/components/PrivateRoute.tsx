import React, { ReactNode } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, login, register } = useAuth();
  const [showRegister, setShowRegister] = React.useState(false);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress sx={{ color: '#40b87c' }} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return showRegister ? (
      <RegisterForm
        onRegister={register}
        onLoginClick={() => setShowRegister(false)}
      />
    ) : (
      <LoginForm
        onLogin={login}
        onRegisterClick={() => setShowRegister(true)}
      />
    );
  }

  return <>{children}</>;
};

export default PrivateRoute;
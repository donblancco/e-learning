import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Box, Button, Menu, MenuItem, Divider, IconButton, useMediaQuery, useTheme } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import QuizIcon from '@mui/icons-material/Quiz';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import QuizApp from './components/QuizApp';
import ProgressManagement from './components/ProgressManagement';
import AdminPanel from './components/admin/AdminPanel';
import AccountSettings from './components/AccountSettings';

const theme = createTheme({
  palette: {
    primary: {
      main: '#40b87c',
    },
    secondary: {
      main: '#27313b',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Noto Sans JP", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const AppHeader: React.FC<{ currentView: string; onViewChange: (view: string) => void }> = ({ currentView, onViewChange }) => {
  const { user, logout, isAdmin } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = React.useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleLogout = async () => {
    await logout();
    handleClose();
  };

  const handleNavigation = (view: string) => {
    onViewChange(view);
    handleMobileMenuClose();
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#27313b' }}>
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
        {/* タイトル - モバイルでは短縮版 */}
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            color: 'white', 
            mr: { xs: 1, sm: 4 },
            fontSize: { xs: '1rem', sm: '1.25rem' },
            flexShrink: 0
          }}
        >
          {isMobile ? 'E-learning' : 'E-learning System - 学習管理システム'}
        </Typography>
        
        {user && !isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <Button
              color="inherit"
              startIcon={<QuizIcon />}
              onClick={() => onViewChange('quiz')}
              sx={{
                color: currentView === 'quiz' ? '#40b87c' : 'white',
                backgroundColor: currentView === 'quiz' ? 'rgba(64, 184, 124, 0.1)' : 'transparent',
                textTransform: 'none',
              }}
            >
              クイズ
            </Button>
            <Button
              color="inherit"
              startIcon={<TrendingUpIcon />}
              onClick={() => onViewChange('progress')}
              sx={{
                color: currentView === 'progress' ? '#40b87c' : 'white',
                backgroundColor: currentView === 'progress' ? 'rgba(64, 184, 124, 0.1)' : 'transparent',
                textTransform: 'none',
              }}
            >
              学習進捗
            </Button>
            {isAdmin() && (
              <Button
                color="inherit"
                startIcon={<AdminPanelSettingsIcon />}
                onClick={() => onViewChange('admin')}
                sx={{
                  color: currentView === 'admin' ? '#40b87c' : 'white',
                  backgroundColor: currentView === 'admin' ? 'rgba(64, 184, 124, 0.1)' : 'transparent',
                  textTransform: 'none',
                }}
              >
                管理者パネル
              </Button>
            )}
          </Box>
        )}

        {/* モバイル用ハンバーガーメニュー */}
        {user && isMobile && (
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end', mr: 1 }}>
            <IconButton
              size="large"
              aria-label="navigation menu"
              aria-controls="mobile-menu"
              aria-haspopup="true"
              onClick={handleMobileMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="mobile-menu"
              anchorEl={mobileMenuAnchor}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(mobileMenuAnchor)}
              onClose={handleMobileMenuClose}
            >
              <MenuItem 
                onClick={() => handleNavigation('quiz')}
                sx={{ 
                  backgroundColor: currentView === 'quiz' ? 'rgba(64, 184, 124, 0.1)' : 'transparent',
                  color: currentView === 'quiz' ? '#40b87c' : 'inherit'
                }}
              >
                <QuizIcon sx={{ mr: 2 }} />
                クイズ
              </MenuItem>
              <MenuItem 
                onClick={() => handleNavigation('progress')}
                sx={{ 
                  backgroundColor: currentView === 'progress' ? 'rgba(64, 184, 124, 0.1)' : 'transparent',
                  color: currentView === 'progress' ? '#40b87c' : 'inherit'
                }}
              >
                <TrendingUpIcon sx={{ mr: 2 }} />
                学習進捗
              </MenuItem>
              {isAdmin() && (
                <MenuItem 
                  onClick={() => handleNavigation('admin')}
                  sx={{ 
                    backgroundColor: currentView === 'admin' ? 'rgba(64, 184, 124, 0.1)' : 'transparent',
                    color: currentView === 'admin' ? '#40b87c' : 'inherit'
                  }}
                >
                  <AdminPanelSettingsIcon sx={{ mr: 2 }} />
                  管理者パネル
                </MenuItem>
              )}
            </Menu>
          </Box>
        )}
        
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography 
              variant="body2" 
              sx={{ 
                display: { xs: 'none', lg: 'block' }, 
                color: 'white',
                mr: 2
              }}
            >
              ようこそ、{user.username}さん
            </Typography>
            
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="account-menu"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
              sx={{ 
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <AccountCircleIcon />
            </IconButton>
            
            <Menu
              id="account-menu"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {user.username}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {user.email}
                  </Typography>
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleClose(); onViewChange('account'); }}>
                <SettingsIcon sx={{ mr: 1 }} fontSize="small" />
                アカウント設定
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
                ログアウト
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = React.useState('quiz');

  const renderContent = () => {
    switch (currentView) {
      case 'progress':
        return <ProgressManagement />;
      case 'admin':
        return <AdminPanel onBack={() => setCurrentView('quiz')} />;
      case 'account':
        return <AccountSettings />;
      case 'quiz':
      default:
        return <QuizApp />;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppHeader currentView={currentView} onViewChange={setCurrentView} />
      
      <Box component="main" sx={{ flexGrow: 1, backgroundColor: '#f5f5f5' }}>
        <PrivateRoute>
          {renderContent()}
        </PrivateRoute>
      </Box>
      
      <Box
        component="footer"
        sx={{
          py: 2,
          px: 2,
          mt: 'auto',
          backgroundColor: '#27313b',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2">
          © 2025 E-learning System. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
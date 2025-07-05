import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import QuizIcon from '@mui/icons-material/Quiz';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AdminDashboard from './AdminDashboard';
import QuestionManagement from './QuestionManagement';
import UserManagement from './UserManagement';
import GenreManagement from './GenreManagement';

interface AdminPanelProps {
  onBack: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 0:
        return <AdminDashboard />;
      case 1:
        return <QuestionManagement />;
      case 2:
        return <UserManagement />;
      case 3:
        return <GenreManagement />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <AppBar position="static" sx={{ backgroundColor: '#27313b' }}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <Button
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ 
              mr: { xs: 1, sm: 2 },
              minWidth: { xs: 'auto', sm: '80px' },
              px: { xs: 1, sm: 2 },
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
              borderRadius: 1,
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            戻る
          </Button>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              color: 'white',
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            管理者パネル
          </Typography>
        </Toolbar>
      </AppBar>

      {/* タブナビゲーション */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: 'white' }}>
        <Container maxWidth="xl">
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons={isMobile ? "auto" : false}
            allowScrollButtonsMobile={isMobile}
          >
            <Tab
              icon={<DashboardIcon />}
              label={isMobile ? "ダッシュ" : "ダッシュボード"}
              sx={{ 
                textTransform: 'none',
                minWidth: { xs: 80, sm: 120 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            />
            <Tab
              icon={<QuizIcon />}
              label={isMobile ? "問題" : "問題管理"}
              sx={{ 
                textTransform: 'none',
                minWidth: { xs: 80, sm: 120 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            />
            <Tab
              icon={<PeopleIcon />}
              label={isMobile ? "ユーザー" : "ユーザー管理"}
              sx={{ 
                textTransform: 'none',
                minWidth: { xs: 80, sm: 120 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            />
            <Tab
              icon={<CategoryIcon />}
              label={isMobile ? "ジャンル" : "ジャンル管理"}
              sx={{ 
                textTransform: 'none',
                minWidth: { xs: 80, sm: 120 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            />
          </Tabs>
        </Container>
      </Box>

      {/* メインコンテンツ */}
      <Box component="main" sx={{ flexGrow: 1, backgroundColor: '#f5f5f5', pb: 4 }}>
        {renderTabContent()}
      </Box>
    </Box>
  );
};

export default AdminPanel;
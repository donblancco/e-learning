import React, { useState } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HistoryIcon from '@mui/icons-material/History';
import StudyDashboard from './StudyDashboard';
import StudyHistory from './StudyHistory';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`progress-tabpanel-${index}`}
      aria-labelledby={`progress-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `progress-tab-${index}`,
    'aria-controls': `progress-tabpanel-${index}`,
  };
}

const ProgressManagement: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box mt={4}>
        <Typography variant="h4" component="h1" gutterBottom color="#27313b">
          学習進捗管理
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={value} 
            onChange={handleChange} 
            aria-label="progress management tabs"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                minWidth: 120,
                fontWeight: 600,
              },
              '& .Mui-selected': {
                color: '#40b87c !important',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#40b87c',
              },
            }}
          >
            <Tab 
              icon={<DashboardIcon />} 
              label="ダッシュボード" 
              {...a11yProps(0)} 
              sx={{ color: '#27313b' }}
            />
            <Tab 
              icon={<HistoryIcon />} 
              label="学習履歴" 
              {...a11yProps(1)} 
              sx={{ color: '#27313b' }}
            />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <StudyDashboard />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <StudyHistory />
        </TabPanel>
      </Box>
    </Container>
  );
};

export default ProgressManagement;
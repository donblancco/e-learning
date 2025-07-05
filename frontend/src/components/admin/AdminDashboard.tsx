import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Container,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import QuizIcon from '@mui/icons-material/Quiz';
import CategoryIcon from '@mui/icons-material/Category';
import { adminService } from '../../services/admin';

interface AdminStats {
  total_users: number;
  active_users: number;
  total_questions: number;
  active_questions: number;
  total_genres: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || '統計データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: '#40b87c' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box mt={4}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  if (!stats) {
    return (
      <Container maxWidth="lg">
        <Box mt={4}>
          <Alert severity="info">統計データがありません</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box mt={4}>
        <Typography variant="h4" component="h1" gutterBottom color="#27313b">
          管理者ダッシュボード
        </Typography>

        <Grid container spacing={3} mb={4}>
          {/* 総ユーザー数 */}
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <PeopleIcon sx={{ color: '#40b87c', fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div" color="#27313b">
                      {stats.total_users}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      総ユーザー数
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* アクティブユーザー数 */}
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <PeopleIcon sx={{ color: '#2196f3', fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div" color="#27313b">
                      {stats.active_users}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      アクティブユーザー
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* 総問題数 */}
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <QuizIcon sx={{ color: '#9c27b0', fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div" color="#27313b">
                      {stats.total_questions}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      総問題数
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* アクティブ問題数 */}
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <QuizIcon sx={{ color: '#4caf50', fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div" color="#27313b">
                      {stats.active_questions}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      アクティブ問題数
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* 総ジャンル数 */}
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <CategoryIcon sx={{ color: '#f44336', fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div" color="#27313b">
                      {stats.total_genres}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      総ジャンル数
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* システム情報 */}
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="#27313b">
                  システム情報
                </Typography>
                <Typography variant="body2" color="textSecondary" mb={1}>
                  最終更新: {new Date().toLocaleDateString('ja-JP')}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  問題有効率: {Math.round((stats.active_questions / stats.total_questions) * 100)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default AdminDashboard;
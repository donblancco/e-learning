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
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import QuizIcon from '@mui/icons-material/Quiz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TimerIcon from '@mui/icons-material/Timer';
import { 
  StudyStatistics, 
  GenrePerformance, 
  WeeklyProgress, 
  DailyActivity 
} from '../types';
import { progressService } from '../services/progress';

const StudyDashboard: React.FC = () => {
  const [statistics, setStatistics] = useState<StudyStatistics | null>(null);
  const [genrePerformance, setGenrePerformance] = useState<GenrePerformance[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [stats, genrePerf, weeklyProg, dailyAct] = await Promise.all([
        progressService.getStudyStatistics(),
        progressService.getGenrePerformance(),
        progressService.getWeeklyProgress(),
        progressService.getDailyActivity(),
      ]);

      setStatistics(stats);
      setGenrePerformance(genrePerf);
      setWeeklyProgress(weeklyProg);
      setDailyActivity(dailyAct);
    } catch (err: any) {
      setError(err.message || 'ダッシュボードデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}時間${mins}分`;
    }
    return `${mins}分`;
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return '#40b87c';
    if (accuracy >= 60) return '#ff9800';
    return '#f44336';
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

  if (!statistics) {
    return (
      <Container maxWidth="lg">
        <Box mt={4}>
          <Alert severity="info">学習データがありません。クイズに挑戦して学習記録を作成しましょう！</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box mt={4}>
        <Typography variant="h4" component="h1" gutterBottom color="#27313b">
          学習ダッシュボード
        </Typography>

        {/* 統計サマリーカード */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <QuizIcon sx={{ color: '#40b87c', fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div" color="#27313b">
                      {statistics.total_sessions}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      総セッション数
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <CheckCircleIcon sx={{ color: '#40b87c', fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div" color="#27313b">
                      {statistics.accuracy_rate}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      正答率
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <TrendingUpIcon sx={{ color: '#40b87c', fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div" color="#27313b">
                      {statistics.total_questions}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      総問題数
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <TimerIcon sx={{ color: '#40b87c', fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div" color="#27313b">
                      {formatTime(statistics.total_study_time)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      総学習時間
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* 日別進捗グラフ */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="#27313b">
                  日別学習進捗（過去14日）
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyActivity.slice(-14)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value: any) => new Date(value).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value: any) => `日付: ${new Date(value).toLocaleDateString('ja-JP')}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="study_time" 
                      stroke="#40b87c" 
                      strokeWidth={2}
                      name="学習時間(分)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sessions_count" 
                      stroke="#ff9800" 
                      strokeWidth={2}
                      name="セッション数"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* 最近の成績 */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="#27313b">
                  最近の学習記録
                </Typography>
                <List dense>
                  {statistics.recent_sessions.slice(0, 5).map((session, index) => (
                    <ListItem key={session.id} divider={index < 4}>
                      <ListItemText
                        primary={session.genre_name || 'ランダム'}
                        secondary={`${session.score_percentage}% - ${new Date(session.start_time).toLocaleDateString('ja-JP')}`}
                      />
                      <Chip
                        size="small"
                        label={`${session.score_percentage}%`}
                        sx={{
                          backgroundColor: getAccuracyColor(session.score_percentage),
                          color: 'white',
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* ジャンル別パフォーマンス */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="#27313b">
                  ジャンル別正答率
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={genrePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="genre.name" 
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="accuracy_rate" fill="#40b87c" name="正答率(%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>


          {/* ジャンル別学習進捗 */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="#27313b">
                  ジャンル別学習進捗
                </Typography>
                <Grid container spacing={2}>
                  {statistics.genre_performance.map((progress) => (
                    <Grid item xs={12} sm={6} md={4} key={progress.genre.id}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {progress.genre.name}
                        </Typography>
                        <Box mb={1}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2">正答率</Typography>
                            <Typography variant="body2">{progress.accuracy_rate}%</Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={progress.accuracy_rate}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getAccuracyColor(progress.accuracy_rate),
                              },
                            }}
                          />
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                          {progress.correct_attempts} / {progress.total_attempts} 問正解
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default StudyDashboard;
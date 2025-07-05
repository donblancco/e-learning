import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Container,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { QuizSession, Genre, ProgressFilter } from '../types';
import { progressService } from '../services/progress';
import { api } from '../services/api';

const StudyHistory: React.FC = () => {
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ProgressFilter>({});

  useEffect(() => {
    loadData();
  }, [filter]);

  useEffect(() => {
    loadGenres();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await progressService.getQuizSessions(filter);
      setSessions(data);
    } catch (err: any) {
      setError(err.message || '学習履歴の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadGenres = async () => {
    try {
      const data = await api.getGenres();
      setGenres(data);
    } catch (err) {
      console.error('Error loading genres:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return '#40b87c';
    if (percentage >= 60) return '#ff9800';
    return '#f44336';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: '#40b87c' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box mt={4}>
        <Typography variant="h4" component="h1" gutterBottom color="#27313b">
          学習履歴
        </Typography>

        {/* フィルター */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              フィルター
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>ジャンル</InputLabel>
                  <Select
                    value={filter.genre || ''}
                    onChange={(e) => setFilter({ ...filter, genre: e.target.value || undefined })}
                    label="ジャンル"
                  >
                    <MenuItem value="">すべて</MenuItem>
                    {genres.map((genre) => (
                      <MenuItem key={genre.id} value={genre.id}>
                        {genre.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="開始日"
                  type="date"
                  value={filter.date_from || ''}
                  onChange={(e) => 
                    setFilter({ 
                      ...filter, 
                      date_from: e.target.value || undefined 
                    })
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="終了日"
                  type="date"
                  value={filter.date_to || ''}
                  onChange={(e) => 
                    setFilter({ 
                      ...filter, 
                      date_to: e.target.value || undefined 
                    })
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="表示件数"
                  type="number"
                  value={filter.limit || ''}
                  onChange={(e) => 
                    setFilter({ 
                      ...filter, 
                      limit: e.target.value ? parseInt(e.target.value) : undefined 
                    })
                  }
                  inputProps={{ min: 1, max: 100 }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 学習履歴リスト */}
        {sessions.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" color="textSecondary" align="center">
                学習履歴がありません
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {sessions.map((session) => (
              <Grid item xs={12} md={6} lg={4} key={session.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" color="#27313b">
                        {session.genre_name || 'ランダム'}
                      </Typography>
                      <Chip
                        label={`${session.score_percentage}%`}
                        sx={{
                          backgroundColor: getScoreColor(session.score_percentage),
                          color: 'white',
                        }}
                      />
                    </Box>

                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <CheckCircleIcon sx={{ color: '#40b87c', fontSize: 20 }} />
                      <Typography variant="body2">
                        正解: {session.correct_answers} / {session.total_questions}
                      </Typography>
                    </Box>

                    <Typography variant="body2" color="textSecondary" mb={1}>
                      実施日: {formatDate(session.start_time)}
                    </Typography>

                    {session.duration_minutes && (
                      <Typography variant="body2" color="textSecondary" mb={1}>
                        所要時間: {session.duration_minutes}分
                      </Typography>
                    )}

                    <Typography variant="body2" color="textSecondary">
                      種類: {session.session_type === 'genre' ? 'ジャンル別' : 'ランダム'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default StudyHistory;
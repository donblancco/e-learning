import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Container,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Genre } from '../types';
import { api } from '../services/api';

interface GenreSelectorProps {
  onGenreSelect: (genre: Genre, difficulty?: number | string) => void;
  onIncorrectReview: () => void;
  onRandomQuiz: () => void;
}

const GenreSelector: React.FC<GenreSelectorProps> = ({ onGenreSelect, onIncorrectReview, onRandomQuiz }) => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setLoading(true);
        const data = await api.getGenres();
        setGenres(data);
        setError(null);
      } catch (err) {
        setError('ジャンルの取得に失敗しました。もう一度お試しください。');
        console.error('Error loading genres:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box mt={4}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box mt={4} mb={4}>
        <Typography variant="h3" component="h1" gutterBottom align="center" color="#27313b">
          ジャンルを選択してください
        </Typography>
        <Typography variant="body1" align="center" color="textSecondary" mb={4}>
          クイズに挑戦したいジャンルを選んでください
        </Typography>

        {/* 特別なクイズオプション */}
        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="center" gap={2} mb={4}>
          <Button
            variant="contained"
            size="large"
            onClick={onRandomQuiz}
            sx={{
              backgroundColor: '#2196f3',
              color: 'white',
              '&:hover': {
                backgroundColor: '#1976d2',
              },
              px: 4,
              py: 1.5,
              minWidth: { xs: '100%', sm: '200px' },
            }}
          >
            🎲 全問題から30問ランダム
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={onIncorrectReview}
            sx={{
              borderColor: '#ff9800',
              color: '#ff9800',
              '&:hover': {
                borderColor: '#f57c00',
                backgroundColor: 'rgba(255, 152, 0, 0.04)',
              },
              px: 4,
              py: 1.5,
              minWidth: { xs: '100%', sm: '200px' },
            }}
          >
            🔄 間違った問題を復習する
          </Button>
        </Box>

        <Grid container spacing={3}>
          {genres.map((genre) => (
            <Grid item xs={12} sm={6} md={4} key={genre.id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom color="#27313b">
                    {genre.name}
                  </Typography>
                  {genre.description && (
                    <Typography variant="body2" color="textSecondary" mb={2}>
                      {genre.description}
                    </Typography>
                  )}
                  {genre.question_count !== undefined && (
                    <Typography variant="body2" color="textSecondary" mb={2}>
                      問題数: {genre.question_count}問
                    </Typography>
                  )}
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => onGenreSelect(genre, 1)}
                      sx={{
                        borderColor: '#4caf50',
                        color: '#4caf50',
                        '&:hover': {
                          borderColor: '#388e3c',
                          backgroundColor: 'rgba(76, 175, 80, 0.04)',
                        },
                      }}
                    >
                      初級
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => onGenreSelect(genre, 'intermediate-advanced')}
                      sx={{
                        borderColor: '#ff9800',
                        color: '#ff9800',
                        '&:hover': {
                          borderColor: '#f57c00',
                          backgroundColor: 'rgba(255, 152, 0, 0.04)',
                        },
                      }}
                    >
                      中級・上級
                    </Button>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => onGenreSelect(genre)}
                      sx={{
                        backgroundColor: '#40b87c',
                        '&:hover': {
                          backgroundColor: '#359c68',
                        },
                      }}
                    >
                      ランダム
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default GenreSelector;
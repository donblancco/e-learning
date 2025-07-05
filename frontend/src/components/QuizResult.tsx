import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Container,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { Answer, Question } from '../types';

interface QuizResultProps {
  answers: Answer[];
  questions: Question[];
  onRestart: () => void;
  onSelectNewGenre: () => void;
  onRandomQuiz?: () => void;
}

const QuizResult: React.FC<QuizResultProps> = ({
  answers,
  questions,
  onRestart,
  onSelectNewGenre,
  onRandomQuiz,
}) => {
  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const incorrectCount = answers.filter((answer) => !answer.isCorrect).length;
  const totalCount = answers.length;
  const percentage = Math.round((correctCount / totalCount) * 100);

  const getResultMessage = () => {
    if (percentage >= 80) return '素晴らしい成績です！';
    if (percentage >= 60) return 'よくできました！';
    if (percentage >= 40) return 'もう少し頑張りましょう！';
    return '次回はもっと頑張りましょう！';
  };

  const getResultColor = () => {
    if (percentage >= 80) return '#40b87c';
    if (percentage >= 60) return '#ff9800';
    return '#f44336';
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty === 1) return '#4caf50'; // 緑 (初級)
    if (difficulty === 2) return '#ff9800'; // オレンジ (中級)
    return '#f44336'; // 赤 (上級)
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty === 1) return '初級';
    if (difficulty === 2) return '中級';
    return '上級';
  };

  return (
    <Container maxWidth="md">
      <Box mt={4}>
        <Card>
          <CardContent>
            <Typography variant="h4" component="h1" gutterBottom align="center" color="#27313b">
              クイズ結果
            </Typography>

            <Box textAlign="center" my={4}>
              <Typography
                variant="h2"
                component="div"
                sx={{ color: getResultColor(), fontWeight: 'bold' }}
              >
                {percentage}%
              </Typography>
              <Typography variant="h6" color="textSecondary">
                {correctCount} / {totalCount} 問正解
              </Typography>
              <Typography variant="h5" mt={2} color="#27313b">
                {getResultMessage()}
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom color="#27313b">
              解答詳細
            </Typography>

            <List>
              {answers.map((answer, index) => {
                const question = questions.find((q) => q.id === answer.questionId);
                if (!question) return null;

                return (
                  <ListItem key={answer.questionId}>
                    <ListItemIcon>
                      {answer.isCorrect ? (
                        <CheckCircleIcon sx={{ color: '#40b87c' }} />
                      ) : (
                        <CancelIcon sx={{ color: '#f44336' }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body1">
                            問題{index + 1}: {question.title.substring(0, 50)}...
                          </Typography>
                          <Chip
                            label={getDifficultyLabel(question.difficulty)}
                            size="small"
                            sx={{ 
                              backgroundColor: getDifficultyColor(question.difficulty),
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.75rem'
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        answer.isCorrect
                          ? '正解'
                          : `不正解 (あなたの解答: ${answer.selectedAnswer.substring(0, 30)}...)`
                      }
                    />
                    {!answer.isCorrect && onRandomQuiz && (
                      <Box ml={2}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={onRandomQuiz}
                          sx={{
                            borderColor: '#2196f3',
                            color: '#2196f3',
                            fontSize: '0.75rem',
                            '&:hover': {
                              borderColor: '#1976d2',
                              backgroundColor: 'rgba(33, 150, 243, 0.04)',
                            },
                          }}
                        >
                          🎲 ランダム30問
                        </Button>
                      </Box>
                    )}
                  </ListItem>
                );
              })}
            </List>

            <Box mt={4} display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
              <Button
                variant="contained"
                fullWidth
                onClick={onRestart}
                sx={{
                  backgroundColor: '#40b87c',
                  '&:hover': {
                    backgroundColor: '#359c68',
                  },
                }}
              >
                同じジャンルでもう一度
              </Button>
              {incorrectCount > 0 && onRandomQuiz && (
                <Button
                  variant="contained"
                  fullWidth
                  onClick={onRandomQuiz}
                  sx={{
                    backgroundColor: '#2196f3',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#1976d2',
                    },
                  }}
                >
                  🎲 全問題から30問ランダム
                </Button>
              )}
              <Button
                variant="outlined"
                fullWidth
                onClick={onSelectNewGenre}
                sx={{
                  borderColor: '#40b87c',
                  color: '#40b87c',
                  '&:hover': {
                    borderColor: '#359c68',
                    backgroundColor: 'rgba(64, 184, 124, 0.1)',
                  },
                }}
              >
                別のジャンルを選ぶ
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default QuizResult;
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Container,
  Chip,
  Alert,
  Collapse,
  LinearProgress,
  Checkbox,
  FormGroup,
} from '@mui/material';
import DOMPurify from 'dompurify';
import { Question, Answer } from '../types';

interface QuizQuestionProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  onAnswer: (answer: Answer) => void;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  currentIndex,
  totalQuestions,
  onAnswer,
}) => {
  const [selectedChoiceIds, setSelectedChoiceIds] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<Answer | null>(null);

  const handleAnswerChange = (choiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedChoiceIds(prev => [...prev, choiceId]);
    } else {
      setSelectedChoiceIds(prev => prev.filter(id => id !== choiceId));
    }
  };

  const handleSubmit = () => {
    if (selectedChoiceIds.length === 0) return;

    const selectedChoices = question.choices.filter(c => selectedChoiceIds.includes(c.id));
    const correctChoices = question.choices.filter(c => c.is_correct);
    
    // Check if all correct answers are selected and no incorrect answers are selected
    const correct = correctChoices.every(c => selectedChoiceIds.includes(c.id)) && 
                   selectedChoiceIds.every(id => correctChoices.some(c => c.id === id));
    
    setIsCorrect(correct);
    setShowResult(true);

    const answer: Answer = {
      questionId: question.id,
      selectedAnswer: selectedChoices.map(c => c.content).join(', '),
      selectedChoiceId: selectedChoiceIds.join(','), // Store multiple IDs separated by comma
      isCorrect: correct,
    };

    setCurrentAnswer(answer);
  };

  const handleNext = () => {
    if (currentAnswer) {
      onAnswer(currentAnswer);
      setSelectedChoiceIds([]);
      setShowResult(false);
      setCurrentAnswer(null);
    }
  };

  const progress = ((currentIndex + 1) / totalQuestions) * 100;

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
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" color="#27313b">
              問題 {currentIndex + 1} / {totalQuestions}
            </Typography>
            <Box display="flex" gap={1}>
              <Chip
                label={getDifficultyLabel(question.difficulty)}
                sx={{ 
                  backgroundColor: getDifficultyColor(question.difficulty),
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
              <Chip
                label={`進捗: ${Math.round(progress)}%`}
                color="primary"
                sx={{ backgroundColor: '#40b87c' }}
              />
            </Box>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#40b87c',
              },
            }}
          />
        </Box>

        <Card>
          <CardContent>
            <Typography 
              variant="body2" 
              color="textSecondary" 
              mb={1}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.title) }}
            />
            {question.body && (
              <Typography 
                variant="h5" 
                component="h2" 
                gutterBottom 
                color="#27313b"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.body) }}
              />
            )}

            <FormGroup>
              {question.choices
                .filter((choice) => choice.content && choice.content.trim() !== '')
                .sort((a, b) => a.order_index - b.order_index)
                .map((choice) => {
                  return (
                    <FormControlLabel
                      key={choice.id}
                      control={
                        <Checkbox
                          checked={selectedChoiceIds.includes(choice.id)}
                          onChange={(e) => handleAnswerChange(choice.id, e.target.checked)}
                          sx={{ '&.Mui-checked': { color: '#40b87c' } }}
                          disabled={showResult}
                        />
                      }
                      label={
                        <Typography
                          variant="body1"
                          sx={{
                            color: showResult
                              ? choice.is_correct
                                ? '#40b87c'
                                : selectedChoiceIds.includes(choice.id)
                                ? '#f44336'
                                : 'inherit'
                              : 'inherit',
                            fontWeight: showResult && choice.is_correct ? 'bold' : 'normal',
                          }}
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(choice.content) }}
                        />
                      }
                    />
                  );
                })}
            </FormGroup>

            <Box mt={3}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleSubmit}
                disabled={selectedChoiceIds.length === 0 || showResult}
                sx={{
                  backgroundColor: '#40b87c',
                  '&:hover': {
                    backgroundColor: '#359c68',
                  },
                  '&:disabled': {
                    backgroundColor: '#cccccc',
                  },
                }}
              >
                解答する
              </Button>
            </Box>

            <Collapse in={showResult}>
              <Box mt={3}>
                <Alert severity={isCorrect ? 'success' : 'error'}>
                  {isCorrect ? '正解です！' : '不正解です。'}
                </Alert>
                <Box mt={2}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>正解:</strong>{' '}
                    <span 
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(question.choices.filter(c => c.is_correct).map(c => c.content).join(', ')) 
                      }} 
                    />
                  </Typography>
                  {question.clarification && (
                    <Typography 
                      variant="body2" 
                      color="textSecondary" 
                      mt={1}
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(question.clarification.replace(/\\n/g, '<br />')) 
                      }}
                    />
                  )}
                </Box>
                <Box mt={3}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleNext}
                    sx={{
                      backgroundColor: '#2196F3',
                      '&:hover': {
                        backgroundColor: '#1976D2',
                      },
                    }}
                  >
                    次の問題へ
                  </Button>
                </Box>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default QuizQuestion;
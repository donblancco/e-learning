import React, { useState } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Container,
  Link,
} from '@mui/material';
import { RegisterCredentials } from '../types';

interface RegisterFormProps {
  onRegister: (credentials: RegisterCredentials) => Promise<void>;
  onLoginClick: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onLoginClick }) => {
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    email: '',
    username: '',
    password: '',
    password_confirm: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.email || !credentials.username || !credentials.password || !credentials.password_confirm) {
      setError('すべての項目を入力してください');
      return;
    }

    if (credentials.password !== credentials.password_confirm) {
      setError('パスワードが一致しません');
      return;
    }

    if (credentials.password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onRegister(credentials);
    } catch (err: any) {
      setError(err.message || '登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box mt={8}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center" color="#27313b">
              新規登録
            </Typography>
            
            <Typography variant="body1" align="center" color="textSecondary" mb={4}>
              アカウントを作成してクイズを始めよう
            </Typography>

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="メールアドレス"
                name="email"
                type="email"
                value={credentials.email}
                onChange={handleChange}
                margin="normal"
                required
                autoFocus
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#40b87c',
                    },
                  },
                  '& label.Mui-focused': {
                    color: '#40b87c',
                  },
                }}
              />

              <TextField
                fullWidth
                label="ユーザー名"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#40b87c',
                    },
                  },
                  '& label.Mui-focused': {
                    color: '#40b87c',
                  },
                }}
              />
              
              <TextField
                fullWidth
                label="パスワード"
                name="password"
                type="password"
                value={credentials.password}
                onChange={handleChange}
                margin="normal"
                required
                helperText="8文字以上で、一般的でないパスワードを設定してください"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#40b87c',
                    },
                  },
                  '& label.Mui-focused': {
                    color: '#40b87c',
                  },
                }}
              />

              <TextField
                fullWidth
                label="パスワード確認"
                name="password_confirm"
                type="password"
                value={credentials.password_confirm}
                onChange={handleChange}
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#40b87c',
                    },
                  },
                  '& label.Mui-focused': {
                    color: '#40b87c',
                  },
                }}
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  backgroundColor: '#40b87c',
                  '&:hover': {
                    backgroundColor: '#359c68',
                  },
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : '登録'}
              </Button>

              <Box textAlign="center">
                <Typography variant="body2" color="textSecondary">
                  すでにアカウントをお持ちの方は{' '}
                  <Link
                    component="button"
                    variant="body2"
                    onClick={(e) => {
                      e.preventDefault();
                      onLoginClick();
                    }}
                    sx={{
                      color: '#40b87c',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    ログイン
                  </Link>
                </Typography>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default RegisterForm;
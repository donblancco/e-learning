import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Container,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
  Avatar,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth';

const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // プロフィール編集フォーム
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
  });

  // パスワード変更フォーム
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const handleProfileSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`${authService.getApiBaseUrl()}/api/auth/profile/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getAccessToken()}`,
        },
        body: JSON.stringify({
          username: profileForm.username,
          email: profileForm.email,
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (typeof errorData === 'object') {
          const fieldErrors = Object.entries(errorData)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          throw new Error(fieldErrors || 'プロフィールの更新に失敗しました');
        }
        throw new Error('プロフィールの更新に失敗しました');
      }

      setSuccess('プロフィールが正常に更新されました');
      
      // AuthContextを更新するため、ユーザー情報を再取得
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || 'プロフィールの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (passwordForm.new_password !== passwordForm.confirm_password) {
        throw new Error('新しいパスワードが一致しません');
      }

      if (passwordForm.new_password.length < 8) {
        throw new Error('パスワードは8文字以上で入力してください');
      }

      const response = await fetch(`${authService.getApiBaseUrl()}/api/auth/change-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getAccessToken()}`,
        },
        body: JSON.stringify({
          old_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'パスワードの変更に失敗しました');
      }

      setSuccess('パスワードが正常に変更されました');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      
    } catch (err: any) {
      setError(err.message || 'パスワードの変更に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="md">
        <Box mt={4}>
          <Alert severity="error">ユーザー情報を取得できませんでした</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box mt={4}>
        <Typography variant="h4" component="h1" gutterBottom color="#27313b">
          アカウント設定
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* プロフィール情報 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Avatar sx={{ width: 64, height: 64, backgroundColor: '#40b87c' }}>
                <PersonIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h6">{user.username}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {user.email}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  登録日: {new Date(user.date_joined).toLocaleDateString('ja-JP')}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="h6" gutterBottom>
              プロフィール編集
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ユーザー名"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                  margin="normal"
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="メールアドレス"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  margin="normal"
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="姓"
                  value={profileForm.last_name}
                  onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="名"
                  value={profileForm.first_name}
                  onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                  margin="normal"
                />
              </Grid>
            </Grid>

            <Box mt={3}>
              <Button
                variant="contained"
                onClick={handleProfileSave}
                disabled={loading}
                sx={{ backgroundColor: '#40b87c', '&:hover': { backgroundColor: '#359c68' } }}
              >
                プロフィールを更新
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* パスワード変更 */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              パスワード変更
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="現在のパスワード"
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="新しいパスワード"
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  margin="normal"
                  helperText="8文字以上で入力してください"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="新しいパスワード（確認）"
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  margin="normal"
                />
              </Grid>
            </Grid>

            <Box mt={3}>
              <Button
                variant="outlined"
                onClick={handlePasswordChange}
                disabled={loading || !passwordForm.current_password || !passwordForm.new_password}
                sx={{ 
                  borderColor: '#ff9800', 
                  color: '#ff9800',
                  '&:hover': { borderColor: '#f57c00', backgroundColor: 'rgba(255, 152, 0, 0.04)' }
                }}
              >
                パスワードを変更
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default AccountSettings;
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  IconButton,
  Collapse,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { User } from '../../types';
import { adminService } from '../../services/admin';

interface UserWithProgress extends User {
  total_attempts?: number;
  correct_attempts?: number;
  accuracy_rate?: number;
  completed_sessions?: number;
  last_activity?: string;
}

interface UserProgress {
  user_id: number;
  username: string;
  email: string;
  total_attempts: number;
  correct_attempts: number;
  accuracy_rate: number;
  total_sessions: number;
  avg_score: number;
  genre_progress: {
    genre_id: number;
    genre_name: string;
    total_attempts: number;
    correct_attempts: number;
    accuracy_rate: number;
    last_study_date: string;
  }[];
  recent_activity: {
    question_id: number;
    question_title: string;
    genre_name: string;
    is_correct: boolean;
    attempt_time: string;
  }[];
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set());
  const [userProgressData, setUserProgressData] = useState<Map<number, UserProgress>>(new Map());
  
  // フィルター - デフォルトで有効なアカウントのみ表示
  const [filters, setFilters] = useState({
    search: '',
    is_active: 'true',
    is_staff: ''
  });

  // 編集ダイアログ
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    is_active: true,
    is_staff: false,
  });

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const filterObj: any = {};
      if (filters.search) filterObj.search = filters.search;
      if (filters.is_active) filterObj.is_active = filters.is_active === 'true';
      if (filters.is_staff) filterObj.is_staff = filters.is_staff === 'true';

      // ユーザー基本情報を取得
      const userData = await adminService.getUsers(filterObj);
      
      // ユーザー進捗サマリーを取得
      const progressData = await adminService.getUsersProgress();
      
      // ユーザーデータと進捗データをマージ
      const usersWithProgress = userData.map(user => {
        const progressUser = progressData.users?.find((p: any) => p.user_id === user.id);
        return {
          ...user,
          total_attempts: progressUser?.total_attempts || 0,
          correct_attempts: progressUser?.correct_attempts || 0,
          accuracy_rate: progressUser?.accuracy_rate || 0,
          completed_sessions: progressUser?.completed_sessions || 0,
          last_activity: progressUser?.last_activity || null,
        };
      });
      
      setUsers(usersWithProgress);
    } catch (err: any) {
      setError(err.message || 'ユーザーの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleExpandUser = async (userId: number) => {
    const newExpanded = new Set(expandedUsers);
    
    if (expandedUsers.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
      
      // 詳細進捗データを取得
      if (!userProgressData.has(userId)) {
        try {
          setProgressLoading(true);
          const progressDetail = await adminService.getUserProgress(userId);
          setUserProgressData(prev => new Map(prev.set(userId, progressDetail)));
        } catch (err: any) {
          setError(err.message || '進捗詳細の取得に失敗しました');
        } finally {
          setProgressLoading(false);
        }
      }
    }
    
    setExpandedUsers(newExpanded);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      is_active: user.is_active,
      is_staff: user.is_staff || false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    try {
      // 更新可能なフィールドのみを送信
      const updateData: any = {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        is_active: editForm.is_active,
        is_staff: editForm.is_staff,
      };
      
      // emailとusernameは変更された場合のみ含める
      if (editForm.email !== editingUser.email) {
        updateData.email = editForm.email;
      }
      if (editForm.username !== editingUser.username) {
        updateData.username = editForm.username;
      }

      console.log('Sending user update:', updateData);
      await adminService.updateUser(editingUser.id, updateData);
      setDialogOpen(false);
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'ユーザーの更新に失敗しました');
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingUser(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: '#40b87c' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box mt={4}>
        <Typography variant="h4" component="h1" gutterBottom color="#27313b">
          ユーザー管理
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* フィルター */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              フィルター
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="検索"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="ユーザー名、メールアドレスで検索"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>アカウント状態</InputLabel>
                  <Select
                    value={filters.is_active}
                    onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
                    label="アカウント状態"
                  >
                    <MenuItem value="">すべて</MenuItem>
                    <MenuItem value="true">有効</MenuItem>
                    <MenuItem value="false">無効</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>管理者権限</InputLabel>
                  <Select
                    value={filters.is_staff}
                    onChange={(e) => setFilters({ ...filters, is_staff: e.target.value })}
                    label="管理者権限"
                  >
                    <MenuItem value="">すべて</MenuItem>
                    <MenuItem value="true">管理者</MenuItem>
                    <MenuItem value="false">一般ユーザー</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* ユーザー一覧テーブル */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ユーザー名</TableCell>
                <TableCell>メールアドレス</TableCell>
                <TableCell>氏名</TableCell>
                <TableCell>権限</TableCell>
                <TableCell>状態</TableCell>
                <TableCell>学習統計</TableCell>
                <TableCell>正答率</TableCell>
                <TableCell>最終活動</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <React.Fragment key={user.id}>
                  <TableRow>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {user.is_staff ? (
                          <AdminPanelSettingsIcon sx={{ color: '#ff9800' }} />
                        ) : (
                          <PersonIcon sx={{ color: '#666' }} />
                        )}
                        {user.username}
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.first_name || user.last_name 
                        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_staff ? '管理者' : '一般ユーザー'}
                        color={user.is_staff ? 'warning' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active ? '有効' : '無効'}
                        color={user.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          問題: {user.total_attempts || 0}回
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          セッション: {user.completed_sessions || 0}回
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2">
                          {user.accuracy_rate?.toFixed(1) || '0.0'}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={user.accuracy_rate || 0}
                          sx={{ width: 60, height: 4 }}
                          color={user.accuracy_rate && user.accuracy_rate >= 80 ? 'success' : 
                                user.accuracy_rate && user.accuracy_rate >= 60 ? 'warning' : 'error'}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      {user.last_activity 
                        ? new Date(user.last_activity).toLocaleDateString('ja-JP')
                        : '未活動'
                      }
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEdit(user)}
                        >
                          編集
                        </Button>
                        <Tooltip title="学習詳細を表示">
                          <IconButton
                            size="small"
                            onClick={() => handleExpandUser(Number(user.id))}
                            disabled={user.total_attempts === 0}
                          >
                            {expandedUsers.has(Number(user.id)) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                  
                  {/* 詳細進捗表示 */}
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                      <Collapse in={expandedUsers.has(Number(user.id))} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2 }}>
                          {progressLoading ? (
                            <Box display="flex" justifyContent="center" p={2}>
                              <CircularProgress size={24} />
                            </Box>
                          ) : (
                            userProgressData.has(Number(user.id)) && (
                              <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                  <Card>
                                    <CardContent>
                                      <Typography variant="h6" gutterBottom>
                                        <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        ジャンル別進捗
                                      </Typography>
                                      {userProgressData.get(Number(user.id))?.genre_progress.map((genre) => (
                                        <Box key={genre.genre_id} sx={{ mb: 2 }}>
                                          <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body2">{genre.genre_name}</Typography>
                                            <Typography variant="body2" color="textSecondary">
                                              {genre.accuracy_rate}% ({genre.correct_attempts}/{genre.total_attempts})
                                            </Typography>
                                          </Box>
                                          <LinearProgress
                                            variant="determinate"
                                            value={genre.accuracy_rate}
                                            sx={{ mt: 0.5 }}
                                            color={genre.accuracy_rate >= 80 ? 'success' : 
                                                  genre.accuracy_rate >= 60 ? 'warning' : 'error'}
                                          />
                                          <Typography variant="caption" color="textSecondary">
                                            最終学習: {new Date(genre.last_study_date).toLocaleDateString('ja-JP')}
                                          </Typography>
                                        </Box>
                                      ))}
                                    </CardContent>
                                  </Card>
                                </Grid>
                                
                                <Grid item xs={12} md={6}>
                                  <Card>
                                    <CardContent>
                                      <Typography variant="h6" gutterBottom>
                                        <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        最近の活動
                                      </Typography>
                                      {userProgressData.get(Number(user.id))?.recent_activity.slice(0, 5).map((activity, index) => (
                                        <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                          <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body2">{activity.question_title}</Typography>
                                            <Chip
                                              label={activity.is_correct ? '正解' : '不正解'}
                                              color={activity.is_correct ? 'success' : 'error'}
                                              size="small"
                                            />
                                          </Box>
                                          <Typography variant="caption" color="textSecondary">
                                            {activity.genre_name} • {new Date(activity.attempt_time).toLocaleDateString('ja-JP')}
                                          </Typography>
                                        </Box>
                                      ))}
                                    </CardContent>
                                  </Card>
                                </Grid>
                              </Grid>
                            )
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {users.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="textSecondary">
              ユーザーが見つかりません
            </Typography>
          </Box>
        )}

        {/* 編集ダイアログ */}
        <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>ユーザー編集</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="ユーザー名"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="メールアドレス"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="姓"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="名"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editForm.is_active}
                      onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    />
                  }
                  label="アカウント有効"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editForm.is_staff}
                      onChange={(e) => setEditForm({ ...editForm, is_staff: e.target.checked })}
                    />
                  }
                  label="管理者権限"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>キャンセル</Button>
            <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: '#40b87c' }}>
              保存
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default UserManagement;
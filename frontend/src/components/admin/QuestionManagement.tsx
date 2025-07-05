import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Container,
  Button,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Alert,
  CircularProgress,
  DialogContentText,
  FormControlLabel,
  Switch,
  IconButton,
  TableSortLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveIcon from '@mui/icons-material/Remove';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import DOMPurify from 'dompurify';
import { Question, Genre } from '../../types';
import { adminService } from '../../services/admin';

const QuestionManagement: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvExporting, setCsvExporting] = useState(false);
  const [csvDeleting, setCsvDeleting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [deleteResult, setDeleteResult] = useState<any>(null);
  
  // フィルター
  const [filters, setFilters] = useState({
    genre: '',
    difficulty: '',
    search: '',
    is_active: '',
    reviewed_status: ''
  });

  // ソート
  const [orderBy, setOrderBy] = useState<string>('');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  // ダイアログ
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'delete' | null>(null);
  
  // 一括編集フォーム
  const [bulkEditForm, setBulkEditForm] = useState({
    genre: '',
    difficulty: ''
  });
  
  // 問題編集フォーム
  const [editForm, setEditForm] = useState({
    title: '',
    body: '',
    clarification: '',
    genre: '',
    difficulty: 1,
    is_active: true,
    reviewed_at: null as string | null,
    choices: [
      { content: '', is_correct: false },
      { content: '', is_correct: false },
      { content: '', is_correct: false },
      { content: '', is_correct: false }
    ]
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  useEffect(() => {
    loadGenres();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const filterObj: any = {};
      if (filters.genre) filterObj.genre = filters.genre;
      if (filters.difficulty) filterObj.difficulty = parseInt(filters.difficulty);
      if (filters.search) filterObj.search = filters.search;
      if (filters.is_active) filterObj.is_active = filters.is_active === 'true';
      if (filters.reviewed_status) {
        if (filters.reviewed_status === 'reviewed') {
          filterObj.reviewed_at__isnull = false;
        } else if (filters.reviewed_status === 'not_reviewed') {
          filterObj.reviewed_at__isnull = true;
        }
      }

      const data = await adminService.getQuestions(filterObj);
      setQuestions(data);
    } catch (err: any) {
      setError(err.message || '問題の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadGenres = async () => {
    try {
      const data = await adminService.getGenres();
      if (Array.isArray(data)) {
        setGenres(data);
      } else {
        console.error('Genres data is not an array:', data);
        setGenres([]);
      }
    } catch (err) {
      console.error('Error loading genres:', err);
      setGenres([]);
    }
  };

  const handleCSVExport = async () => {
    try {
      setCsvExporting(true);
      const response = await fetch('/api/admin/csv/export/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('CSV export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'questions_export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('CSV export error:', err);
      setError('CSVエクスポートに失敗しました');
    } finally {
      setCsvExporting(false);
    }
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('CSVファイルを選択してください');
      return;
    }

    try {
      setCsvImporting(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/csv/import/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'CSV import failed');
      }

      setImportResult(result);
      setError(null);
      loadData(); // データを再読み込み
    } catch (err: any) {
      console.error('CSV import error:', err);
      setError(`CSVインポートに失敗しました: ${err.message}`);
    } finally {
      setCsvImporting(false);
      // ファイル入力をリセット
      event.target.value = '';
    }
  };

  const handleCSVDelete = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('CSVファイルを選択してください');
      return;
    }

    try {
      setCsvDeleting(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/csv/delete/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'CSV delete failed');
      }

      setDeleteResult(result);
      setError(null);
      loadData(); // データを再読み込み
    } catch (err: any) {
      console.error('CSV delete error:', err);
      setError(`CSV削除に失敗しました: ${err.message}`);
    } finally {
      setCsvDeleting(false);
      // ファイル入力をリセット
      event.target.value = '';
    }
  };

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedQuestions.length === 0) {
      setError('問題を選択してください');
      return;
    }

    setBulkAction(action);
    setBulkDialogOpen(true);
  };

  const confirmBulkAction = async () => {
    if (!bulkAction) return;

    try {
      await adminService.bulkActionQuestions(bulkAction, selectedQuestions);
      setSelectedQuestions([]);
      setBulkDialogOpen(false);
      setBulkAction(null);
      loadData();
    } catch (err: any) {
      setError(err.message || '一括操作に失敗しました');
    }
  };

  const cancelBulkAction = () => {
    setBulkDialogOpen(false);
    setBulkAction(null);
  };

  const handleBulkReviewReset = async () => {
    if (selectedQuestions.length === 0) {
      setError('問題を選択してください');
      return;
    }

    if (!window.confirm(`選択した${selectedQuestions.length}件の問題のレビュー状態をリセットしますか？`)) {
      return;
    }

    try {
      const updates = { reviewed_at: null };
      await adminService.bulkUpdateQuestions(selectedQuestions, updates);
      setSelectedQuestions([]);
      loadData();
    } catch (err: any) {
      setError(err.message || 'レビューリセットに失敗しました');
    }
  };


  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    
    // フォームを問題データで初期化
    setEditForm({
      title: question.title,
      body: question.body,
      clarification: question.clarification,
      genre: question.genre,
      difficulty: question.difficulty,
      is_active: question.is_active,
      reviewed_at: question.reviewed_at || null,
      choices: question.choices.length > 0 ? question.choices.map(choice => ({
        content: choice.content,
        is_correct: choice.is_correct
      })) : [
        { content: '', is_correct: false },
        { content: '', is_correct: false },
        { content: '', is_correct: false },
        { content: '', is_correct: false }
      ]
    });
    
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingQuestion(null);
    
    // フォームをリセット
    setEditForm({
      title: '',
      body: '',
      clarification: '',
      genre: '',
      difficulty: 1,
      is_active: true,
      reviewed_at: null,
      choices: [
        { content: '', is_correct: false },
        { content: '', is_correct: false },
        { content: '', is_correct: false },
        { content: '', is_correct: false }
      ]
    });
    
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      // 少なくとも1つの正解があることを確認
      const hasCorrectAnswer = editForm.choices.some(choice => choice.is_correct);
      if (!hasCorrectAnswer) {
        setError('少なくとも1つの正解を設定してください');
        return;
      }

      // 空でない選択肢のみを含める
      const validChoices = editForm.choices.filter(choice => choice.content.trim() !== '');
      if (validChoices.length < 2) {
        setError('少なくとも2つの選択肢を入力してください');
        return;
      }

      // バックエンドAPI用のデータ形式
      const questionData = {
        title: editForm.title,
        body: editForm.body,
        clarification: editForm.clarification,
        genre: editForm.genre,
        difficulty: editForm.difficulty,
        point_weight: 1,
        time_weight: 1,
        is_active: editForm.is_active,
        reviewed_at: editForm.reviewed_at,
        choices: validChoices.map((choice, index) => ({
          content: choice.content,
          is_correct: choice.is_correct,
          order_index: index
        }))
      };

      if (editingQuestion) {
        // 更新
        await adminService.updateQuestion(editingQuestion.id, questionData);
      } else {
        // 新規作成
        await adminService.createQuestion(questionData);
      }
      
      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || '問題の保存に失敗しました');
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingQuestion(null);
  };

  const handleDelete = (question: Question) => {
    setDeletingQuestion(question);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingQuestion) return;

    try {
      await adminService.deleteQuestion(deletingQuestion.id);
      setDeleteDialogOpen(false);
      setDeletingQuestion(null);
      loadData();
    } catch (err: any) {
      setError(err.message || '問題の削除に失敗しました');
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setDeletingQuestion(null);
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty === 1) return 'success';
    if (difficulty === 2) return 'warning';
    return 'error';
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty === 1) return '初級';
    if (difficulty === 2) return '中級';
    return '上級';
  };

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedQuestions = React.useMemo(() => {
    if (!orderBy) return questions;

    return [...questions].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (orderBy) {
        case 'genre':
          aValue = a.genre_name || '';
          bValue = b.genre_name || '';
          break;
        case 'difficulty':
          aValue = a.difficulty;
          bValue = b.difficulty;
          break;
        case 'is_active':
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at || a.created_at).getTime();
          bValue = new Date(b.updated_at || b.created_at).getTime();
          break;
        case 'reviewed_at':
          aValue = a.reviewed_at ? new Date(a.reviewed_at).getTime() : 0;
          bValue = b.reviewed_at ? new Date(b.reviewed_at).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [questions, order, orderBy]);

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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" color="#27313b">
            問題管理
          </Typography>
          <Box display="flex" gap={2}>
            {/* CSV エクスポート */}
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleCSVExport}
              disabled={csvExporting}
              sx={{ borderColor: '#2196f3', color: '#2196f3' }}
            >
              {csvExporting ? 'エクスポート中...' : 'CSV エクスポート'}
            </Button>
            
            {/* CSV インポート */}
            <label htmlFor="csv-upload">
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleCSVImport}
              />
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                disabled={csvImporting}
                sx={{ borderColor: '#ff9800', color: '#ff9800' }}
              >
                {csvImporting ? 'インポート中...' : 'CSV インポート'}
              </Button>
            </label>
            
            {/* CSV削除 */}
            <label htmlFor="csv-delete-upload">
              <input
                id="csv-delete-upload"
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleCSVDelete}
              />
              <Button
                variant="outlined"
                component="span"
                startIcon={<DeleteIcon />}
                disabled={csvDeleting}
                sx={{ borderColor: '#f44336', color: '#f44336' }}
              >
                {csvDeleting ? '削除中...' : 'CSV 削除'}
              </Button>
            </label>
            
            {/* 新規問題作成 */}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              sx={{ backgroundColor: '#40b87c' }}
            >
              新規問題作成
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {importResult && (
          <Alert 
            severity={importResult.summary.error_count > 0 ? 'warning' : 'success'} 
            sx={{ mb: 3 }}
            onClose={() => setImportResult(null)}
          >
            <Typography variant="subtitle2" gutterBottom>
              CSVインポート結果
            </Typography>
            <Typography variant="body2">
              総行数: {importResult.summary.total_rows}, 
              成功: {importResult.summary.success_count}, 
              エラー: {importResult.summary.error_count}
            </Typography>
            {importResult.summary.errors && importResult.summary.errors.length > 0 && (
              <Box mt={1}>
                <Typography variant="body2" color="error">
                  エラー詳細:
                </Typography>
                {importResult.summary.errors.slice(0, 5).map((error: string, index: number) => (
                  <Typography key={index} variant="body2" color="error" sx={{ fontSize: '0.8rem' }}>
                    • {error}
                  </Typography>
                ))}
                {importResult.summary.errors.length > 5 && (
                  <Typography variant="body2" color="error" sx={{ fontSize: '0.8rem' }}>
                    ...他 {importResult.summary.errors.length - 5} 件のエラー
                  </Typography>
                )}
              </Box>
            )}
          </Alert>
        )}

        {deleteResult && (
          <Alert 
            severity={deleteResult.summary.error_count > 0 ? 'warning' : 'success'} 
            sx={{ mb: 3 }}
            onClose={() => setDeleteResult(null)}
          >
            <Typography variant="subtitle2" gutterBottom>
              CSV削除結果
            </Typography>
            <Typography variant="body2">
              総行数: {deleteResult.summary.total_rows}, 
              削除成功: {deleteResult.summary.success_count}, 
              見つからない: {deleteResult.summary.not_found_count}, 
              エラー: {deleteResult.summary.error_count}
            </Typography>
            {deleteResult.summary.errors && deleteResult.summary.errors.length > 0 && (
              <Box mt={1}>
                <Typography variant="body2" color="error">
                  エラー詳細:
                </Typography>
                {deleteResult.summary.errors.slice(0, 5).map((error: string, index: number) => (
                  <Typography key={index} variant="body2" color="error" sx={{ fontSize: '0.8rem' }}>
                    • {error}
                  </Typography>
                ))}
                {deleteResult.summary.errors.length > 5 && (
                  <Typography variant="body2" color="error" sx={{ fontSize: '0.8rem' }}>
                    ...他 {deleteResult.summary.errors.length - 5} 件のエラー
                  </Typography>
                )}
              </Box>
            )}
          </Alert>
        )}

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
                    value={filters.genre}
                    onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
                    label="ジャンル"
                  >
                    <MenuItem value="">すべて</MenuItem>
                    {Array.isArray(genres) && genres.map((genre) => (
                      <MenuItem key={genre.id} value={genre.id}>
                        {genre.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>難易度</InputLabel>
                  <Select
                    value={filters.difficulty}
                    onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                    label="難易度"
                  >
                    <MenuItem value="">すべて</MenuItem>
                    <MenuItem value="1">1 (初級)</MenuItem>
                    <MenuItem value="2">2 (中級)</MenuItem>
                    <MenuItem value="3">3 (上級)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>状態</InputLabel>
                  <Select
                    value={filters.is_active}
                    onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
                    label="状態"
                  >
                    <MenuItem value="">すべて</MenuItem>
                    <MenuItem value="true">有効</MenuItem>
                    <MenuItem value="false">無効</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>レビュー状態</InputLabel>
                  <Select
                    value={filters.reviewed_status}
                    onChange={(e) => setFilters({ ...filters, reviewed_status: e.target.value })}
                    label="レビュー状態"
                  >
                    <MenuItem value="">すべて</MenuItem>
                    <MenuItem value="reviewed">レビュー済</MenuItem>
                    <MenuItem value="not_reviewed">未レビュー</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="検索"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="問題文で検索"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 一括操作 */}
        {selectedQuestions.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="body1">
                  {selectedQuestions.length}件選択中
                </Typography>
                <Button
                  size="small"
                  onClick={() => handleBulkAction('activate')}
                  sx={{ color: '#4caf50' }}
                >
                  有効化
                </Button>
                <Button
                  size="small"
                  onClick={() => handleBulkAction('deactivate')}
                  sx={{ color: '#ff9800' }}
                >
                  無効化
                </Button>
                <Button
                  size="small"
                  onClick={() => handleBulkAction('delete')}
                  sx={{ color: '#f44336' }}
                >
                  削除
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setBulkEditForm({ genre: '', difficulty: '' });
                    setBulkEditDialogOpen(true);
                  }}
                  sx={{ color: '#2196f3' }}
                >
                  ジャンル・難易度変更
                </Button>
                <Button
                  size="small"
                  onClick={() => handleBulkReviewReset()}
                  sx={{ color: '#9c27b0' }}
                >
                  レビューリセット
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* 問題一覧テーブル */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedQuestions.length === questions.length && questions.length > 0}
                    indeterminate={selectedQuestions.length > 0 && selectedQuestions.length < questions.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedQuestions(questions.map(q => q.id));
                      } else {
                        setSelectedQuestions([]);
                      }
                    }}
                  />
                </TableCell>
                <TableCell>問題文</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'genre'}
                    direction={orderBy === 'genre' ? order : 'asc'}
                    onClick={() => handleRequestSort('genre')}
                  >
                    ジャンル
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'difficulty'}
                    direction={orderBy === 'difficulty' ? order : 'asc'}
                    onClick={() => handleRequestSort('difficulty')}
                  >
                    難易度
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'is_active'}
                    direction={orderBy === 'is_active' ? order : 'asc'}
                    onClick={() => handleRequestSort('is_active')}
                  >
                    状態
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'updated_at'}
                    direction={orderBy === 'updated_at' ? order : 'asc'}
                    onClick={() => handleRequestSort('updated_at')}
                  >
                    最終更新 / レビュー日
                  </TableSortLabel>
                </TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedQuestions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedQuestions.includes(question.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedQuestions([...selectedQuestions, question.id]);
                        } else {
                          setSelectedQuestions(selectedQuestions.filter(id => id !== question.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.title) }}
                    />
                    {question.body && (
                      <Typography 
                        variant="body2" 
                        color="textSecondary"
                        sx={{ 
                          maxWidth: 300, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          mt: 1,
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical'
                        }}
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.body.replace(/<br\s*\/?>/gi, ' ').replace(/\n/g, ' ')) }}
                      />
                    )}
                  </TableCell>
                  <TableCell>{question.genre_name}</TableCell>
                  <TableCell>
                    <Chip
                      label={getDifficultyLabel(question.difficulty)}
                      color={getDifficultyColor(question.difficulty)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={question.is_active ? '有効' : '無効'}
                      color={question.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {new Date(question.updated_at || question.created_at).toLocaleString('ja-JP')}
                      </Typography>
                      {question.reviewed_at ? (
                        <Box mt={0.5}>
                          <Typography variant="body2" color="primary" sx={{ fontSize: '0.8rem' }}>
                            レビュー: {new Date(question.reviewed_at).toLocaleDateString('ja-JP')}
                          </Typography>
                          <Chip
                            label="済"
                            color="success"
                            size="small"
                            sx={{ fontSize: '0.6rem', height: '18px', mt: 0.3 }}
                          />
                        </Box>
                      ) : (
                        <Box mt={0.5}>
                          <Chip
                            label="未レビュー"
                            color="default"
                            size="small"
                            sx={{ fontSize: '0.6rem', height: '18px' }}
                          />
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleEdit(question)}
                      >
                        編集
                      </Button>
                      <Button
                        size="small"
                        startIcon={<DeleteIcon />}
                        color="error"
                        onClick={() => handleDelete(question)}
                      >
                        削除
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {sortedQuestions.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="textSecondary">
              問題が見つかりません
            </Typography>
          </Box>
        )}

        {/* 削除確認ダイアログ */}
        <Dialog open={deleteDialogOpen} onClose={cancelDelete}>
          <DialogTitle>削除確認</DialogTitle>
          <DialogContent>
            <DialogContentText>
              問題「{deletingQuestion?.title.substring(0, 50)}...」を削除しますか？
              この操作は取り消せません。
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelDelete}>キャンセル</Button>
            <Button onClick={confirmDelete} color="error" variant="contained">
              削除
            </Button>
          </DialogActions>
        </Dialog>

        {/* 一括操作確認ダイアログ */}
        <Dialog open={bulkDialogOpen} onClose={cancelBulkAction}>
          <DialogTitle>一括操作確認</DialogTitle>
          <DialogContent>
            <DialogContentText>
              選択した{selectedQuestions.length}件の問題を
              {bulkAction === 'activate' && '有効化'}
              {bulkAction === 'deactivate' && '無効化'}
              {bulkAction === 'delete' && '削除'}
              しますか？
              {bulkAction === 'delete' && ' この操作は取り消せません。'}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelBulkAction}>キャンセル</Button>
            <Button 
              onClick={confirmBulkAction} 
              color={bulkAction === 'delete' ? 'error' : 'primary'}
              variant="contained"
            >
              {bulkAction === 'activate' && '有効化'}
              {bulkAction === 'deactivate' && '無効化'}
              {bulkAction === 'delete' && '削除'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 問題編集ダイアログ */}
        <Dialog open={dialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingQuestion ? '問題編集' : '新規問題作成'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* 問題タイトル */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="問題タイトル"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  multiline
                  rows={2}
                  required
                />
              </Grid>
              
              {/* 問題文 */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="問題文（詳細）"
                  value={editForm.body}
                  onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
              
              {/* 補足説明 */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="補足説明"
                  value={editForm.clarification}
                  onChange={(e) => setEditForm({ ...editForm, clarification: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
              
              {/* ジャンル */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>ジャンル</InputLabel>
                  <Select
                    value={editForm.genre}
                    onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })}
                    label="ジャンル"
                  >
                    {Array.isArray(genres) && genres.map((genre) => (
                      <MenuItem key={genre.id} value={genre.id}>
                        {genre.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* 難易度 */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>難易度</InputLabel>
                  <Select
                    value={editForm.difficulty}
                    onChange={(e) => setEditForm({ ...editForm, difficulty: Number(e.target.value) })}
                    label="難易度"
                  >
                    <MenuItem value={1}>1 (初級)</MenuItem>
                    <MenuItem value={2}>2 (中級)</MenuItem>
                    <MenuItem value={3}>3 (上級)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* 有効/無効 */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editForm.is_active}
                      onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    />
                  }
                  label="この問題を有効にする"
                />
              </Grid>
              
              {/* レビュー完了日 */}
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="body2" color="textSecondary">
                    レビュー完了日: {editForm.reviewed_at ? new Date(editForm.reviewed_at).toLocaleString('ja-JP') : '未レビュー'}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setEditForm({ ...editForm, reviewed_at: new Date().toISOString() })}
                  >
                    レビュー完了としてマーク
                  </Button>
                  {editForm.reviewed_at && (
                    <Button
                      size="small"
                      variant="text"
                      color="error"
                      onClick={() => setEditForm({ ...editForm, reviewed_at: null })}
                    >
                      クリア
                    </Button>
                  )}
                </Box>
              </Grid>
              
              {/* 選択肢 */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  選択肢
                </Typography>
                {editForm.choices.map((choice, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs>
                        <TextField
                          fullWidth
                          label={`選択肢 ${index + 1}`}
                          value={choice.content}
                          onChange={(e) => {
                            const newChoices = [...editForm.choices];
                            newChoices[index] = { ...choice, content: e.target.value };
                            setEditForm({ ...editForm, choices: newChoices });
                          }}
                        />
                      </Grid>
                      <Grid item>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={choice.is_correct}
                              onChange={(e) => {
                                const newChoices = [...editForm.choices];
                                newChoices[index] = { ...choice, is_correct: e.target.checked };
                                setEditForm({ ...editForm, choices: newChoices });
                              }}
                            />
                          }
                          label="正解"
                        />
                      </Grid>
                      {editForm.choices.length > 2 && (
                        <Grid item>
                          <IconButton
                            onClick={() => {
                              const newChoices = editForm.choices.filter((_, i) => i !== index);
                              setEditForm({ ...editForm, choices: newChoices });
                            }}
                            color="error"
                          >
                            <RemoveIcon />
                          </IconButton>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                ))}
                
                {editForm.choices.length < 6 && (
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setEditForm({
                        ...editForm,
                        choices: [...editForm.choices, { content: '', is_correct: false }]
                      });
                    }}
                    variant="outlined"
                  >
                    選択肢を追加
                  </Button>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>キャンセル</Button>
            <Button 
              onClick={handleSave} 
              variant="contained" 
              sx={{ backgroundColor: '#40b87c' }}
              disabled={!editForm.title.trim() || !editForm.genre}
            >
              {editingQuestion ? '更新' : '作成'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 一括編集ダイアログ */}
        <Dialog open={bulkEditDialogOpen} onClose={() => setBulkEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>一括編集</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 3 }}>
              選択した{selectedQuestions.length}件の問題のジャンルと難易度を変更します。
              空欄の項目は変更されません。
            </DialogContentText>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>ジャンル</InputLabel>
                  <Select
                    value={bulkEditForm.genre}
                    onChange={(e) => setBulkEditForm({ ...bulkEditForm, genre: e.target.value })}
                    label="ジャンル"
                  >
                    <MenuItem value="">変更しない</MenuItem>
                    {Array.isArray(genres) && genres.map((genre) => (
                      <MenuItem key={genre.id} value={genre.id}>
                        {genre.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>難易度</InputLabel>
                  <Select
                    value={bulkEditForm.difficulty}
                    onChange={(e) => setBulkEditForm({ ...bulkEditForm, difficulty: e.target.value })}
                    label="難易度"
                  >
                    <MenuItem value="">変更しない</MenuItem>
                    <MenuItem value="1">1 (初級)</MenuItem>
                    <MenuItem value="2">2 (中級)</MenuItem>
                    <MenuItem value="3">3 (上級)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBulkEditDialogOpen(false)}>キャンセル</Button>
            <Button 
              onClick={async () => {
                try {
                  setLoading(true);
                  const updates: any = {};
                  if (bulkEditForm.genre) updates.genre = bulkEditForm.genre;
                  if (bulkEditForm.difficulty) updates.difficulty = parseInt(bulkEditForm.difficulty);
                  
                  if (Object.keys(updates).length === 0) {
                    setError('変更する項目を選択してください');
                    return;
                  }
                  
                  await adminService.bulkUpdateQuestions(selectedQuestions, updates);
                  
                  setSelectedQuestions([]);
                  setBulkEditDialogOpen(false);
                  loadData();
                } catch (err: any) {
                  setError(err.message || '一括編集に失敗しました');
                } finally {
                  setLoading(false);
                }
              }}
              variant="contained"
              sx={{ backgroundColor: '#40b87c' }}
              disabled={!bulkEditForm.genre && !bulkEditForm.difficulty}
            >
              変更を適用
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default QuestionManagement;
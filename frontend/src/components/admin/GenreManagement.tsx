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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  DialogContentText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Genre } from '../../types';
import { adminService } from '../../services/admin';

const GenreManagement: React.FC = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ダイアログ
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [deletingGenre, setDeletingGenre] = useState<Genre | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      setLoading(true);
      const data = await adminService.getGenres();
      setGenres(data);
    } catch (err: any) {
      setError(err.message || 'ジャンルの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (genre: Genre) => {
    setEditingGenre(genre);
    setEditForm({
      name: genre.name,
      description: genre.description || '',
    });
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingGenre(null);
    setEditForm({
      name: '',
      description: '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingGenre) {
        // 更新
        await adminService.updateGenre(editingGenre.id, editForm);
      } else {
        // 新規作成
        await adminService.createGenre(editForm);
      }
      setDialogOpen(false);
      loadGenres();
    } catch (err: any) {
      setError(err.message || 'ジャンルの保存に失敗しました');
    }
  };

  const handleDelete = (genre: Genre) => {
    setDeletingGenre(genre);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingGenre) return;

    try {
      await adminService.deleteGenre(deletingGenre.id);
      setDeleteDialogOpen(false);
      setDeletingGenre(null);
      loadGenres();
    } catch (err: any) {
      setError(err.message || 'ジャンルの削除に失敗しました');
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setDeletingGenre(null);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingGenre(null);
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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" color="#27313b">
            ジャンル管理
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            sx={{ backgroundColor: '#40b87c' }}
          >
            新規ジャンル作成
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* ジャンル一覧テーブル */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>ジャンル名</TableCell>
                <TableCell>説明</TableCell>
                <TableCell>問題数</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {genres.map((genre) => (
                <TableRow key={genre.id}>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {genre.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {genre.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {genre.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {genre.question_count || 0}問
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleEdit(genre)}
                      >
                        編集
                      </Button>
                      <Button
                        size="small"
                        startIcon={<DeleteIcon />}
                        color="error"
                        onClick={() => handleDelete(genre)}
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

        {genres.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="textSecondary">
              ジャンルが見つかりません
            </Typography>
          </Box>
        )}

        {/* 編集ダイアログ */}
        <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingGenre ? 'ジャンル編集' : '新規ジャンル作成'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="ジャンル名"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="説明"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>キャンセル</Button>
            <Button 
              onClick={handleSave} 
              variant="contained" 
              sx={{ backgroundColor: '#40b87c' }}
              disabled={!editForm.name.trim()}
            >
              {editingGenre ? '更新' : '作成'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 削除確認ダイアログ */}
        <Dialog open={deleteDialogOpen} onClose={cancelDelete}>
          <DialogTitle>削除確認</DialogTitle>
          <DialogContent>
            <DialogContentText>
              ジャンル「{deletingGenre?.name}」を削除しますか？
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
      </Box>
    </Container>
  );
};

export default GenreManagement;
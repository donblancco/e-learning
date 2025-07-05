# E-learning System - Frontend (React)

## 概要

React + TypeScript を使用したE-learningシステムのフロントエンド。Material-UIによるモダンなユーザーインターフェースを提供します。

## 本番環境アクセス

- **URL**: https://your-domain.com
- **Basic認証**: user / password
- **管理者アカウント**: admin@example.com / [secure_password]
- **一般ユーザー**: user@example.com / [user_password]
- **現在のタスク定義**: elearning-system:33
- **リージョン**: ap-northeast-1 (東京)

## 技術スタック

- **React 18** - UIライブラリ
- **TypeScript** - 型安全な開発
- **Material-UI (MUI)** - UIコンポーネントライブラリ
- **Redux Toolkit** - 状態管理
- **React Router** - ルーティング
- **Recharts** - チャート表示
- **Axios** - HTTP通信
- **Docker** - コンテナ化

## プロジェクト構成

```
frontend/src/
├── components/          # 再利用可能なコンポーネント
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   ├── QuizApp.tsx
│   ├── QuizQuestion.tsx
│   ├── QuizResult.tsx
│   ├── StudyDashboard.tsx
│   ├── StudyHistory.tsx
│   ├── ProgressManagement.tsx
│   ├── AccountSettings.tsx
│   ├── GenreSelector.tsx
│   ├── PrivateRoute.tsx
│   └── admin/           # 管理者用コンポーネント
│       ├── AdminDashboard.tsx
│       ├── AdminPanel.tsx
│       ├── QuestionManagement.tsx
│       ├── GenreManagement.tsx
│       ├── UserManagement.tsx
│       └── UserProgressView.tsx
├── contexts/            # React Context
│   └── AuthContext.tsx
├── services/            # API通信
│   ├── api.ts
│   ├── auth.ts
│   ├── progress.ts
│   └── admin.ts
├── types/               # TypeScript型定義
│   └── index.ts
├── theme.ts             # Material-UIテーマ
├── App.tsx              # メインアプリケーション
└── index.tsx            # エントリーポイント
```

## 主要機能

### 認証システム
- **ログイン・ログアウト**: JWT認証
- **ユーザー登録**: 新規アカウント作成
- **自動ログイン**: トークンによる状態保持
- **パスワード変更**: セキュアなパスワード更新

### 学習機能
- **問題演習**: 選択式問題の回答
- **ジャンル選択**: カテゴリ別学習
- **全問題ランダム出題**: 全ジャンルから30問をランダム選択
- **間違った問題復習**: 不正解問題の再挑戦機能
- **即座フィードバック**: 回答後の正解・解説表示
- **進捗管理**: 学習状況の可視化
- **履歴表示**: 過去の学習記録

### 管理機能
- **問題管理**: CRUD操作、ID自動採番
- **ジャンル管理**: カテゴリの追加・編集
- **ユーザー管理**: アカウント管理
- **ユーザー学習進捗閲覧**: 各ユーザーの学習状況・進捗詳細表示
- **統計表示**: 学習データ分析

### UI/UX
- **レスポンシブデザイン**: モバイル・タブレット・デスクトップ完全対応
  - ハンバーガーメニュー（モバイル）
  - レスポンシブタイトル表示
  - スクロール可能タブ（AdminPanel）
- **ユーザビリティ改善**: 不要な情報の非表示化
- **ダークモード**: テーマ切り替え
- **アクセシビリティ**: ARIA対応
- **ローディング状態**: 適切なフィードバック

## コンポーネント詳細

### 認証関連

#### LoginForm.tsx
```typescript
// JWT認証によるログイン
const handleLogin = async (credentials: LoginCredentials) => {
  const response = await authService.login(credentials);
  setAuthToken(response.access);
  navigate('/dashboard');
};
```

#### RegisterForm.tsx
```typescript
// 新規ユーザー登録
const handleRegister = async (userData: RegisterData) => {
  await authService.register(userData);
  setMessage('登録が完了しました');
};
```

### 学習機能

#### QuizApp.tsx
```typescript
// クイズアプリケーションのメインコンポーネント
const QuizApp = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);

  // 問題取得
  const fetchQuestions = async (genre?: string) => {
    const data = await questionService.getQuestions({ genre });
    setQuestions(data.results);
  };

  // 回答処理
  const handleAnswer = async (choiceId: string) => {
    const result = await questionService.submitAnswer(
      questions[currentIndex].id,
      choiceId
    );
    setAnswers([...answers, result]);
  };
};
```

#### StudyDashboard.tsx
```typescript
// 学習ダッシュボード
const StudyDashboard = () => {
  const [stats, setStats] = useState<StudyStats>();
  const [progress, setProgress] = useState<Progress[]>([]);

  useEffect(() => {
    fetchStudyStats();
    fetchProgress();
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <StatCard title="総学習時間" value={stats?.totalTime} />
      </Grid>
      <Grid item xs={12} md={6}>
        <StatCard title="正答率" value={stats?.accuracy} />
      </Grid>
      <Grid item xs={12}>
        <ProgressChart data={progress} />
      </Grid>
    </Grid>
  );
};
```

### 管理者機能

#### AdminDashboard.tsx
```typescript
// 管理者ダッシュボード
const AdminDashboard = () => {
  return (
    <Tabs>
      <Tab label="問題管理" component={<QuestionManagement />} />
      <Tab label="ジャンル管理" component={<GenreManagement />} />
      <Tab label="ユーザー管理" component={<UserManagement />} />
      <Tab label="学習進捗" component={<UserProgressView />} />
    </Tabs>
  );
};
```

#### QuestionManagement.tsx
```typescript
// 問題管理コンポーネント
const QuestionManagement = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>();

  // ページネーション対応の問題取得
  const fetchQuestions = async (page = 1, pageSize = 20) => {
    const response = await adminService.getQuestions({ page, pageSize });
    setQuestions(response.results);
    setPagination({
      count: response.count,
      next: response.next,
      previous: response.previous
    });
  };

  // 問題作成（ID自動採番）
  const handleCreate = async (questionData: QuestionFormData) => {
    await adminService.createQuestion(questionData);
    fetchQuestions(); // リロード
  };
};
```

#### UserProgressView.tsx
```typescript
// ユーザー学習進捗閲覧コンポーネント
const UserProgressView = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);

  // ユーザー一覧取得
  const fetchUsers = async () => {
    const response = await adminService.getUsers();
    setUsers(response.results);
  };

  // 特定ユーザーの進捗取得
  const fetchUserProgress = async (userId: string) => {
    const progress = await adminService.getUserProgress(userId);
    setUserProgress(progress);
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    fetchUserProgress(user.id);
  };

  return (
    <Box>
      <UserList users={users} onUserSelect={handleUserSelect} />
      {selectedUser && (
        <UserProgressDetail user={selectedUser} progress={userProgress} />
      )}
    </Box>
  );
};
```

## 状態管理

### AuthContext
```typescript
// 認証状態の管理
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  // 自動ログイン（トークン確認）
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      validateToken(token);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## API通信

### authService
```typescript
// 認証関連API
export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login/', credentials);
    localStorage.setItem('accessToken', response.data.access);
    return response.data;
  },

  logout: async (): Promise<void> => {
    const token = localStorage.getItem('refreshToken');
    await api.post('/auth/logout/', { refresh: token });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/user/');
    return response.data;
  }
};
```

### adminService
```typescript
// 管理者関連API
export const adminService = {
  getUsers: async (params?: UserParams): Promise<PaginatedResponse<User>> => {
    const response = await api.get('/admin/users/', { params });
    return response.data;
  },

  getUserProgress: async (userId: string): Promise<UserProgress[]> => {
    const response = await api.get(`/admin/users/${userId}/progress/`);
    return response.data;
  }
};
```

### questionService
```typescript
// 問題関連API
export const questionService = {
  getQuestions: async (params?: QuestionParams): Promise<PaginatedResponse<Question>> => {
    const response = await api.get('/questions/', { params });
    return response.data;
  },

  getQuestionDetail: async (id: string): Promise<Question> => {
    const response = await api.get(`/questions/${id}/`);
    return response.data;
  },

  submitAnswer: async (questionId: string, choiceId: string): Promise<AnswerResult> => {
    const response = await api.post(`/questions/${questionId}/answer/`, {
      selected_choice: choiceId
    });
    return response.data;
  }
};
```

## 開発環境セットアップ

### 1. Dockerを使用した起動
```bash
# リポジトリルートで
docker-compose up -d

# フロントエンドアクセス
open http://localhost:3000
```

### 2. ローカル環境での起動
```bash
# フロントエンドディレクトリに移動
cd frontend

# 依存関係インストール
npm install

# 開発サーバー起動
npm start

# ブラウザで http://localhost:3000 を開く
```

### 3. 環境変数設定
```bash
# .env.local ファイル作成
echo "REACT_APP_API_URL=http://localhost:8000" > .env.local
```

## ビルド・デプロイ

### 開発用ビルド
```bash
npm run build
```

### 本番用ビルド
```bash
# 本番用イメージビルド (Apple Silicon対応)
docker buildx build --platform linux/amd64 -f Dockerfile.prod -t elearning-frontend:latest .

# Dockerfile.simpleを使用する場合（Basic認証付き）
docker buildx build --platform linux/amd64 -f Dockerfile.simple -t elearning-frontend:latest .

# ECR プッシュ
AWS_ACCOUNT_ID=YOUR_ACCOUNT_ID
docker tag elearning-frontend:latest ${AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com/elearning-system-frontend:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com/elearning-system-frontend:latest

# 注意: Apple Silicon (M1/M2 Mac) では必ず --platform linux/amd64 を指定してください
```

### AWS ECS デプロイ
詳細は `/deploy/README.md` を参照

## スタイリング

### Material-UI テーマ
```typescript
// theme.ts
export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});
```

### レスポンシブデザイン
```typescript
// ブレークポイント使用例
const useStyles = makeStyles((theme) => ({
  container: {
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1),
    },
    [theme.breakpoints.up('md')]: {
      padding: theme.spacing(3),
    },
  },
}));
```

## テスト

### テスト実行
```bash
# 全テスト実行
npm test

# カバレッジ付きテスト
npm test -- --coverage

# 特定ファイルのテスト
npm test -- LoginForm.test.tsx
```

### テスト例
```typescript
// LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from './LoginForm';

test('ログインフォームの動作', async () => {
  render(<LoginForm />);
  
  fireEvent.change(screen.getByLabelText('ユーザー名'), {
    target: { value: 'testuser' }
  });
  fireEvent.change(screen.getByLabelText('パスワード'), {
    target: { value: 'testpass' }
  });
  
  fireEvent.click(screen.getByRole('button', { name: 'ログイン' }));
  
  await waitFor(() => {
    expect(screen.getByText('ログインしました')).toBeInTheDocument();
  });
});
```

## トラブルシューティング

### よくある問題

1. **API通信エラー**
   ```typescript
   // 環境変数の確認
   console.log('API URL:', process.env.REACT_APP_API_URL);
   
   // CORSエラーの場合
   // バックエンドのCORS設定を確認
   ```

2. **認証エラー**
   ```typescript
   // トークンの確認
   const token = localStorage.getItem('accessToken');
   console.log('Token:', token);
   
   // トークンの期限切れ
   // 自動リフレッシュ機能の実装
   ```

3. **ビルドエラー**
   ```bash
   # 依存関係の再インストール
   rm -rf node_modules package-lock.json
   npm install
   
   # TypeScriptエラーの確認
   npm run type-check
   ```

### ログ確認

#### 開発環境
```bash
# ブラウザの開発者ツール
# Console タブでエラーログ確認

# Dockerログ
docker logs elearning_frontend -f
```

#### 本番環境
```bash
# ECS ログ確認
aws logs tail /ecs/elearning-system-frontend --follow --region ap-northeast-1

# 現在のタスクログストリーム取得
TASK_ID=$(aws ecs list-tasks --cluster elearning-system-cluster --service-name elearning-system-service --region ap-northeast-1 --query 'taskArns[0]' --output text | cut -d'/' -f3)
aws logs get-log-events --log-group-name "/ecs/elearning-system-frontend" --log-stream-name "ecs/frontend/$TASK_ID" --region ap-northeast-1
```

## パフォーマンス最適化

### コード分割
```typescript
// 遅延ローディング
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));

const App = () => (
  <Suspense fallback={<Loading />}>
    <Routes>
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  </Suspense>
);
```

### メモ化
```typescript
// React.memo でコンポーネントのメモ化
export const QuestionCard = React.memo<QuestionCardProps>(({ question }) => {
  return <Card>{question.object}</Card>;
});

// useMemo でデータの計算結果をメモ化
const processedData = useMemo(() => {
  return questions.map(q => ({ ...q, processed: true }));
}, [questions]);
```

## セキュリティ

### XSS対策
- DOMPurify による HTML サニタイズ
- React の自動エスケープ機能

### CSRF対策
- JWT トークンによる認証
- SameSite Cookie 設定

### セキュアな通信
- HTTPS 必須
- 機密情報のローカルストレージ管理

## 最近の更新内容

### 2025年6月20日
1. **難易度選択UI変更**: 
   - 中級と上級を統合し「中級・上級」ボタンに変更（difficulty=3で送信）
   - 「全問」ボタンを「ランダム」に名称変更
   - 3ボタン構成（初級/中級・上級/ランダム）に最適化
2. **デプロイ問題解決**:
   - nginx設定の.htpasswdファイル作成問題を修正
   - プラットフォームアーキテクチャ不一致問題を解決（ARM64→AMD64）
   - Dockerfile.simpleで `mkdir -p /etc/nginx` を追加
3. **ビルドプロセス改善**:
   - Apple Silicon（M1/M2 Mac）環境での本番用ビルド手順を明確化
   - `docker buildx build --platform linux/amd64` の使用を推奨

### 2025年6月18日
1. **全問題ランダム30問出題機能追加**: GenreSelectorに「🎲 全問題から30問ランダム」ボタンを追加、QuizAppで状態管理
2. **間違った問題の隣にランダム出題ボタン配置**: QuizResultで間違った問題（❌）の隣に「🎲 ランダム30問」ボタンを配置
3. **管理者画面「戻る」ボタンの視認性改善**: AdminPanelの「戻る」ボタンに背景色やホバー効果を追加
4. **APIサービス扩張**: api.tsにgetRandomQuestionsFromAll()関数を追加、全ジャンルからのランダム問題取得機能を実装

### 2025年6月17日
1. **CORS問題解決**: API URLを `your-domain.com` に統一し、CORSエラーを解決
2. **ビルド環境変数修正**: `deploy.sh` で `--build-arg REACT_APP_API_URL` を指定して正しいAPI URLをビルド時に設定
3. **ログイン機能復旧**: フロントエンドのログインが正常に動作するように修正
4. **管理者アカウント更新**: パスワードを password123 に変更
5. **一般ユーザーアカウント**: test02@test.com / testuser02 でテスト用アカウント作成
6. **ドメイン統一**: `example.com` から `your-domain.com` にドメインを統一
7. **モバイルレスポンシブUI実装**: ヘッダーのハンバーガーメニュー、AdminPanelのスクロールタブ実装
8. **ユーザー管理改善**: デフォルトで有効アカウントのみ表示、フィルター機能付き
9. **管理者ダッシュボード最適化**: 新規ユーザー統計コンポーネントを削除

## 開発者向け情報

### コーディング規約
- ESLint + Prettier による自動フォーマット
- TypeScript 厳格モード
- コンポーネントの命名規則: PascalCase
- ファイル名: kebab-case

### 追加機能の実装手順
1. 型定義を `types/index.ts` に追加
2. API サービスを `services/` に実装
3. コンポーネントを作成
4. ルーティングを設定
5. テストを追加

### 推奨 VS Code 拡張機能
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- Material-UI Snippets
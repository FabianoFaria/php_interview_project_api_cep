import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useToast } from './components/Toast/ToastContext';
import { useAuth } from './contexts/AuthContext';
import { CadastroPage } from './pages/CadastroPage';
import { EditarClientePage } from './pages/EditarClientePage';
import { ListagemPage } from './pages/ListagemPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    showToast('success', 'Voce saiu.');
    navigate('/login');
  }

  return (
    <div className="app">
      <header className="app__header">
        <h2 className="app__title">Cadastro de Clientes</h2>

        {isAuthenticated && (
          <nav className="app__nav">
            <NavLink to="/cadastro" className={({ isActive }) => (isActive ? 'active' : '')}>
              Novo cliente
            </NavLink>
            <NavLink to="/clientes" className={({ isActive }) => (isActive ? 'active' : '')}>
              Listagem
            </NavLink>

            <span className="app__user">{user?.name}</span>
            <button type="button" className="btn btn--secondary" onClick={handleLogout}>
              Sair
            </button>
          </nav>
        )}
      </header>

      <main className="app__content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/cadastro" replace />} />
            <Route path="/cadastro" element={<CadastroPage />} />
            <Route path="/clientes" element={<ListagemPage />} />
            <Route path="/clientes/:id/editar" element={<EditarClientePage />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;

import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { CadastroPage } from './pages/CadastroPage';
import { EditarClientePage } from './pages/EditarClientePage';
import { ListagemPage } from './pages/ListagemPage';

function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h2 className="app__title">Cadastro de Clientes</h2>
        <nav className="app__nav">
          <NavLink to="/cadastro" className={({ isActive }) => (isActive ? 'active' : '')}>
            Novo cliente
          </NavLink>
          <NavLink to="/clientes" className={({ isActive }) => (isActive ? 'active' : '')}>
            Listagem
          </NavLink>
        </nav>
      </header>

      <main className="app__content">
        <Routes>
          <Route path="/" element={<Navigate to="/cadastro" replace />} />
          <Route path="/cadastro" element={<CadastroPage />} />
          <Route path="/clientes" element={<ListagemPage />} />
          <Route path="/clientes/:id/editar" element={<EditarClientePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

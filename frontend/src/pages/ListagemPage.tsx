import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClienteList } from '../components/ClienteList/ClienteList';
import { useToast } from '../components/Toast/ToastContext';
import { listarClientes, removerCliente } from '../services/clienteService';
import { extractErrorMessage } from '../services/errors';
import type { Cliente } from '../types/Cliente';
import type { PaginatedResponse } from '../types/Pagination';

export function ListagemPage() {
  const [pagina, setPagina] = useState<PaginatedResponse<Cliente> | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [idExcluindo, setIdExcluindo] = useState<number | null>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const carregar = useCallback((page = 1) => {
    setLoading(true);
    setErro(null);

    listarClientes(page)
      .then(setPagina)
      .catch((err) => setErro(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function handleEditar(cliente: Cliente) {
    navigate(`/clientes/${cliente.id}/editar`, { state: { cliente } });
  }

  async function handleExcluir(cliente: Cliente) {
    const confirmado = window.confirm(`Remover o cliente "${cliente.nome}"?`);

    if (!confirmado) {
      return;
    }

    setIdExcluindo(cliente.id);

    try {
      await removerCliente(cliente.id);
      showToast('success', `Cliente "${cliente.nome}" removido.`);
      carregar(pagina?.meta.current_page);
    } catch (err) {
      showToast('error', extractErrorMessage(err));
    } finally {
      setIdExcluindo(null);
    }
  }

  return (
    <section className="page">
      <h1>Clientes cadastrados</h1>

      {loading && <p>Carregando...</p>}
      {erro && <p className="page__erro">{erro}</p>}

      {!loading && !erro && pagina && (
        <>
          <ClienteList
            clientes={pagina.data}
            onEditar={handleEditar}
            onExcluir={handleExcluir}
            idExcluindo={idExcluindo}
          />

          {pagina.meta.last_page > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="btn btn--secondary"
                disabled={pagina.meta.current_page <= 1}
                onClick={() => carregar(pagina.meta.current_page - 1)}
              >
                Anterior
              </button>
              <span>
                Pagina {pagina.meta.current_page} de {pagina.meta.last_page}
              </span>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={pagina.meta.current_page >= pagina.meta.last_page}
                onClick={() => carregar(pagina.meta.current_page + 1)}
              >
                Proxima
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

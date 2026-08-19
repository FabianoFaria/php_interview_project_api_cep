import { useLocation, useNavigate } from 'react-router-dom';
import { ClienteForm } from '../components/ClienteForm/ClienteForm';
import { atualizarCliente } from '../services/clienteService';
import type { Cliente, ClientePayload } from '../types/Cliente';

export function EditarClientePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const cliente = (location.state as { cliente?: Cliente } | null)?.cliente;

  if (!cliente) {
    return (
      <section className="page">
        <p>
          Nao encontramos os dados do cliente para editar.{' '}
          <button type="button" className="btn-link" onClick={() => navigate('/clientes')}>
            Voltar para a listagem
          </button>
        </p>
      </section>
    );
  }

  const clienteId = cliente.id;

  function salvar(payload: ClientePayload) {
    return atualizarCliente(clienteId, payload);
  }

  return (
    <section className="page">
      <h1>Editar cliente</h1>
      <ClienteForm
        clienteInicial={cliente}
        submitLabel="Salvar alteracoes"
        onSalvar={salvar}
        onSucesso={() => navigate('/clientes')}
      />
    </section>
  );
}

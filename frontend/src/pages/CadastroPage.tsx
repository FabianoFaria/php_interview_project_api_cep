import { ClienteForm } from '../components/ClienteForm/ClienteForm';
import { criarCliente } from '../services/clienteService';

export function CadastroPage() {
  return (
    <section className="page">
      <h1>Cadastro de cliente</h1>
      <ClienteForm submitLabel="Cadastrar" onSalvar={criarCliente} />
    </section>
  );
}

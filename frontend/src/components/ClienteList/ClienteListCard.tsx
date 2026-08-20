import type { Cliente } from '../../types/Cliente';

interface ClienteListCardProps {
  cliente: Cliente;
  onEditar: (cliente: Cliente) => void;
  onExcluir: (cliente: Cliente) => void;
  excluindo: boolean;
}

export function ClienteListCard({ cliente, onEditar, onExcluir, excluindo }: ClienteListCardProps) {
  return (
    <li className="cliente-card">
      <div className="cliente-card__header">
        <p className="cliente-card__nome">{cliente.nome}</p>
        <p className="cliente-card__email">{cliente.email}</p>
      </div>

      <dl className="cliente-card__detalhes">
        <div className="cliente-card__campo">
          <dt>Endereco</dt>
          <dd>
            {cliente.logradouro}, {cliente.numero}
            {cliente.complemento ? ` - ${cliente.complemento}` : ''}
          </dd>
        </div>
        <div className="cliente-card__campo">
          <dt>Bairro</dt>
          <dd>{cliente.bairro}</dd>
        </div>
        <div className="cliente-card__campo">
          <dt>CEP / Cidade</dt>
          <dd>
            {cliente.cep} - {cliente.cidade}/{cliente.uf}
          </dd>
        </div>
      </dl>

      <div className="cliente-card__actions">
        <button type="button" className="btn btn--secondary" onClick={() => onEditar(cliente)}>
          Editar
        </button>
        <button
          type="button"
          className="btn btn--danger"
          onClick={() => onExcluir(cliente)}
          disabled={excluindo}
        >
          {excluindo ? 'Excluindo...' : 'Excluir'}
        </button>
      </div>
    </li>
  );
}

import type { Cliente } from '../../types/Cliente';

interface ClienteListItemProps {
  cliente: Cliente;
  onEditar: (cliente: Cliente) => void;
  onExcluir: (cliente: Cliente) => void;
  excluindo: boolean;
}

export function ClienteListItem({ cliente, onEditar, onExcluir, excluindo }: ClienteListItemProps) {
  return (
    <tr>
      <td>{cliente.nome}</td>
      <td>{cliente.email}</td>
      <td>{cliente.cep}</td>
      <td>
        {cliente.logradouro}, {cliente.numero}
        {cliente.complemento ? ` - ${cliente.complemento}` : ''}
      </td>
      <td>{cliente.bairro}</td>
      <td>
        {cliente.cidade}/{cliente.uf}
      </td>
      <td className="cliente-list__actions">
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
      </td>
    </tr>
  );
}

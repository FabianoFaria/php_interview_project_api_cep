import type { Cliente } from '../../types/Cliente';

interface ClienteListItemProps {
  cliente: Cliente;
  onEditar: (cliente: Cliente) => void;
  onExcluir: (cliente: Cliente) => void;
  excluindo: boolean;
}

export function ClienteListItem({ cliente, onEditar, onExcluir, excluindo }: ClienteListItemProps) {
  const endereco = `${cliente.logradouro}, ${cliente.numero}${
    cliente.complemento ? ` - ${cliente.complemento}` : ''
  }`;
  const cidadeUf = `${cliente.cidade}/${cliente.uf}`;

  return (
    <tr>
      <td className="truncate" title={cliente.nome}>{cliente.nome}</td>
      <td className="truncate" title={cliente.email}>{cliente.email}</td>
      <td>{cliente.cep}</td>
      <td className="truncate" title={endereco}>{endereco}</td>
      <td className="truncate" title={cliente.bairro}>{cliente.bairro}</td>
      <td className="truncate" title={cidadeUf}>{cidadeUf}</td>
      <td>
        <div className="cliente-list__actions">
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
      </td>
    </tr>
  );
}

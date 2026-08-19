import type { Cliente } from '../../types/Cliente';
import { ClienteListItem } from './ClienteListItem';

interface ClienteListProps {
  clientes: Cliente[];
  onEditar: (cliente: Cliente) => void;
  onExcluir: (cliente: Cliente) => void;
  idExcluindo: number | null;
}

export function ClienteList({ clientes, onEditar, onExcluir, idExcluindo }: ClienteListProps) {
  if (clientes.length === 0) {
    return <p className="cliente-list__vazio">Nenhum cliente cadastrado ainda.</p>;
  }

  return (
    <div className="cliente-list">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>CEP</th>
            <th>Endereco</th>
            <th>Bairro</th>
            <th>Cidade/UF</th>
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente) => (
            <ClienteListItem
              key={cliente.id}
              cliente={cliente}
              onEditar={onEditar}
              onExcluir={onExcluir}
              excluindo={idExcluindo === cliente.id}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

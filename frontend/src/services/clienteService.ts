import api from './api';
import type { Cliente, ClientePayload } from '../types/Cliente';
import type { PaginatedResponse } from '../types/Pagination';

export async function listarClientes(page = 1): Promise<PaginatedResponse<Cliente>> {
  const { data } = await api.get<PaginatedResponse<Cliente>>('/clientes', {
    params: { page },
  });

  return data;
}

export async function criarCliente(payload: ClientePayload): Promise<Cliente> {
  const { data } = await api.post<{ data: Cliente }>('/clientes', payload);

  return data.data;
}

export async function atualizarCliente(id: number, payload: ClientePayload): Promise<Cliente> {
  const { data } = await api.put<{ data: Cliente }>(`/clientes/${id}`, payload);

  return data.data;
}

export async function removerCliente(id: number): Promise<void> {
  await api.delete(`/clientes/${id}`);
}

import api from './api';
import type { EnderecoCep } from '../types/EnderecoCep';

export async function buscarCep(cep: string): Promise<EnderecoCep> {
  const cepLimpo = cep.replace(/\D/g, '');
  const { data } = await api.get<EnderecoCep>(`/cep/${cepLimpo}`);

  return data;
}

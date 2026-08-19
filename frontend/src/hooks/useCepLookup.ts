import { useEffect, useState } from 'react';
import { buscarCep } from '../services/cepService';
import { extractErrorMessage } from '../services/errors';
import type { EnderecoCep } from '../types/EnderecoCep';

const CEP_VALIDO = /^\d{5}-?\d{3}$/;
const DEBOUNCE_MS = 500;

interface UseCepLookupResult {
  loading: boolean;
  error: string | null;
  endereco: EnderecoCep | null;
}

/**
 * Observa um valor de CEP e dispara a busca automaticamente (com debounce)
 * assim que o formato estiver completo. O componente decide o que fazer
 * com `endereco` quando ele muda (ex.: preencher os demais campos).
 */
export function useCepLookup(cep: string): UseCepLookupResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endereco, setEndereco] = useState<EnderecoCep | null>(null);

  useEffect(() => {
    const cepLimpo = cep.trim();

    if (!CEP_VALIDO.test(cepLimpo)) {
      setError(null);
      return;
    }

    let cancelado = false;
    const timeoutId = window.setTimeout(() => {
      setLoading(true);
      setError(null);

      buscarCep(cepLimpo)
        .then((data) => {
          if (!cancelado) {
            setEndereco(data);
          }
        })
        .catch((err) => {
          if (!cancelado) {
            setEndereco(null);
            setError(extractErrorMessage(err));
          }
        })
        .finally(() => {
          if (!cancelado) {
            setLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelado = true;
      window.clearTimeout(timeoutId);
    };
  }, [cep]);

  return { loading, error, endereco };
}

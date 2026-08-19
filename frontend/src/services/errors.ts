import axios from 'axios';

export interface ApiErrorBody {
  message: string;
  errors?: Record<string, string[]>;
}

const MENSAGEM_PADRAO = 'Ocorreu um erro inesperado. Tente novamente.';

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;

    return body?.message ?? MENSAGEM_PADRAO;
  }

  return MENSAGEM_PADRAO;
}

export function extractFieldErrors(error: unknown): Record<string, string> {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;

    if (!body?.errors) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(body.errors).map(([field, messages]) => [field, messages[0]])
    );
  }

  return {};
}

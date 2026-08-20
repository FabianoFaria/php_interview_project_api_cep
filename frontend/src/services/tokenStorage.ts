const TOKEN_KEY = 'auth_token';

// Token guardado em localStorage: e vulneravel a XSS (qualquer script
// injetado na pagina consegue le-lo), mas e uma troca aceitavel para o
// escopo deste projeto, que usa Bearer token (nao cookies) exatamente para
// evitar a complexidade de CORS+credentials entre localhost:5173 e
// localhost:8000. Em producao real, a alternativa mais segura seria um
// cookie httpOnly emitido pelo backend.
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

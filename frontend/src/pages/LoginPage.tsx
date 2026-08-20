import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FormField } from '../components/FormField';
import { useToast } from '../components/Toast/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { extractErrorMessage, extractFieldErrors } from '../services/errors';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setSubmitting(true);

    try {
      await login({ email, password });
      navigate('/clientes');
    } catch (error) {
      setFieldErrors(extractFieldErrors(error));
      showToast('error', extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page page--auth">
      <h1>Entrar</h1>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormField
          label="E-mail"
          name="email"
          type="email"
          value={email}
          onChange={setEmail}
          error={fieldErrors.email}
          autoComplete="email"
          required
        />
        <FormField
          label="Senha"
          name="password"
          type="password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
          autoComplete="current-password"
          required
        />

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="auth-form__switch">
        Ainda nao tem conta? <Link to="/registro">Cadastre-se</Link>
      </p>
    </section>
  );
}

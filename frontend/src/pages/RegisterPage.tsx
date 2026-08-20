import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FormField } from '../components/FormField';
import { useToast } from '../components/Toast/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { extractErrorMessage, extractFieldErrors } from '../services/errors';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setSubmitting(true);

    try {
      await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      showToast('success', `Bem-vindo(a), ${name}!`);
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
      <h1>Criar conta</h1>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormField label="Nome" name="name" value={name} onChange={setName} error={fieldErrors.name} required />
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
          autoComplete="new-password"
          required
        />
        <FormField
          label="Confirmar senha"
          name="password_confirmation"
          type="password"
          value={passwordConfirmation}
          onChange={setPasswordConfirmation}
          autoComplete="new-password"
          required
        />

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>

      <p className="auth-form__switch">
        Ja tem conta? <Link to="/login">Entrar</Link>
      </p>
    </section>
  );
}

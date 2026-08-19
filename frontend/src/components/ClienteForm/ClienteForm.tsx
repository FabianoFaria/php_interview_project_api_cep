import { useEffect, useState, type FormEvent } from 'react';
import { FormField } from '../FormField';
import { useCepLookup } from '../../hooks/useCepLookup';
import { useToast } from '../Toast/ToastContext';
import { extractErrorMessage, extractFieldErrors } from '../../services/errors';
import type { Cliente, ClientePayload } from '../../types/Cliente';

const CAMPOS_VAZIOS: ClientePayload = {
  nome: '',
  email: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
};

function paraPayload(cliente?: Cliente): ClientePayload {
  if (!cliente) {
    return CAMPOS_VAZIOS;
  }

  return {
    nome: cliente.nome,
    email: cliente.email,
    cep: cliente.cep,
    logradouro: cliente.logradouro,
    numero: cliente.numero,
    complemento: cliente.complemento ?? '',
    bairro: cliente.bairro,
    cidade: cliente.cidade,
    uf: cliente.uf,
  };
}

interface ClienteFormProps {
  clienteInicial?: Cliente;
  onSalvar: (payload: ClientePayload) => Promise<Cliente>;
  onSucesso?: (cliente: Cliente) => void;
  submitLabel: string;
}

export function ClienteForm({ clienteInicial, onSalvar, onSucesso, submitLabel }: ClienteFormProps) {
  const [form, setForm] = useState<ClientePayload>(() => paraPayload(clienteInicial));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { loading: cepLoading, error: cepError, endereco } = useCepLookup(form.cep);
  const { showToast } = useToast();

  useEffect(() => {
    if (!endereco) {
      return;
    }

    setForm((atual) => ({
      ...atual,
      cep: endereco.cep,
      logradouro: endereco.logradouro,
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      uf: endereco.uf,
    }));
  }, [endereco]);

  function setCampo<K extends keyof ClientePayload>(campo: K, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setSubmitting(true);

    try {
      const cliente = await onSalvar(form);
      showToast('success', `Cliente "${cliente.nome}" salvo com sucesso.`);

      if (!clienteInicial) {
        setForm(CAMPOS_VAZIOS);
      }

      onSucesso?.(cliente);
    } catch (error) {
      setFieldErrors(extractFieldErrors(error));
      showToast('error', extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="cliente-form" onSubmit={handleSubmit} noValidate>
      <div className="cliente-form__grid">
        <FormField
          label="Nome"
          name="nome"
          value={form.nome}
          onChange={(v) => setCampo('nome', v)}
          error={fieldErrors.nome}
          required
        />
        <FormField
          label="E-mail"
          name="email"
          value={form.email}
          onChange={(v) => setCampo('email', v)}
          error={fieldErrors.email}
          required
        />

        <div className="form-field">
          <label htmlFor="cep">
            CEP <span className="form-field__required">*</span>
            {cepLoading && <span className="form-field__hint"> buscando endereco...</span>}
          </label>
          <input
            id="cep"
            name="cep"
            value={form.cep}
            onChange={(event) => setCampo('cep', event.target.value)}
            placeholder="00000-000"
            maxLength={9}
            className={fieldErrors.cep || cepError ? 'has-error' : ''}
          />
          {(fieldErrors.cep || cepError) && (
            <span className="form-field__error">{fieldErrors.cep ?? cepError}</span>
          )}
        </div>

        <FormField
          label="Logradouro"
          name="logradouro"
          value={form.logradouro}
          onChange={(v) => setCampo('logradouro', v)}
          error={fieldErrors.logradouro}
          required
        />
        <FormField
          label="Numero"
          name="numero"
          value={form.numero}
          onChange={(v) => setCampo('numero', v)}
          error={fieldErrors.numero}
          required
        />
        <FormField
          label="Complemento"
          name="complemento"
          value={form.complemento}
          onChange={(v) => setCampo('complemento', v)}
          error={fieldErrors.complemento}
        />
        <FormField
          label="Bairro"
          name="bairro"
          value={form.bairro}
          onChange={(v) => setCampo('bairro', v)}
          error={fieldErrors.bairro}
          required
        />
        <FormField
          label="Cidade"
          name="cidade"
          value={form.cidade}
          onChange={(v) => setCampo('cidade', v)}
          error={fieldErrors.cidade}
          required
        />
        <FormField
          label="UF"
          name="uf"
          value={form.uf}
          onChange={(v) => setCampo('uf', v.toUpperCase())}
          error={fieldErrors.uf}
          required
          maxLength={2}
        />
      </div>

      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {submitting ? 'Salvando...' : submitLabel}
      </button>
    </form>
  );
}

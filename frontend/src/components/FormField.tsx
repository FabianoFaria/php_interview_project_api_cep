interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  autoComplete?: string;
  type?: string;
}

export function FormField({
  label,
  name,
  value,
  onChange,
  error,
  required,
  disabled,
  placeholder,
  maxLength,
  autoComplete,
  type = 'text',
}: FormFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={name}>
        {label}
        {required && <span className="form-field__required"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={autoComplete}
        className={error ? 'has-error' : ''}
      />
      {error && <span className="form-field__error">{error}</span>}
    </div>
  );
}

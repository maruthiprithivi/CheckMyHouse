export default function Input({
  type = 'text',
  value,
  onChange,
  placeholder = '',
  className = '',
  disabled = false,
  error = false,
  ...props
}) {
  const errorClass = error ? 'border-destructive focus:ring-destructive' : '';

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`flex h-11 w-full rounded-lg border-2 border-input bg-background px-4 py-2 text-sm ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50 ${errorClass} ${className}`}
      {...props}
    />
  );
}

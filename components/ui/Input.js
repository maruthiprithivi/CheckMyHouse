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
  const errorClass = error
    ? 'border-destructive focus:shadow-[0_0_10px_hsl(var(--destructive)/0.5)]'
    : 'focus:border-primary focus:shadow-glow';

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`flex h-11 w-full rounded-sm border border-white/20 bg-black/50 backdrop-blur-sm px-4 py-2 text-sm font-mono placeholder:text-muted-foreground/50 transition-all duration-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 text-white hover:border-white/40 ${errorClass} ${className}`}
      {...props}
    />
  );
}

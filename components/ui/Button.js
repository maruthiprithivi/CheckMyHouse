export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary-hover hover:shadow-lg hover:scale-[1.02] focus:ring-primary active:scale-[0.98]',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:shadow-md focus:ring-secondary active:scale-[0.98]',
    accent: 'bg-accent text-accent-foreground hover:bg-accent/90 hover:shadow-md focus:ring-accent active:scale-[0.98]',
    success: 'bg-success text-success-foreground hover:bg-success/90 hover:shadow-md focus:ring-success active:scale-[0.98]',
    outline: 'border-2 border-primary/20 bg-background hover:bg-primary/5 hover:border-primary/40 hover:shadow-sm focus:ring-primary text-foreground active:scale-[0.98]',
    ghost: 'hover:bg-accent/50 hover:text-accent-foreground focus:ring-primary text-muted-foreground hover:text-foreground active:scale-[0.98]',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg focus:ring-destructive active:scale-[0.98]',
    gradient: 'gradient-primary text-white hover:shadow-colored hover:scale-[1.02] focus:ring-primary active:scale-[0.98]',
  };

  const sizes = {
    xs: 'h-7 px-2.5 text-xs',
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-6 text-base',
    xl: 'h-14 px-8 text-lg',
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}

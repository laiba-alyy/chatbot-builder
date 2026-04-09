import './Button.css';

function Button({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  disabled = false,
  fullWidth = false,
  size = 'medium',        // New: small, medium, large
  icon,                    // New: for icons
  loading = false,         // New: loading state
  className = '',          // New: custom classes
  style = {}              // New: inline styles
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full-width' : ''} ${className}`}
      style={style}
    >
      {loading && <span className="btn-spinner"></span>}
      {icon && !loading && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
}

export default Button;
import './Card.css';

function Card({ 
  children, 
  title, 
  subtitle,
  footer,
  hover = true,
  padding = 'medium',
  shadow = true,
  bordered = false,
  className = '',
  style = {},
  onClick,
  animated = false,
  gradient = false,
  glass = false,
  'data-aos': dataAos,
  'data-aos-delay': dataAosDelay
}) {

  return (
    <div 
      className={`
        card 
        ${hover ? 'card-hover' : ''} 
        card-padding-${padding} 
        ${shadow ? 'card-shadow' : ''} 
        ${bordered ? 'card-bordered' : ''} 
        ${onClick ? 'card-clickable' : ''}
        ${gradient ? 'card-gradient' : ''}
        ${glass ? 'card-glass' : ''}
        ${animated ? 'card-animated' : ''}
        ${className}
      `}
      style={style}
      onClick={onClick}
      data-aos={dataAos}
      data-aos-delay={dataAosDelay}
    >

      {/* Card Header */}
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}

      {/* Card Body */}
      <div className="card-body">
        {children}
      </div>

      {/* Card Footer */}
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}

    </div>
  );
}

export default Card;

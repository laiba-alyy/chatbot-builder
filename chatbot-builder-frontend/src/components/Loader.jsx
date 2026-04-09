import './Loader.css';

function Loader({ size = 'medium', fullPage = false, message = '' }) {
  const loaderContent = (
    <div className={`loader-wrapper ${size}`}>
      <div className="loader-dots">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      {message && <p className="loader-message">{message}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="loader-fullpage">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
}

export default Loader;
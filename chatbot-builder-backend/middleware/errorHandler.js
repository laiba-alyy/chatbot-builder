module.exports = (err, req, res, next) => {
  console.error('FULL ERROR STACK:', err.stack);
  
  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Server Error';

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    message = `Duplicate field value: ${field} = "${value}". Please use another value.`;
    status = 400;
  }

  // ✅ Temporarily include stack in response to debug
  res.status(status).json({ 
    success: false, 
    message,
    stack: err.stack  // ← add this temporarily
  });
};
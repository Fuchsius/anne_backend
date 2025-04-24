// Simple error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  console.error(`Path: ${req.path}`);
  console.error(`Method: ${req.method}`);
  
  // Don't expose error details in production
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'Server error' 
      : err.message
  });
};

module.exports = { errorHandler }; 
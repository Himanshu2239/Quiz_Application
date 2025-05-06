// Simple health check endpoint
module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Health check passed',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
};
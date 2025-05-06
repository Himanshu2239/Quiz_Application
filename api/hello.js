// Simple test API endpoint for Vercel
module.exports = (req, res) => {
  res.status(200).json({ message: 'Hello, Vercel!' });
};
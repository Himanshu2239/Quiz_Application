// Simple version endpoint
module.exports = (req, res) => {
  res.status(200).json({
    name: 'CS Assessment System',
    version: '1.0.0',
    api: true
  });
};
module.exports = (req, res) => {
  const { name = 'World' } = req.query;
  
  res.status(200).json({
    message: `Hello ${name}!`,
    timestamp: new Date().toISOString()
  });
};

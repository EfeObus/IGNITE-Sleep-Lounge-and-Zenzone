const jwt = require('jsonwebtoken');
const config = require('../config/config');

// Generate JWT token
const generateToken = (payload) => {
  const id = typeof payload === 'object' ? payload.id : payload;
  
  if (!id) {
    throw new Error('Token payload must contain an id');
  }
  
  // If payload is just the ID as string/uuid, convert to object
  const tokenPayload = typeof payload === 'object' ? payload : { id };
  
  return jwt.sign(tokenPayload, config.jwtSecret, {
    expiresIn: config.jwtExpire
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken
};
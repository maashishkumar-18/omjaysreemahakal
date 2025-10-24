const jwt = require('jsonwebtoken');

module.exports = {
  jwtConfig: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRE || '30d',
    issuer: 'money-lending-app',
    audience: 'money-lending-app-users'
  },
  
  passwordConfig: {
    minLength: 6,
    saltRounds: 12
  },
  
  generateToken: (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '30d',
      issuer: 'money-lending-app',
      audience: 'money-lending-app-users'
    });
  },
  
  verifyToken: (token) => {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'money-lending-app',
      audience: 'money-lending-app-users'
    });
  }
};
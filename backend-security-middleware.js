// NNIT - Basic Security Middleware
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

module.exports = (app) => {
  app.use(cors());
  app.use(helmet());
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }));
};

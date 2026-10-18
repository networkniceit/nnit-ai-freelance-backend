// NNIT - Basic Security Middleware
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

module.exports = (app) => {
  app.use(cors());
  // NNIT_CSP_HASH_V1: allow only the exact script in the served index.html.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const hashes = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(m => "'sha256-" + require('node:crypto').createHash('sha256')
      .update(m[1].replace(/\r\n?/g, '\n')).digest('base64') + "'");
  app.use(helmet({ contentSecurityPolicy: { directives: {
    scriptSrc: ["'self'", ...hashes],
    scriptSrcAttr: ["'none'"]
  } } }));
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    standardHeaders: true,
    legacyHeaders: false,
  }));
};

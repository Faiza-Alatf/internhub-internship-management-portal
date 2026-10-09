// Loads and validates environment variables in one place
require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((u) => u.trim()),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  jwtRememberExpiresIn: '7d',
  db: {
    server: process.env.DB_SERVER || 'localhost',
    instance: process.env.DB_INSTANCE || '',
    port: Number(process.env.DB_PORT) || 1433,
    database: process.env.DB_DATABASE || 'InternshipManagementDB',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT !== 'false',
  },
};

if (!env.jwtSecret || env.jwtSecret.length < 16) {
  console.error('\n[config] JWT_SECRET is missing or too short (min 16 chars). Create server/.env from .env.example\n');
  process.exit(1);
}

module.exports = env;

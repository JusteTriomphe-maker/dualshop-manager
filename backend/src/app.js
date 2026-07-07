require('dotenv').config();
const express = require('express');
const cors = require('cors');
const os = require('os');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const boutiquesRoutes = require('./routes/boutiques.routes');
const produitsRoutes = require('./routes/produits.routes');
const ventesRoutes = require('./routes/ventes.routes');
const stockRoutes = require('./routes/stock.routes');
const rapportsRoutes = require('./routes/rapports.routes');
const clientsRoutes = require('./routes/clients.routes');
const fournisseursRoutes = require('./routes/fournisseurs.routes');
const dettesRoutes = require('./routes/dettes.routes');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors({
  origin: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(','),
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

function sendPing(req, res) {
  res.json({ ok: true, message: 'DualShop API OK', timestamp: new Date().toISOString() });
}

app.get('/api/ping', sendPing);
app.get('/api/v1/ping', sendPing);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/boutiques', boutiquesRoutes);
app.use('/api/v1/produits', produitsRoutes);
app.use('/api/v1/ventes', ventesRoutes);
app.use('/api/v1/stock', stockRoutes);
app.use('/api/v1/rapports', rapportsRoutes);
app.use('/api/v1/clients', clientsRoutes);
app.use('/api/v1/fournisseurs', fournisseursRoutes);
app.use('/api/v1/dettes', dettesRoutes);

app.use(express.static(path.join(__dirname, '..', '..', 'public')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Validation echouee', details: err.errors });
  }
  res.status(500).json({ error: err.message || 'Erreur interne' });
});

function getLanUrls(port) {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((iface) => iface && iface.family === 'IPv4' && !iface.internal)
    .map((iface) => `http://${iface.address}:${port}`);
}

app.listen(PORT, HOST, () => {
  console.log(`DualShop API demarree sur http://localhost:${PORT}`);
  if (HOST === '0.0.0.0' || HOST === '::') {
    const lanUrls = getLanUrls(PORT);
    if (lanUrls.length > 0) {
      console.log(`Adresse pour telephone physique: ${lanUrls.join(', ')}`);
    }
  }
});

module.exports = app;

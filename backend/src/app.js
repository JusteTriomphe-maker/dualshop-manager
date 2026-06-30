require('dotenv').config();
const express = require('express');
const cors = require('cors');
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

app.use(cors({
  origin: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(','),
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/ping', (req, res) => {
  res.json({ ok: true, message: 'DualShop API OK', timestamp: new Date().toISOString() });
});

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
    return res.status(400).json({ error: 'Validation échouée', details: err.errors });
  }
  res.status(500).json({ error: err.message || 'Erreur interne' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`DualShop API démarrée sur http://localhost:${PORT}`);
});

module.exports = app;

const prisma = require('../prismaClient');
const { z } = require('zod');

const createSchema = z.object({
  nom: z.string().min(1),
  code: z.string().optional(),
  prix: z.number().positive(),
  coutAchat: z.number().optional(),
  stockActuel: z.number().int().min(0).default(0),
  stockMin: z.number().int().min(0).default(5),
  categorie: z.string().optional(),
  boutiqueId: z.string(),
});

async function list(req, res) {
  const { boutiqueId, categorie, search, inclusInactifs } = req.query;
  const where = {};
  if (inclusInactifs !== 'true') where.actif = true;
  if (boutiqueId) where.boutiqueId = boutiqueId;
  if (categorie) where.categorie = categorie;
  if (search) where.nom = { contains: search };
  const produits = await prisma.produit.findMany({ where, orderBy: { nom: 'asc' } });
  res.json(produits);
}

async function create(req, res) {
  const data = createSchema.parse(req.body);
  const produit = await prisma.produit.create({ data });
  res.status(201).json(produit);
}

async function update(req, res) {
  const { id } = req.params;
  const { nom, code, prix, coutAchat, stockActuel, stockMin, categorie, actif } = req.body;
  const data = {};
  if (nom !== undefined) data.nom = nom;
  if (code !== undefined) data.code = code;
  if (prix !== undefined) data.prix = prix;
  if (coutAchat !== undefined) data.coutAchat = coutAchat;
  if (stockActuel !== undefined) data.stockActuel = stockActuel;
  if (stockMin !== undefined) data.stockMin = stockMin;
  if (categorie !== undefined) data.categorie = categorie;
  if (actif !== undefined) data.actif = actif;
  const produit = await prisma.produit.update({ where: { id }, data });
  res.json(produit);
}

async function remove(req, res) {
  const { id } = req.params;
  try {
    await prisma.produit.delete({ where: { id } });
    res.json({ ok: true, hardDelete: true, message: 'Produit supprimé définitivement' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Produit introuvable' });
    await prisma.produit.update({ where: { id }, data: { actif: false } });
    res.json({ ok: true, hardDelete: false, message: 'Impossible de supprimer : ce produit a déjà été vendu. Il a été archivé.' });
  }
}

async function alertes(req, res) {
  let { boutiqueId } = req.query;
  if (req.user.role === 'CAISSIER') {
    boutiqueId = req.user.boutiqueId;
  }
  const where = { actif: true };
  if (boutiqueId) where.boutiqueId = boutiqueId;

  const activeProducts = await prisma.produit.findMany({
    where,
    orderBy: { stockActuel: 'asc' },
  });

  const stockBas = activeProducts.filter(p => p.stockActuel <= 0);
  const stockAlerte = activeProducts.filter(p => p.stockActuel > 0 && p.stockActuel <= p.stockMin);

  res.json({ rupture: stockBas, alerte: stockAlerte });
}

module.exports = { list, create, update, remove, alertes };

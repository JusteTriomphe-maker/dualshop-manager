const prisma = require('../prismaClient');

async function caJournalier(req, res) {
  const { date, boutiqueId } = req.query;
  const d = date ? new Date(date) : new Date();
  const next = new Date(d);
  next.setDate(next.getDate() + 1);
  const where = { createdAt: { gte: d, lt: next }, statut: 'COMPLETEE' };
  if (boutiqueId) where.boutiqueId = boutiqueId;

  const [aggregation, ventes] = await Promise.all([
    prisma.vente.aggregate({ where, _sum: { total: true }, _count: true }),
    prisma.vente.findMany({ where, select: { id: true, numero: true, total: true, modePaiement: true, createdAt: true } }),
  ]);

  res.json({
    date: d.toISOString().split('T')[0],
    ca: aggregation._sum.total || 0,
    nbVentes: aggregation._count,
    ventes,
  });
}

async function caPeriode(req, res) {
  const { debut, fin, boutiqueId } = req.query;
  const where = { statut: 'COMPLETEE' };
  if (debut) where.createdAt = { ...where.createdAt, gte: new Date(debut) };
  if (fin) where.createdAt = { ...where.createdAt, lte: new Date(fin) };
  if (boutiqueId) where.boutiqueId = boutiqueId;

  const [aggregation, ventes] = await Promise.all([
    prisma.vente.aggregate({
      where,
      _sum: { total: true },
      _count: true,
    }),
    prisma.vente.findMany({
      where,
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const grouped = ventes.reduce((acc, vente) => {
    const jour = vente.createdAt.toISOString().split('T')[0];
    if (!acc[jour]) acc[jour] = { jour, ca: 0, nb: 0 };
    acc[jour].ca += vente.total;
    acc[jour].nb += 1;
    return acc;
  }, {});

  res.json({
    periode: { debut, fin },
    ca: aggregation._sum.total || 0,
    nbVentes: aggregation._count,
    parJour: Object.values(grouped),
  });
}

async function topProduits(req, res) {
  const { boutiqueId, periode } = req.query;
  const where = {};
  if (boutiqueId) where.boutiqueId = boutiqueId;
  if (periode === '7j') {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    where.createdAt = { gte: d };
  } else if (periode === '30j') {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    where.createdAt = { gte: d };
  }

  const lignes = await prisma.ligneVente.groupBy({
    by: ['produitId'],
    where: { vente: where },
    _sum: { quantite: true, sousTotal: true },
    orderBy: { _sum: { quantite: 'desc' } },
    take: 20,
  });

  const produits = await prisma.produit.findMany({
    where: { id: { in: lignes.map(l => l.produitId) } },
    select: { id: true, nom: true },
  });
  const map = new Map(produits.map(p => [p.id, p.nom]));

  res.json(lignes.map(l => ({
    produitId: l.produitId,
    nom: map.get(l.produitId) || 'Inconnu',
    quantiteVendue: l._sum.quantite,
    totalVente: l._sum.sousTotal,
  })));
}

async function inventaire(req, res) {
  const { boutiqueId } = req.query;
  const where = { actif: true };
  if (boutiqueId) where.boutiqueId = boutiqueId;
  const produits = await prisma.produit.findMany({
    where,
    orderBy: { nom: 'asc' },
    select: {
      id: true, nom: true, code: true, prix: true, coutAchat: true,
      stockActuel: true, stockMin: true, categorie: true, boutiqueId: true,
    },
  });
  const valeurStock = produits.reduce((sum, p) => sum + (p.stockActuel * (p.coutAchat || 0)), 0);
  const valeurVente = produits.reduce((sum, p) => sum + (p.stockActuel * p.prix), 0);
  res.json({ produits, valeurStock, valeurVente });
}

module.exports = { caJournalier, caPeriode, topProduits, inventaire };

const prisma = require('../prismaClient');

async function list(req, res) {
  const boutiques = await prisma.boutique.findMany({
    include: { _count: { select: { produits: true, ventes: true } } },
  });
  res.json(boutiques);
}

async function stats(req, res) {
  const { id } = req.params;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [caDay, caWeek, caMonth] = await Promise.all([
    prisma.vente.aggregate({ where: { boutiqueId: id, createdAt: { gte: startOfDay }, statut: 'COMPLETEE' }, _sum: { total: true }, _count: true }),
    prisma.vente.aggregate({ where: { boutiqueId: id, createdAt: { gte: startOfWeek }, statut: 'COMPLETEE' }, _sum: { total: true }, _count: true }),
    prisma.vente.aggregate({ where: { boutiqueId: id, createdAt: { gte: startOfMonth }, statut: 'COMPLETEE' }, _sum: { total: true }, _count: true }),
  ]);

  res.json({
    jour: { ca: caDay._sum.total || 0, ventes: caDay._count },
    semaine: { ca: caWeek._sum.total || 0, ventes: caWeek._count },
    mois: { ca: caMonth._sum.total || 0, ventes: caMonth._count },
  });
}

module.exports = { list, stats };

const prisma = require('../prismaClient');
const { z } = require('zod');

const mouvementSchema = z.object({
  produitId: z.string(),
  quantite: z.number().int().positive(),
  raison: z.string().optional(),
  type: z.enum(['ENTREE', 'SORTIE', 'AJUSTEMENT', 'PERTE']),
});

async function mouvements(req, res) {
  const { boutiqueId, produitId, type } = req.query;
  const where = {};
  if (boutiqueId) where.produit = { boutiqueId };
  if (produitId) where.produitId = produitId;
  if (type) where.type = type;
  const rows = await prisma.mouvementStock.findMany({
    where,
    include: { produit: { select: { nom: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  res.json(rows);
}

async function entree(req, res) {
  const data = mouvementSchema.parse(req.body);
  const result = await prisma.$transaction(async (tx) => {
    const produit = await tx.produit.update({
      where: { id: data.produitId },
      data: { stockActuel: { increment: data.quantite } },
    });
    const mvt = await tx.mouvementStock.create({
      data: {
        produitId: data.produitId,
        type: 'ENTREE',
        quantite: data.quantite,
        raison: data.raison || 'Réapprovisionnement',
        userId: req.user.userId,
      },
    });
    return { produit, mouvement: mvt };
  });
  res.status(201).json(result);
}

async function ajustement(req, res) {
  const { produitId, nouvelleQuantite, raison } = req.body;
  if (!produitId || nouvelleQuantite === undefined) {
    return res.status(400).json({ error: 'produitId et nouvelleQuantite requis' });
  }
  const produit = await prisma.produit.findUnique({ where: { id: produitId } });
  if (!produit) return res.status(404).json({ error: 'Produit introuvable' });
  const diff = nouvelleQuantite - produit.stockActuel;
  const result = await prisma.$transaction(async (tx) => {
    const p = await tx.produit.update({
      where: { id: produitId },
      data: { stockActuel: nouvelleQuantite },
    });
    const mvt = await tx.mouvementStock.create({
      data: {
        produitId,
        type: 'AJUSTEMENT',
        quantite: Math.abs(diff),
        raison: raison || `Ajustement manuel (${diff > 0 ? '+' : ''}${diff})`,
        userId: req.user.userId,
      },
    });
    return { produit: p, mouvement: mvt };
  });
  res.json(result);
}

module.exports = { mouvements, entree, ajustement };

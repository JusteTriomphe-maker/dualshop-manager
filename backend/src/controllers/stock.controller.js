const prisma = require('../prismaClient');
const { z } = require('zod');

const mouvementSchema = z.object({
  produitId: z.string(),
  quantite: z.number().int().positive(),
  coutAchat: z.number().optional(),
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
  try {
    const data = mouvementSchema.parse(req.body);
    const result = await prisma.$transaction(async (tx) => {
      const produit = await tx.produit.findUnique({ where: { id: data.produitId } });
      if (!produit) throw new Error('Produit introuvable');

      const produitData = { stockActuel: { increment: data.quantite } };

      if (data.coutAchat !== undefined) {
        const ancienStock = produit.stockActuel > 0 ? produit.stockActuel : 0;
        const ancienCout = produit.coutAchat || 0;
        
        if (ancienStock > 0 && ancienCout > 0) {
          const nouveauCout = ((ancienStock * ancienCout) + (data.quantite * data.coutAchat)) / (ancienStock + data.quantite);
          produitData.coutAchat = Math.round(nouveauCout * 100) / 100;
        } else {
          produitData.coutAchat = data.coutAchat;
        }
      }

      const p = await tx.produit.update({
        where: { id: data.produitId },
        data: produitData,
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

      return { produit: p, mouvement: mvt };
    });
    res.status(201).json(result);
  } catch (err) {
    if (err.message === 'Produit introuvable') {
      return res.status(404).json({ error: 'Produit introuvable' });
    }
    res.status(400).json({ error: err.message });
  }
}

async function ajustement(req, res) {
  const { produitId, nouvelleQuantite, raison } = req.body;
  if (!produitId || nouvelleQuantite === undefined) {
    return res.status(400).json({ error: 'produitId et nouvelleQuantite requis' });
  }
  try {
    const result = await prisma.$transaction(async (tx) => {
      const produit = await tx.produit.findUnique({ where: { id: produitId } });
      if (!produit) throw new Error('Produit introuvable');
      
      const diff = nouvelleQuantite - produit.stockActuel;
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
  } catch (err) {
    if (err.message === 'Produit introuvable') {
      return res.status(404).json({ error: 'Produit introuvable' });
    }
    res.status(500).json({ error: err.message || 'Erreur interne' });
  }
}

module.exports = { mouvements, entree, ajustement };

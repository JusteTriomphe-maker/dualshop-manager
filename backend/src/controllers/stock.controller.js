const prisma = require('../prismaClient');
const { z } = require('zod');

const mouvementSchema = z.object({
  produitId:     z.string(),
  quantite:      z.number().int().positive(),
  coutAchat:     z.number().optional(),
  raison:        z.string().optional(),
  type:          z.enum(['ENTREE', 'SORTIE', 'AJUSTEMENT', 'PERTE']),
  fournisseurId: z.string().optional(),   // ← nouveau
  creerDette:    z.boolean().optional(),  // ← auto-créer une dette fournisseur
});

async function mouvements(req, res) {
  const { boutiqueId, produitId, type } = req.query;
  const where = {};
  if (boutiqueId) where.produit = { boutiqueId };
  if (produitId)  where.produitId = produitId;
  if (type)       where.type = type;

  const rows = await prisma.mouvementStock.findMany({
    where,
    include: {
      produit:     { select: { nom: true } },
      fournisseur: { select: { nom: true } },  // ← inclus dans la réponse
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  res.json(rows);
}

async function entree(req, res) {
  try {
    const data = mouvementSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Vérifier que le produit existe
      const produit = await tx.produit.findUnique({ where: { id: data.produitId } });
      if (!produit) throw new Error('Produit introuvable');

      // 2. Vérifier le fournisseur si fourni
      if (data.fournisseurId) {
        const fournisseur = await tx.fournisseur.findUnique({ where: { id: data.fournisseurId } });
        if (!fournisseur) throw new Error('Fournisseur introuvable');
      }

      // 3. Calcul du nouveau coût moyen pondéré
      const produitData = { stockActuel: { increment: data.quantite } };
      if (data.coutAchat !== undefined) {
        const ancienStock = produit.stockActuel > 0 ? produit.stockActuel : 0;
        const ancienCout  = produit.coutAchat || 0;
        if (ancienStock > 0 && ancienCout > 0) {
          const nouveauCout = ((ancienStock * ancienCout) + (data.quantite * data.coutAchat)) / (ancienStock + data.quantite);
          produitData.coutAchat = Math.round(nouveauCout * 100) / 100;
        } else {
          produitData.coutAchat = data.coutAchat;
        }
      }

      // 4. Mettre à jour le stock du produit
      const p = await tx.produit.update({
        where: { id: data.produitId },
        data:  produitData,
      });

      // 5. Créer le mouvement de stock
      const mvt = await tx.mouvementStock.create({
        data: {
          produitId:     data.produitId,
          fournisseurId: data.fournisseurId || null,
          type:          'ENTREE',
          quantite:      data.quantite,
          raison:        data.raison || 'Réapprovisionnement',
          userId:        req.user.userId,
        },
      });

      // 6. Créer automatiquement une dette fournisseur si demandé
      let dette = null;
      if (data.fournisseurId && data.creerDette && data.coutAchat) {
        const montant = data.coutAchat * data.quantite;
        dette = await tx.detteFournisseur.create({
          data: {
            fournisseurId: data.fournisseurId,
            produitId:     data.produitId,
            montantDu:     montant,
            montantPaye:   0,
            description:   `Achat ${p.nom} × ${data.quantite} (entrée stock)`,
            statut:        'IMPAYEE',
          },
        });
      }

      return { produit: p, mouvement: mvt, dette };
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.message === 'Produit introuvable')    return res.status(404).json({ error: 'Produit introuvable' });
    if (err.message === 'Fournisseur introuvable') return res.status(404).json({ error: 'Fournisseur introuvable' });
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
        data:  { stockActuel: nouvelleQuantite },
      });
      const mvt = await tx.mouvementStock.create({
        data: {
          produitId,
          type:     'AJUSTEMENT',
          quantite: Math.abs(diff),
          raison:   raison || `Ajustement manuel (${diff > 0 ? '+' : ''}${diff})`,
          userId:   req.user.userId,
        },
      });
      return { produit: p, mouvement: mvt };
    });
    res.json(result);
  } catch (err) {
    if (err.message === 'Produit introuvable') return res.status(404).json({ error: 'Produit introuvable' });
    res.status(500).json({ error: err.message || 'Erreur interne' });
  }
}

module.exports = { mouvements, entree, ajustement };

const prisma = require('../prismaClient');
const { z } = require('zod');

const ligneSchema = z.object({
  produitId: z.string(),
  quantite: z.number().int().positive(),
  prixUnit: z.number().positive(),
});

const createVenteSchema = z.object({
  boutiqueId: z.string(),
  lignes: z.array(ligneSchema).min(1),
  modePaiement: z.enum(['ESPECES', 'MOBILE_MONEY', 'CARTE', 'CREDIT']).default('ESPECES'),
  sourceDevice: z.string().default('web'),
  clientId: z.string().optional(),
  nouveauClient: z.string().optional(),
  descriptionDette: z.string().optional(),
  numeroTable: z.string().optional(),
});

async function generateNumero(boutiqueId) {
  const year = new Date().getFullYear();
  const count = await prisma.vente.count({
    where: { boutiqueId, createdAt: { gte: new Date(year, 0, 1) } },
  });
  return `VNT-${year}-${String(count + 1).padStart(5, '0')}`;
}

async function list(req, res) {
  const { boutiqueId, date, caissierIId } = req.query;
  const where = {};
  if (boutiqueId) where.boutiqueId = boutiqueId;
  if (caissierIId) where.caissierIId = caissierIId;
  if (date) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.createdAt = { gte: d, lt: next };
  }
  const ventes = await prisma.vente.findMany({
    where,
    include: { lignes: { include: { produit: true } }, caissier: { select: { nom: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json(ventes);
}

async function create(req, res) {
  const data = createVenteSchema.parse(req.body);
  const numero = await generateNumero(data.boutiqueId);
  const lignesData = [];

  for (const li of data.lignes) {
    const produit = await prisma.produit.findUnique({ where: { id: li.produitId } });
    if (!produit || !produit.actif) throw new Error(`Produit ${li.produitId} introuvable`);
    if (produit.stockActuel < li.quantite) throw new Error(`Stock insuffisant pour ${produit.nom}`);
    const sousTotal = li.quantite * li.prixUnit;
    lignesData.push({
      produitId: li.produitId,
      quantite: li.quantite,
      prixUnit: li.prixUnit,
      sousTotal,
    });
  }

  const total = lignesData.reduce((s, l) => s + l.sousTotal, 0);

  let finalClientId = data.clientId;

  if (data.modePaiement === 'CREDIT' && !finalClientId && data.nouveauClient) {
    const newClient = await prisma.client.create({
      data: { nom: data.nouveauClient, boutiqueId: data.boutiqueId },
    });
    finalClientId = newClient.id;
  }

  if (data.modePaiement === 'CREDIT' && !finalClientId) {
    throw new Error('Sélectionnez ou saisissez un client pour la vente à crédit');
  }

  const vente = await prisma.$transaction(async (tx) => {
    const venteData = {
      numero,
      boutiqueId: data.boutiqueId,
      caissierIId: req.user.userId,
      total,
      modePaiement: data.modePaiement,
      sourceDevice: data.sourceDevice,
      lignes: { create: lignesData },
    };
    if (finalClientId) venteData.clientId = finalClientId;
    if (data.numeroTable) venteData.numeroTable = data.numeroTable;

    const v = await tx.vente.create({
      data: venteData,
      include: { lignes: { include: { produit: true } } },
    });

    if (data.modePaiement === 'CREDIT') {
      await tx.detteClient.create({
        data: {
          clientId: finalClientId,
          venteId: v.id,
          montant: total,
          montantRestant: total,
          description: data.descriptionDette || `Vente ${numero}`,
        },
      });
    }

    for (const li of lignesData) {
      await tx.produit.update({
        where: { id: li.produitId },
        data: { stockActuel: { decrement: li.quantite } },
      });
      await tx.mouvementStock.create({
        data: {
          produitId: li.produitId,
          type: 'SORTIE',
          quantite: li.quantite,
          raison: `Vente ${numero}`,
          userId: req.user.userId,
        },
      });
    }

    return v;
  });

  res.status(201).json(vente);
}

async function getById(req, res) {
  const vente = await prisma.vente.findUnique({
    where: { id: req.params.id },
    include: { lignes: { include: { produit: true } }, caissier: { select: { nom: true } }, boutique: true },
  });
  if (!vente) return res.status(404).json({ error: 'Vente introuvable' });
  res.json(vente);
}

async function annuler(req, res) {
  const vente = await prisma.vente.findUnique({
    where: { id: req.params.id },
    include: { lignes: true },
  });
  if (!vente) return res.status(404).json({ error: 'Vente introuvable' });
  if (vente.statut === 'ANNULEE') return res.status(400).json({ error: 'Déjà annulée' });

  await prisma.$transaction(async (tx) => {
    await tx.vente.update({ where: { id: vente.id }, data: { statut: 'ANNULEE' } });
    for (const li of vente.lignes) {
      await tx.produit.update({
        where: { id: li.produitId },
        data: { stockActuel: { increment: li.quantite } },
      });
      await tx.mouvementStock.create({
        data: {
          produitId: li.produitId,
          type: 'ENTREE',
          quantite: li.quantite,
          raison: `Annulation vente ${vente.numero}`,
          userId: req.user.userId,
        },
      });
    }
  });

  res.json({ ok: true });
}

async function getRecu(req, res) {
  const vente = await prisma.vente.findUnique({
    where: { id: req.params.id },
    include: { lignes: { include: { produit: true } }, caissier: { select: { nom: true } }, boutique: true, client: { select: { nom: true } } },
  });
  if (!vente) return res.status(404).json({ error: 'Vente introuvable' });
  res.json({
    boutique: vente.boutique.nom,
    numero: vente.numero,
    date: vente.createdAt,
    caissier: vente.caissier.nom,
    numeroTable: vente.numeroTable,
    client: vente.client,
    lignes: vente.lignes.map(l => ({
      produit: l.produit.nom,
      quantite: l.quantite,
      prixUnit: l.prixUnit,
      sousTotal: l.sousTotal,
    })),
    total: vente.total,
    modePaiement: vente.modePaiement,
  });
}

async function sync(req, res) {
  const { ventes: ventesData } = req.body;
  if (!Array.isArray(ventesData)) return res.status(400).json({ error: 'ventes requis (tableau)' });

  const results = [];
  for (const vData of ventesData) {
    try {
      const existing = await prisma.vente.findUnique({ where: { id: vData.id } });
      if (existing) {
        results.push({ localId: vData.id, serverId: existing.id, status: 'duplicate' });
        continue;
      }
      const vente = await prisma.$transaction(async (tx) => {
        const lignesData = (vData.lignes || []).map(li => ({
          produitId: li.produitId,
          quantite: li.quantite,
          prixUnit: li.prixUnit,
          sousTotal: li.quantite * li.prixUnit,
        }));
        const total = lignesData.reduce((s, l) => s + l.sousTotal, 0);
        const v = await tx.vente.create({
          data: {
            id: vData.id,
            numero: vData.numero || `SYNC-${Date.now()}`,
            boutiqueId: vData.boutiqueId,
            caissierIId: req.user.userId,
            total,
            modePaiement: vData.modePaiement || 'ESPECES',
            sourceDevice: 'mobile',
            synchedAt: new Date(),
            numeroTable: vData.numeroTable || null,
            lignes: { create: lignesData },
          },
        });
        for (const li of lignesData) {
          await tx.produit.update({
            where: { id: li.produitId },
            data: { stockActuel: { decrement: li.quantite } },
          });
        }
        return v;
      });
      results.push({ localId: vData.id, serverId: vente.id, status: 'synced' });
    } catch (e) {
      results.push({ localId: vData.id, status: 'error', error: e.message });
    }
  }
  res.json({ results });
}

module.exports = { list, create, getById, annuler, getRecu, sync };

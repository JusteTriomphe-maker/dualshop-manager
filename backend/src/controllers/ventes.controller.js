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

// Préfixes courts par type de boutique
const BOUTIQUE_PREFIXES = {
  EPICERIE: 'EP',
  RESTAUBAR: 'RB',
};

/**
 * Génère un numéro de vente GLOBALEMENT unique avec préfixe boutique.
 * Format : VNT-EP-2026-00001 (Épicerie) ou VNT-RB-2026-00001 (Restau-bar)
 * La séquence est globale (pas par boutique) car la contrainte @unique est globale.
 */
async function generateNumero(tx, typeBoutique) {
  const year = new Date().getFullYear();
  const bp = BOUTIQUE_PREFIXES[typeBoutique] || 'XX';
  const prefix = `VNT-${bp}-${year}-`;

  // Cherche le DERNIER numéro avec ce préfixe (toutes boutiques confondues)
  // Le tri DESC sur la string fonctionne car les séquences sont zero-paddées
  const last = await tx.vente.findFirst({
    where: { numero: { startsWith: prefix } },
    orderBy: { numero: 'desc' },
    select: { numero: true },
  });

  let seq = 1;
  if (last) {
    const parts = last.numero.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(5, '0')}`;
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
    include: {
      lignes: { include: { produit: true } },
      caissier: { select: { nom: true } },
      boutique: true,
      client: { select: { nom: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json(ventes);
}

async function create(req, res) {
  try {
    const data = createVenteSchema.parse(req.body);

    // Isolation boutique pour le caissier
    if (req.user.role === 'CAISSIER' && req.user.boutiqueId !== data.boutiqueId) {
      return res.status(403).json({ error: 'Accès interdit : vous ne pouvez pas effectuer de vente pour une autre boutique.' });
    }

    // Charger la boutique pour connaître son type
    const boutique = await prisma.boutique.findUnique({ where: { id: data.boutiqueId } });
    if (!boutique) return res.status(400).json({ error: 'Boutique introuvable.' });

    // L'épicerie n'a pas de tables
    if (boutique.type === 'EPICERIE' && data.numeroTable) {
      return res.status(400).json({ error: "L'épicerie ne gère pas de numéro de table." });
    }

    let finalClientId = data.clientId;

    if (data.modePaiement === 'CREDIT' && !finalClientId && data.nouveauClient) {
      const newClient = await prisma.client.create({
        data: { nom: data.nouveauClient, boutiqueId: data.boutiqueId },
      });
      finalClientId = newClient.id;
    }

    if (data.modePaiement === 'CREDIT' && !finalClientId) {
      return res.status(400).json({ error: 'Sélectionnez ou saisissez un client pour la vente à crédit' });
    }

    // Boucle de retry : en cas de collision de numéro (P2002), on réessaie jusqu'à 5 fois
    let vente;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        vente = await prisma.$transaction(async (tx) => {
          // Passe le TYPE de boutique pour le préfixe, pas l'ID
          const numero = await generateNumero(tx, boutique.type);
          const lignesData = [];

          for (const li of data.lignes) {
            const produit = await tx.produit.findUnique({ where: { id: li.produitId } });
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
            include: {
              lignes: { include: { produit: true } },
              caissier: { select: { nom: true } },
              boutique: true,
              client: { select: { nom: true } },
            },
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
        break; // Succès : on sort de la boucle
      } catch (loopErr) {
        // Collision de numéro → on réessaie
        if (loopErr.code === 'P2002' && loopErr.meta?.target?.includes('numero')) {
          if (attempt === 4) throw new Error('Impossible de générer un numéro unique après 5 tentatives');
          continue;
        }
        throw loopErr; // Autre erreur : on remonte
      }
    } // fin for

    res.status(201).json(vente);
  } catch (err) {
    // Erreur de validation Zod → liste les champs invalides
    if (err.name === 'ZodError') {
      const details = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.error('[ventes/create] Validation:', details);
      return res.status(400).json({ error: `Données invalides : ${details}` });
    }
    console.error('[ventes/create]', err.message);
    res.status(400).json({ error: err.message });
  }
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
      // Isolation boutique pour le caissier en mode sync
      if (req.user.role === 'CAISSIER' && req.user.boutiqueId !== vData.boutiqueId) {
        results.push({ localId: vData.id, status: 'error', error: 'Accès interdit : boutique non autorisée pour ce caissier.' });
        continue;
      }

      const existing = await prisma.vente.findUnique({ where: { id: vData.id } });
      if (existing) {
        results.push({ localId: vData.id, serverId: existing.id, status: 'duplicate' });
        continue;
      }

      // Charger la boutique pour son type et valider le numéro de table
      const boutique = await prisma.boutique.findUnique({ where: { id: vData.boutiqueId } });
      if (!boutique) {
        results.push({ localId: vData.id, status: 'error', error: 'Boutique introuvable.' });
        continue;
      }

      // Pas de table pour l'épicerie
      if (boutique.type === 'EPICERIE' && vData.numeroTable) {
        results.push({ localId: vData.id, status: 'error', error: "L'épicerie ne gère pas de numéro de table." });
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

        // Si le numéro n'est pas fourni, on génère un numéro structuré et unique
        const numero = vData.numero || await generateNumero(tx, boutique.type);

        const v = await tx.vente.create({
          data: {
            id: vData.id,
            numero,
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

const prisma = require('../prismaClient');
const { z } = require('zod');

const createDetteClientSchema = z.object({
  clientId: z.string(),
  montant: z.number().positive(),
  description: z.string().optional(),
  dateEcheance: z.string().optional(),
  venteId: z.string().optional(),
});

const createDetteFournisseurSchema = z.object({
  fournisseurId: z.string(),
  produitId: z.string().optional(),
  montantDu: z.number().positive(),
  description: z.string().optional(),
  dateEcheance: z.string().optional(),
});

async function listDettesClients(req, res) {
  const { clientId, statut, boutiqueId } = req.query;
  const where = {};
  if (clientId) where.clientId = clientId;
  if (statut) where.statut = statut;
  if (boutiqueId) where.client = { boutiqueId };
  const dettes = await prisma.detteClient.findMany({
    where,
    include: {
      client: { select: { id: true, nom: true, telephone: true } },
      paiements: { orderBy: { datePaiement: 'desc' } },
      vente: { select: { numero: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  const totalImpaye = dettes.reduce((s, d) => s + d.montantRestant, 0);
  res.json({ dettes, totalImpaye });
}

async function listDettesFournisseurs(req, res) {
  const { fournisseurId, statut } = req.query;
  const where = {};
  if (fournisseurId) where.fournisseurId = fournisseurId;
  if (statut) where.statut = statut;
  const dettes = await prisma.detteFournisseur.findMany({
    where,
    include: {
      fournisseur: { select: { id: true, nom: true } },
      produit: { select: { nom: true } },
      paiements: { orderBy: { datePaiement: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });
  const totalDu = dettes.reduce((s, d) => s + (d.montantDu - d.montantPaye), 0);
  res.json({ dettes, totalDu });
}

async function createDetteClient(req, res) {
  const data = createDetteClientSchema.parse(req.body);
  const dette = await prisma.detteClient.create({
    data: {
      clientId: data.clientId,
      montant: data.montant,
      montantRestant: data.montant,
      description: data.description,
      dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
      venteId: data.venteId,
    },
    include: { client: { select: { nom: true } } },
  });
  res.status(201).json(dette);
}

async function createDetteFournisseur(req, res) {
  const data = createDetteFournisseurSchema.parse(req.body);
  const dette = await prisma.detteFournisseur.create({
    data: {
      fournisseurId: data.fournisseurId,
      produitId: data.produitId,
      montantDu: data.montantDu,
      description: data.description,
      dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
    },
    include: { fournisseur: { select: { nom: true } } },
  });
  res.status(201).json(dette);
}

async function payerDetteClient(req, res) {
  const { detteId, montant, modePaiement } = req.body;
  const dette = await prisma.detteClient.findUnique({ where: { id: detteId } });
  if (!dette) return res.status(404).json({ error: 'Dette introuvable' });
  if (dette.statut === 'PAYEE') return res.status(400).json({ error: 'Dette déjà payée' });

  const result = await prisma.$transaction(async (tx) => {
    const paiement = await tx.paiementClient.create({
      data: { detteClientId: detteId, montant, modePaiement: modePaiement || 'ESPECES' },
    });
    const totalPaye = (await tx.paiementClient.aggregate({
      where: { detteClientId: detteId },
      _sum: { montant: true },
    }))._sum.montant || 0;
    const restant = dette.montant - totalPaye;
    const statut = restant <= 0 ? 'PAYEE' : 'PARTIELLE';
    await tx.detteClient.update({ where: { id: detteId }, data: { montantRestant: Math.max(0, restant), statut } });
    return paiement;
  });
  res.status(201).json(result);
}

async function payerDetteFournisseur(req, res) {
  const { detteId, montant } = req.body;
  const dette = await prisma.detteFournisseur.findUnique({ where: { id: detteId } });
  if (!dette) return res.status(404).json({ error: 'Dette introuvable' });

  const result = await prisma.$transaction(async (tx) => {
    const paiement = await tx.paiementFournisseur.create({
      data: { detteFournisseurId: detteId, montant },
    });
    const totalPaye = (await tx.paiementFournisseur.aggregate({
      where: { detteFournisseurId: detteId },
      _sum: { montant: true },
    }))._sum.montant || 0;
    const restant = dette.montantDu - totalPaye;
    const statut = restant <= 0 ? 'PAYEE' : 'PARTIELLE';
    await tx.detteFournisseur.update({ where: { id: detteId }, data: { montantPaye: totalPaye, statut } });
    return paiement;
  });
  res.status(201).json(result);
}

async function rapportDettes(req, res) {
  const { boutiqueId } = req.query;
  const clientWhere = boutiqueId ? { client: { boutiqueId } } : {};
  const dettesClients = await prisma.detteClient.findMany({
    where: { ...clientWhere, statut: { not: 'PAYEE' } },
    include: { client: { select: { nom: true, telephone: true, boutiqueId: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const totalClients = dettesClients.reduce((s, d) => s + d.montantRestant, 0);

  const dettesFournisseurs = await prisma.detteFournisseur.findMany({
    where: { statut: { not: 'PAYEE' } },
    include: { fournisseur: { select: { nom: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const totalFournisseurs = dettesFournisseurs.reduce((s, d) => s + (d.montantDu - d.montantPaye), 0);

  res.json({
    clients: { dettes: dettesClients, totalImpaye: totalClients },
    fournisseurs: { dettes: dettesFournisseurs, totalDu: totalFournisseurs },
  });
}

module.exports = {
  listDettesClients, listDettesFournisseurs,
  createDetteClient, createDetteFournisseur,
  payerDetteClient, payerDetteFournisseur,
  rapportDettes,
};

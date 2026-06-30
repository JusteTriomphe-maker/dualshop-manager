const prisma = require('../prismaClient');
const { z } = require('zod');

const createSchema = z.object({
  nom: z.string().min(1),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  boutiqueId: z.string(),
});

async function list(req, res) {
  const { boutiqueId, search } = req.query;
  const where = {};
  if (boutiqueId) where.boutiqueId = boutiqueId;
  if (search) where.nom = { contains: search };
  const clients = await prisma.client.findMany({
    where,
    include: { _count: { select: { dettes: true, ventes: true } } },
    orderBy: { nom: 'asc' },
  });
  res.json(clients);
}

async function getById(req, res) {
  const client = await prisma.client.findUnique({
    where: { id: req.params.id },
    include: {
      dettes: { include: { paiements: true, vente: { select: { numero: true, createdAt: true } } }, orderBy: { createdAt: 'desc' } },
      ventes: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });
  if (!client) return res.status(404).json({ error: 'Client introuvable' });
  const totalDues = client.dettes.reduce((s, d) => s + d.montantRestant, 0);
  res.json({ ...client, totalDues });
}

async function create(req, res) {
  const data = createSchema.parse(req.body);
  const client = await prisma.client.create({ data });
  res.status(201).json(client);
}

async function update(req, res) {
  const { id } = req.params;
  const { nom, telephone, adresse } = req.body;
  const data = {};
  if (nom !== undefined) data.nom = nom;
  if (telephone !== undefined) data.telephone = telephone;
  if (adresse !== undefined) data.adresse = adresse;
  const client = await prisma.client.update({ where: { id }, data });
  res.json(client);
}

module.exports = { list, getById, create, update };

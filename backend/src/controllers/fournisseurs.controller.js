const prisma = require('../prismaClient');
const { z } = require('zod');

const createSchema = z.object({
  nom: z.string().min(1),
  telephone: z.string().optional(),
  contact: z.string().optional(),
});

async function list(req, res) {
  const fournisseurs = await prisma.fournisseur.findMany({
    include: { _count: { select: { dettes: true } } },
    orderBy: { nom: 'asc' },
  });
  res.json(fournisseurs);
}

async function getById(req, res) {
  const fournisseur = await prisma.fournisseur.findUnique({
    where: { id: req.params.id },
    include: {
      dettes: {
        include: { paiements: true, produit: { select: { nom: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!fournisseur) return res.status(404).json({ error: 'Fournisseur introuvable' });
  const totalDu = fournisseur.dettes.reduce((s, d) => s + (d.montantDu - d.montantPaye), 0);
  res.json({ ...fournisseur, totalDu });
}

async function create(req, res) {
  const data = createSchema.parse(req.body);
  const fournisseur = await prisma.fournisseur.create({ data });
  res.status(201).json(fournisseur);
}

async function update(req, res) {
  const { id } = req.params;
  const { nom, telephone, contact } = req.body;
  const data = {};
  if (nom !== undefined) data.nom = nom;
  if (telephone !== undefined) data.telephone = telephone;
  if (contact !== undefined) data.contact = contact;
  const fournisseur = await prisma.fournisseur.update({ where: { id }, data });
  res.json(fournisseur);
}

module.exports = { list, getById, create, update };

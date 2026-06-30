const bcrypt = require('bcryptjs');
const prisma = require('../prismaClient');
const { z } = require('zod');

const createUserSchema = z.object({
  nom: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['DG', 'GERANT', 'CAISSIER']),
  boutiqueId: z.string().optional(),
});

async function list(req, res) {
  const users = await prisma.user.findMany({
    select: { id: true, nom: true, email: true, role: true, boutiqueId: true, actif: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
}

async function create(req, res) {
  const data = createUserSchema.parse(req.body);
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) return res.status(400).json({ error: 'Cet email est déjà utilisé' });
  const hashed = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { ...data, password: hashed },
    select: { id: true, nom: true, email: true, role: true, boutiqueId: true },
  });
  res.status(201).json(user);
}

async function update(req, res) {
  const { id } = req.params;
  const { nom, email, role, boutiqueId, actif } = req.body;
  const data = {};
  if (nom !== undefined) data.nom = nom;
  if (email !== undefined) data.email = email;
  if (role !== undefined) data.role = role;
  if (boutiqueId !== undefined) data.boutiqueId = boutiqueId || null;
  if (actif !== undefined) data.actif = actif;
  const user = await prisma.user.update({ where: { id }, data, select: { id: true, nom: true, email: true, role: true, boutiqueId: true, actif: true } });
  res.json(user);
}

async function remove(req, res) {
  const { id } = req.params;
  await prisma.user.update({ where: { id }, data: { actif: false } });
  res.json({ ok: true });
}

module.exports = { list, create, update, remove };

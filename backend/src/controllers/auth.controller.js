const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');
const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function login(req, res) {
  const { email, password } = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({
    where: { email },
    include: { boutique: { select: { type: true } } },
  });
  if (!user || !user.actif) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  const payload = { userId: user.id, role: user.role, boutiqueId: user.boutiqueId };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
  res.json({
    token,
    refreshToken,
    user: {
      id: user.id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      boutiqueId: user.boutiqueId,
      boutiqueType: user.boutique?.type || null,
    },
  });
}

async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: { boutique: { select: { type: true } } },
  });
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json({
    id: user.id,
    nom: user.nom,
    email: user.email,
    role: user.role,
    boutiqueId: user.boutiqueId,
    boutiqueType: user.boutique?.type || null,
  });
}

async function changePassword(req, res) {
  const { oldPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  const valid = await bcrypt.compare(oldPassword, user.password);
  if (!valid) return res.status(400).json({ error: 'Ancien mot de passe incorrect' });
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: req.user.userId }, data: { password: hashed } });
  res.json({ ok: true });
}

module.exports = { login, me, changePassword };

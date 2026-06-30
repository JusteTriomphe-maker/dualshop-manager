const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const epicerie = await prisma.boutique.upsert({
    where: { id: 'boutique-epicerie' },
    update: {},
    create: { id: 'boutique-epicerie', nom: 'Épicerie', type: 'EPICERIE' }
  });

  const restaubar = await prisma.boutique.upsert({
    where: { id: 'boutique-restaubar' },
    update: {},
    create: { id: 'boutique-restaubar', nom: 'Restau-bar', type: 'RESTAUBAR' }
  });

  await prisma.user.upsert({
    where: { email: 'dg@dualshop.com' },
    update: {},
    create: {
      nom: 'Directeur Général',
      email: 'dg@dualshop.com',
      password: await bcrypt.hash('ChangeMoi2025!', 10),
      role: 'DG',
    }
  });

  console.log('Seed terminé. DG: dg@dualshop.com / ChangeMoi2025!');
}

main().catch(console.error).finally(() => prisma.$disconnect());

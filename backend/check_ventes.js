const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ventes = await prisma.vente.findMany({
    select: { numero: true, boutiqueId: true, createdAt: true, statut: true },
    orderBy: { numero: 'asc' },
  });

  console.log('=== Ventes en base ===');
  ventes.forEach(v => {
    console.log(`${v.numero} | ${v.statut} | boutique: ${v.boutiqueId.slice(0, 8)}...`);
  });
  console.log(`\nTotal: ${ventes.length} vente(s)`);

  // Détecter les doublons
  const nums = ventes.map(v => v.numero);
  const duplicates = nums.filter((n, i) => nums.indexOf(n) !== i);
  if (duplicates.length > 0) {
    console.log('\n⚠️  DOUBLONS DÉTECTÉS:', duplicates);
  } else {
    console.log('\n✅ Pas de doublons détectés');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

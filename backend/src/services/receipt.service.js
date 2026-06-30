function formatReceipt(vente) {
  const lines = [];
  lines.push('='.repeat(40));
  lines.push(`       ${vente.boutique?.nom || 'BOUTIQUE'}`);
  lines.push('       République du Congo');
  lines.push('='.repeat(40));
  lines.push(`Reçu N° : ${vente.numero}`);
  lines.push(`Date    : ${new Date(vente.createdAt).toLocaleString('fr-CG', { timeZone: 'Africa/Lagos' })}`);
  lines.push(`Caissier: ${vente.caissier?.nom || ''}`);
  if (vente.numeroTable) lines.push(`Table   : ${vente.numeroTable}`);
  if (vente.client) lines.push(`Client  : ${vente.client.nom}`);
  lines.push('-'.repeat(40));
  lines.push('ARTICLE'.padEnd(20) + 'QTE'.padStart(5) + 'PRIX'.padStart(15));
  lines.push('-'.repeat(40));
  for (const li of vente.lignes || []) {
    const nom = (li.produit?.nom || '').substring(0, 18);
    lines.push(
      nom.padEnd(20) +
      String(li.quantite).padStart(5) +
      String(li.prixUnit.toLocaleString('fr-FR') + ' F').padStart(15)
    );
  }
  lines.push('-'.repeat(40));
  lines.push('SOUS-TOTAL'.padEnd(25) + String(vente.total.toLocaleString('fr-FR') + ' F').padStart(15));
  lines.push('TOTAL'.padEnd(25) + String(vente.total.toLocaleString('fr-FR') + ' F').padStart(15));
  lines.push(`PAIEMENT`.padEnd(25) + `${vente.modePaiement}`.padStart(15));
  lines.push('-'.repeat(40));
  lines.push('     Merci de votre visite !');
  lines.push('='.repeat(40));
  return lines.join('\n');
}

module.exports = { formatReceipt };

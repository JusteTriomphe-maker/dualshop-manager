import { forwardRef } from 'react'

function formatDate(d) {
  return new Date(d).toLocaleString('fr-CG', {
    timeZone: 'Africa/Lagos',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const format = (n) => (n || 0).toLocaleString('fr-FR')

const Receipt = forwardRef(({ vente }, ref) => {
  if (!vente) return null

  const lignes = vente.lignes || []
  const total = vente.total || 0

  return (
    <div ref={ref} className="receipt">
      <div className="receipt-header">
        <div className="shop-name">{vente.boutique?.nom || 'BOUTIQUE'}</div>
        <div className="shop-sub">République du Congo</div>
        <div className="divider">{'='.repeat(32)}</div>
        <div className="info-line"><span className="label">N°</span><span>{vente.numero}</span></div>
        <div className="info-line"><span className="label">Date</span><span>{formatDate(vente.createdAt)}</span></div>
        <div className="info-line"><span className="label">Caissier</span><span>{vente.caissier?.nom}</span></div>
        {vente.numeroTable && <div className="info-line"><span className="label">Table</span><span>N° {vente.numeroTable}</span></div>}
        {vente.client && <div className="info-line"><span className="label">Client</span><span>{vente.client?.nom}</span></div>}
      </div>

      <div className="divider">{'='.repeat(32)}</div>

      <table className="items">
        <thead>
          <tr>
            <th className="col-article">Article</th>
            <th className="col-qte">Qté</th>
            <th className="col-prix">P.U</th>
            <th className="col-total">Total</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map(l => (
            <tr key={l.id}>
              <td className="col-article">{l.produit?.nom}</td>
              <td className="col-qte">{l.quantite}</td>
              <td className="col-prix">{format(l.prixUnit)}</td>
              <td className="col-total">{format(l.sousTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="divider">{'='.repeat(32)}</div>

      <div className="total-row">
        <span className="total-label">TOTAL À PAYER</span>
        <span className="total-value">{format(total)} FCFA</span>
      </div>

      <div className="divider">{'='.repeat(32)}</div>

      <div className="payment-row">
        <span>Paiement</span>
        <span className="payment-value">{vente.modePaiement}</span>
      </div>

      <div className="footer">
        <div className="divider">{'-'.repeat(32)}</div>
        <div className="thanks">Merci de votre visite !</div>
        <div className="tagline">À très bientôt</div>
      </div>

      <style>{`
        .receipt {
          width: 80mm;
          margin: 0 auto;
          padding: 2mm 3mm;
          font-family: 'Courier New', Courier, monospace;
          font-size: 10px;
          line-height: 1.4;
          color: #000;
          background: #fff;
        }
        .receipt-header { text-align: center; margin-bottom: 2mm; }
        .shop-name { font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
        .shop-sub { font-size: 8px; color: #555; margin-top: 1mm; }
        .info-line { display: flex; justify-content: space-between; padding: 0.5mm 0; font-size: 9px; }
        .info-line .label { color: #555; }
        .divider { text-align: center; font-size: 8px; color: #888; letter-spacing: 0; margin: 1.5mm 0; }
        .items { width: 100%; border-collapse: collapse; font-size: 9px; }
        .items th { border-bottom: 1px dashed #999; padding: 1mm 0; font-size: 8px; text-transform: uppercase; color: #555; }
        .items td { padding: 0.8mm 0; }
        .col-article { text-align: left; width: 45%; }
        .col-qte { text-align: center; width: 12%; }
        .col-prix { text-align: right; width: 20%; }
        .col-total { text-align: right; width: 23%; }
        .total-row { display: flex; justify-content: space-between; align-items: center; padding: 1mm 0; font-weight: bold; font-size: 11px; }
        .total-value { font-size: 13px; }
        .payment-row { display: flex; justify-content: space-between; font-size: 9px; padding: 0.5mm 0; }
        .payment-value { font-weight: bold; }
        .footer { text-align: center; margin-top: 1mm; }
        .thanks { font-size: 10px; font-weight: bold; margin: 1mm 0; }
        .tagline { font-size: 8px; color: #888; }
      `}</style>
    </div>
  )
})

Receipt.displayName = 'Receipt'
export default Receipt

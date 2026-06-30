const express = require('express');
const cors = require('cors');
const path = require('path');

const { initDb, openDb, run, all, get } = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 3000;

async function start() {
  await initDb();

  // Health
  app.get('/api/ping', async (req, res) => {
    res.json({ ok: true, message: 'Serveur local OK' });
  });

  // Boutiques
  app.get('/api/boutiques', async (req, res) => {
    const db = openDb();
    try {
      const rows = await all(db, `SELECT id, nom FROM boutiques ORDER BY nom`);
      res.json(rows);
    } finally {
      db.close();
    }
  });

  // Produits
  app.get('/api/produits', async (req, res) => {
    const db = openDb();
    try {
      const rows = await all(
        db,
        `SELECT id, nom, unite, prix_achat, prix_vente, created_at FROM produits ORDER BY nom`
      );
      res.json(rows);
    } finally {
      db.close();
    }
  });

  app.post('/api/produits', async (req, res) => {
    const { nom, unite, prix_achat = 0, prix_vente = 0 } = req.body || {};
    if (!nom || !unite) return res.status(400).json({ error: 'nom et unite requis' });

    const db = openDb();
    try {
      const result = await run(
        db,
        `INSERT INTO produits(nom, unite, prix_achat, prix_vente) VALUES (?,?,?,?)`,
        [nom.trim(), unite.trim(), Number(prix_achat) || 0, Number(prix_vente) || 0]
      );
      res.json({ ok: true, id: result.lastID });
    } catch (e) {
      res.status(400).json({ error: String(e.message || e) });
    } finally {
      db.close();
    }
  });

  app.put('/api/produits/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { nom, unite, prix_achat = 0, prix_vente = 0 } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id invalide' });

    const db = openDb();
    try {
      await run(
        db,
        `UPDATE produits SET nom=?, unite=?, prix_achat=?, prix_vente=? WHERE id=?`,
        [nom.trim(), unite.trim(), Number(prix_achat) || 0, Number(prix_vente) || 0, id]
      );
      res.json({ ok: true });
    } catch (e) {
      res.status(400).json({ error: String(e.message || e) });
    } finally {
      db.close();
    }
  });

  app.delete('/api/produits/:id', async (req, res) => {
    const id = Number(req.params.id);
    const db = openDb();
    try {
      await run(db, `DELETE FROM produits WHERE id=?`, [id]);
      res.json({ ok: true });
    } catch (e) {
      res.status(400).json({ error: String(e.message || e) });
    } finally {
      db.close();
    }
  });

  // Stock état + mouvements
  app.get('/api/stock/:boutiqueId', async (req, res) => {
    const boutiqueId = Number(req.params.boutiqueId);
    const db = openDb();
    try {
      const rows = await all(
        db,
        `SELECT s.boutique_id, s.produit_id, p.nom, p.unite,
                s.quantite, s.prix_cout_unitaire, p.prix_vente
         FROM stock s
         JOIN produits p ON p.id = s.produit_id
         WHERE s.boutique_id=?
         ORDER BY p.nom`,
        [boutiqueId]
      );
      res.json(rows);
    } finally {
      db.close();
    }
  });

  app.get('/api/stock-mouvements/:boutiqueId', async (req, res) => {
    const boutiqueId = Number(req.params.boutiqueId);
    const db = openDb();
    try {
      const rows = await all(
        db,
        `SELECT m.id, m.type, m.quantite, m.prix_cout_unitaire, m.motif, m.date_mouvement,
                p.nom AS produit_nom
         FROM stock_mouvements m
         JOIN produits p ON p.id = m.produit_id
         WHERE m.boutique_id=?
         ORDER BY m.date_mouvement DESC
         LIMIT 200`,
        [boutiqueId]
      );
      res.json(rows);
    } finally {
      db.close();
    }
  });

  app.post('/api/stock-mouvements', async (req, res) => {
    const { boutique_id, produit_id, type, quantite, prix_cout_unitaire = 0, motif } = req.body || {};
    const q = Number(quantite);
    if (!boutique_id || !produit_id) return res.status(400).json({ error: 'boutique_id et produit_id requis' });
    if (!['ENTREE', 'SORTIE'].includes(type)) return res.status(400).json({ error: 'type invalide' });
    if (!Number.isFinite(q) || q <= 0) return res.status(400).json({ error: 'quantite invalide' });

    const db = openDb();
    try {
      // Transaction
      await run(db, 'BEGIN TRANSACTION');

      const stockRow = await get(
        db,
        `SELECT quantite FROM stock WHERE boutique_id=? AND produit_id=?`,
        [boutique_id, produit_id]
      );
      if (!stockRow) {
        await run(
          db,
          `INSERT INTO stock(boutique_id, produit_id, quantite, prix_cout_unitaire) VALUES (?,?,0,0)`,
          [boutique_id, produit_id]
        );
      }

      const quantiteActuelle = stockRow ? Number(stockRow.quantite) : 0;
      const nouveau = type === 'ENTREE' ? quantiteActuelle + q : quantiteActuelle - q;
      if (type === 'SORTIE' && nouveau < 0) {
        await run(db, 'ROLLBACK');
        return res.status(400).json({ error: 'Stock insuffisant pour la sortie' });
      }

      await run(
        db,
        `INSERT INTO stock_mouvements(boutique_id, produit_id, type, quantite, prix_cout_unitaire, motif) VALUES (?,?,?,?,?,?)`,
        [boutique_id, produit_id, type, q, Number(prix_cout_unitaire) || 0, motif || null]
      );

      await run(
        db,
        `UPDATE stock
         SET quantite=?,
             prix_cout_unitaire=CASE WHEN ?!=0 THEN ? ELSE prix_cout_unitaire END,
             mise_a_jour_at=datetime('now')
         WHERE boutique_id=? AND produit_id=?`,
        [nouveau, Number(prix_cout_unitaire) || 0, Number(prix_cout_unitaire) || 0, boutique_id, produit_id]
      );

      await run(db, 'COMMIT');
      res.json({ ok: true, quantite: nouveau });
    } catch (e) {
      try { await run(db, 'ROLLBACK'); } catch (_) {}
      res.status(400).json({ error: String(e.message || e) });
    } finally {
      db.close();
    }
  });

  // Ventes : insertion + décrément stock (SORTIE)
  app.post('/api/ventes', async (req, res) => {
    const { boutique_id, reference, mode_paiement = 'especes', lignes = [] } = req.body || {};
    if (!boutique_id) return res.status(400).json({ error: 'boutique_id requis' });
    if (!Array.isArray(lignes) || lignes.length === 0) return res.status(400).json({ error: 'lignes requis' });

    const db = openDb();
    try {
      await run(db, 'BEGIN TRANSACTION');

      // Calcul total + validation
      let total = 0;
      const prepared = [];
      for (const li of lignes) {
        const produit_id = Number(li.produit_id);
        const quantite = Number(li.quantite);
        const prix_unitaire = Number(li.prix_unitaire);
        if (!produit_id || !Number.isFinite(quantite) || quantite <= 0 || !Number.isFinite(prix_unitaire) || prix_unitaire < 0) {
          throw new Error('Ligne de vente invalide');
        }
        const tl = quantite * prix_unitaire;
        total += tl;
        prepared.push({ produit_id, quantite, prix_unitaire, total_ligne: tl });
      }

      const venteRes = await run(
        db,
        `INSERT INTO ventes(boutique_id, reference, total, mode_paiement) VALUES (?,?,?,?)`,
        [boutique_id, reference || null, total, mode_paiement]
      );
      const vente_id = venteRes.lastID;

      // Stock décrément
      for (const p of prepared) {
        const stockRow = await get(
          db,
          `SELECT quantite, prix_cout_unitaire FROM stock WHERE boutique_id=? AND produit_id=?`,
          [boutique_id, p.produit_id]
        );
        const qAct = stockRow ? Number(stockRow.quantite) : 0;
        if (qAct < p.quantite) {
          throw new Error(`Stock insuffisant pour le produit_id=${p.produit_id}`);
        }

        await run(
          db,
          `INSERT INTO vente_lignes(vente_id, produit_id, quantite, prix_unitaire, total_ligne)
           VALUES (?,?,?,?,?)`,
          [vente_id, p.produit_id, p.quantite, p.prix_unitaire, p.total_ligne]
        );

        // Mouvement stock SORTIE
        await run(
          db,
          `INSERT INTO stock_mouvements(boutique_id, produit_id, type, quantite, prix_cout_unitaire, motif)
           VALUES (?,?,?,?,?,?)`,
          [boutique_id, p.produit_id, 'SORTIE', p.quantite, Number(stockRow && stockRow.prix_cout_unitaire) || 0, 'Vente']
        );

        const nouveau = qAct - p.quantite;
        await run(
          db,
          `UPDATE stock SET quantite=?, mise_a_jour_at=datetime('now') WHERE boutique_id=? AND produit_id=?`,
          [nouveau, boutique_id, p.produit_id]
        );
      }

      await run(db, 'COMMIT');
      res.json({ ok: true, vente_id });
    } catch (e) {
      try { await run(db, 'ROLLBACK'); } catch (_) {}
      res.status(400).json({ error: String(e.message || e) });
    } finally {
      db.close();
    }
  });

  // Dépenses
  app.post('/api/depenses', async (req, res) => {
    const { boutique_id, categorie, montant, description } = req.body || {};
    const m = Number(montant);
    if (!boutique_id) return res.status(400).json({ error: 'boutique_id requis' });
    if (!categorie) return res.status(400).json({ error: 'categorie requise' });
    if (!Number.isFinite(m) || m <= 0) return res.status(400).json({ error: 'montant invalide' });

    const db = openDb();
    try {
      const r = await run(
        db,
        `INSERT INTO depenses(boutique_id, categorie, montant, description) VALUES (?,?,?,?)`,
        [boutique_id, categorie, m, description || null]
      );
      res.json({ ok: true, depense_id: r.lastID });
    } catch (e) {
      res.status(400).json({ error: String(e.message || e) });
    } finally {
      db.close();
    }
  });

  // Rapports
  app.get('/api/rapports', async (req, res) => {
    const boutiqueId = Number(req.query.boutique_id);
    const periode = String(req.query.periode || '7j'); // 7j | 30j | tout
    if (!boutiqueId) return res.status(400).json({ error: 'boutique_id requis' });

    let where = '1=1';
    if (periode === '7j') where = "date_vente >= datetime('now','-7 days')";
    if (periode === '30j') where = "date_vente >= datetime('now','-30 days')";

    const db = openDb();
    try {
      const ventes = await get(
        db,
        `SELECT COALESCE(SUM(total),0) as ca, COUNT(*) as nb_ventes FROM ventes WHERE boutique_id=? AND ${where}`,
        [boutiqueId]
      );

      // Gestion période pour dépenses (7j | 30j | tout)
      let depSql = "SELECT COALESCE(SUM(montant),0) as depenses, COUNT(*) as nb_depenses FROM depenses WHERE boutique_id=?";
      const depParams = [boutiqueId];
      if (periode === '7j') {
        depSql += " AND date_depense >= datetime('now','-7 days')";
      } else if (periode === '30j') {
        depSql += " AND date_depense >= datetime('now','-30 days')";
      }

      const dep = await get(db, depSql, depParams);

      const stock = await all(
        db,
        `SELECT p.nom, s.quantite, p.unite, p.prix_vente
         FROM stock s
         JOIN produits p ON p.id=s.produit_id
         WHERE s.boutique_id=? AND s.quantite>0
         ORDER BY p.nom`,
        [boutiqueId]
      );

      // Marge (approx): CA - coût stock sortis sur période n’est pas tracé ici; on renvoie CA et dépenses.
      const ca = Number(ventes.ca);
      const depenses = Number(dep.depenses);
      res.json({
        boutique_id: boutiqueId,
        periode,
        ca,
        depenses,
        resultat_net: ca - depenses,
        nb_ventes: ventes.nb_ventes,
        nb_depenses: dep.nb_depenses,
        stock_actuel: stock
      });
    } finally {
      db.close();
    }
  });

  // Serve front
  app.use(express.static(path.join(__dirname, 'public')));

  app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Serveur local démarré sur http://localhost:${PORT}`);
  });
}

start().catch((e) => {
  console.error('Erreur démarrage serveur:', e);
  process.exit(1);
});


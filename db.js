const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.sqlite');

function openDb() {
  return new sqlite3.Database(DB_PATH);
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function initDb() {
  const db = openDb();
  try {
    await run(
      db,
      `PRAGMA foreign_keys = ON;`
    );

    // Boutiques
    await run(
      db,
      `CREATE TABLE IF NOT EXISTS boutiques (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`
    );

    // Produits (communs par boutique via stock)
    await run(
      db,
      `CREATE TABLE IF NOT EXISTS produits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        unite TEXT NOT NULL DEFAULT 'u',
        prix_achat REAL NOT NULL DEFAULT 0,
        prix_vente REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(nom, unite)
      );`
    );

    // Stock : un état par boutique et produit
    await run(
      db,
      `CREATE TABLE IF NOT EXISTS stock (
        boutique_id INTEGER NOT NULL,
        produit_id INTEGER NOT NULL,
        quantite REAL NOT NULL DEFAULT 0,
        prix_cout_unitaire REAL NOT NULL DEFAULT 0,
        mise_a_jour_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (boutique_id, produit_id),
        FOREIGN KEY (boutique_id) REFERENCES boutiques(id) ON DELETE CASCADE,
        FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
      );`
    );

    // Mouvements de stock (entrées/sorties)
    // type: ENTREE | SORTIE
    await run(
      db,
      `CREATE TABLE IF NOT EXISTS stock_mouvements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        boutique_id INTEGER NOT NULL,
        produit_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('ENTREE','SORTIE')),
        quantite REAL NOT NULL,
        prix_cout_unitaire REAL NOT NULL DEFAULT 0,
        motif TEXT,
        date_mouvement TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (boutique_id) REFERENCES boutiques(id) ON DELETE CASCADE,
        FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
      );`
    );

    // Ventes
    await run(
      db,
      `CREATE TABLE IF NOT EXISTS ventes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        boutique_id INTEGER NOT NULL,
        reference TEXT,
        total REAL NOT NULL DEFAULT 0,
        mode_paiement TEXT NOT NULL DEFAULT 'especes',
        date_vente TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (boutique_id) REFERENCES boutiques(id) ON DELETE CASCADE
      );`
    );

    // Détails ventes (lignes)
    await run(
      db,
      `CREATE TABLE IF NOT EXISTS vente_lignes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vente_id INTEGER NOT NULL,
        produit_id INTEGER NOT NULL,
        quantite REAL NOT NULL,
        prix_unitaire REAL NOT NULL,
        total_ligne REAL NOT NULL,
        FOREIGN KEY (vente_id) REFERENCES ventes(id) ON DELETE CASCADE,
        FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE RESTRICT
      );`
    );

    // Dépenses
    await run(
      db,
      `CREATE TABLE IF NOT EXISTS depenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        boutique_id INTEGER NOT NULL,
        categorie TEXT NOT NULL,
        montant REAL NOT NULL,
        description TEXT,
        date_depense TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (boutique_id) REFERENCES boutiques(id) ON DELETE CASCADE
      );`
    );

    // Aucune donnée fictive (seed) n'est insérée au démarrage.
    // Les boutiques, produits et mouvements doivent être créés via l'UI / API.

    return { ok: true, dbPath: DB_PATH };
  } finally {
    db.close();
  }
}

module.exports = {
  DB_PATH,
  openDb,
  initDb,
  run,
  all,
  get
};



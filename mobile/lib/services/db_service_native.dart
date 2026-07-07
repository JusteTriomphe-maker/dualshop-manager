// db_service_native.dart
// Implémentation NATIVE de DbService (Android, iOS, Windows, macOS, Linux)
// Utilise sqflite pour le stockage SQLite local.
import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart' as p;
import '../models/vente.dart';
import '../models/produit.dart';

class DbService {
  static Database? _db;

  static Future<Database> get database async {
    if (_db != null) return _db!;
    _db = await _initDb();
    return _db!;
  }

  static Future<Database> _initDb() async {
    final dbPath = await getDatabasesPath();
    final path = p.join(dbPath, 'dualshop_mobile.db');
    return openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE produits (
            id TEXT PRIMARY KEY,
            nom TEXT NOT NULL,
            code TEXT,
            prix REAL NOT NULL,
            coutAchat REAL,
            stockActuel INTEGER NOT NULL DEFAULT 0,
            stockMin INTEGER NOT NULL DEFAULT 5,
            categorie TEXT,
            boutiqueId TEXT NOT NULL,
            actif INTEGER NOT NULL DEFAULT 1
          )
        ''');
        await db.execute('''
          CREATE TABLE ventes_offline (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            synched INTEGER NOT NULL DEFAULT 0
          )
        ''');
        await db.execute('''
          CREATE TABLE user_cache (
            id TEXT PRIMARY KEY,
            nom TEXT NOT NULL,
            email TEXT NOT NULL,
            role TEXT NOT NULL,
            boutiqueId TEXT
          )
        ''');
      },
    );
  }

  static Future<void> cacheProduits(List<Produit> produits) async {
    final db = await database;
    final batch = db.batch();
    batch.delete('produits');
    for (final p in produits) {
      batch.insert('produits', {
        'id': p.id,
        'nom': p.nom,
        'code': p.code,
        'prix': p.prix,
        'coutAchat': p.coutAchat,
        'stockActuel': p.stockActuel,
        'stockMin': p.stockMin,
        'categorie': p.categorie,
        'boutiqueId': p.boutiqueId,
        'actif': p.actif ? 1 : 0,
      });
    }
    await batch.commit(noResult: true);
  }

  static Future<List<Produit>> getCachedProduits({String? boutiqueId}) async {
    final db = await database;
    final where = boutiqueId != null ? 'WHERE boutiqueId = ?' : '';
    final rows = await db.rawQuery('SELECT * FROM produits $where ORDER BY nom',
        boutiqueId != null ? [boutiqueId] : []);
    return rows.map((r) => Produit(
      id: r['id'] as String,
      nom: r['nom'] as String,
      code: r['code'] as String?,
      prix: (r['prix'] as num).toDouble(),
      coutAchat: (r['coutAchat'] as num?)?.toDouble(),
      stockActuel: r['stockActuel'] as int,
      stockMin: r['stockMin'] as int,
      categorie: r['categorie'] as String?,
      boutiqueId: r['boutiqueId'] as String,
      actif: (r['actif'] as int) == 1,
    )).toList();
  }

  static Future<void> saveVenteOffline(Vente vente) async {
    final db = await database;
    await db.insert('ventes_offline', {
      'id': vente.id,
      'data': _venteToJson(vente),
      'createdAt': DateTime.now().toIso8601String(),
      'synched': 0,
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  static Future<List<Map<String, dynamic>>> getVentesNonSynced() async {
    final db = await database;
    return db.query('ventes_offline', where: 'synched = 0');
  }

  static Future<void> markSynced(String id) async {
    final db = await database;
    await db.update('ventes_offline', {'synched': 1}, where: 'id = ?', whereArgs: [id]);
  }

  static Future<int> countNonSynced() async {
    final db = await database;
    final res = await db.rawQuery('SELECT COUNT(*) as cnt FROM ventes_offline WHERE synched = 0');
    return Sqflite.firstIntValue(res) ?? 0;
  }

  static String _venteToJson(Vente v) {
    return jsonEncode({
      'id': v.id,
      'boutiqueId': v.boutiqueId,
      'lignes': v.lignes.map((l) => l.toJson()).toList(),
      'modePaiement': v.modePaiement,
      'total': v.total,
      'sourceDevice': 'mobile',
    });
  }
}

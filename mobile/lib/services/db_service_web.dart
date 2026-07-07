// db_service_web.dart
// Implémentation Web de DbService - utilise la mémoire + shared_preferences
// SQLite (sqflite) n'est pas disponible sur Flutter Web.
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/vente.dart';
import '../models/produit.dart';

class DbService {
  static List<Produit> _cachedProduits = [];
  static List<Map<String, dynamic>> _ventesOffline = [];
  static bool _loaded = false;

  static Future<void> _ensureLoaded() async {
    if (_loaded) return;
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('ventes_offline_web');
    if (raw != null) {
      try {
        final list = jsonDecode(raw) as List;
        _ventesOffline = list.cast<Map<String, dynamic>>();
      } catch (_) {}
    }
    _loaded = true;
  }

  static Future<void> _saveVentesOffline() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('ventes_offline_web', jsonEncode(_ventesOffline));
  }

  static Future<void> cacheProduits(List<Produit> produits) async {
    _cachedProduits = List.from(produits);
  }

  static Future<List<Produit>> getCachedProduits({String? boutiqueId}) async {
    if (boutiqueId != null) {
      return _cachedProduits.where((p) => p.boutiqueId == boutiqueId).toList();
    }
    return List.from(_cachedProduits);
  }

  static Future<void> saveVenteOffline(Vente vente) async {
    await _ensureLoaded();
    _ventesOffline.add({
      'id': vente.id,
      'data': jsonDecode(_venteToJson(vente)),
      'createdAt': DateTime.now().toIso8601String(),
      'synched': 0,
    });
    await _saveVentesOffline();
  }

  static Future<List<Map<String, dynamic>>> getVentesNonSynced() async {
    await _ensureLoaded();
    return _ventesOffline
        .where((v) => v['synched'] == 0)
        .map((v) => {
              'id': v['id'],
              'data': jsonEncode(v['data']),
              'createdAt': v['createdAt'],
              'synched': v['synched'],
            })
        .toList();
  }

  static Future<void> markSynced(String id) async {
    await _ensureLoaded();
    for (final v in _ventesOffline) {
      if (v['id'] == id) {
        v['synched'] = 1;
        break;
      }
    }
    await _saveVentesOffline();
  }

  static Future<int> countNonSynced() async {
    await _ensureLoaded();
    return _ventesOffline.where((v) => v['synched'] == 0).length;
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

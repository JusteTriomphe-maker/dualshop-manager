// db_service_stub.dart
// Stub par défaut — ne devrait jamais être chargé en pratique
// (remplacé par db_service_native.dart ou db_service_web.dart)
import '../models/vente.dart';
import '../models/produit.dart';

class DbService {
  static Future<void> cacheProduits(List<Produit> produits) async {}
  static Future<List<Produit>> getCachedProduits({String? boutiqueId}) async => [];
  static Future<void> saveVenteOffline(Vente vente) async {}
  static Future<List<Map<String, dynamic>>> getVentesNonSynced() async => [];
  static Future<void> markSynced(String id) async {}
  static Future<int> countNonSynced() async => 0;
}

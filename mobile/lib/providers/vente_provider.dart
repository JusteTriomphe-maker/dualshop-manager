import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../models/vente.dart';
import '../models/produit.dart';
import '../services/api_service.dart';
import '../services/db_service.dart';

class VenteProvider extends ChangeNotifier {
  List<LigneVente> _panier = [];
  List<Produit> _produits = [];
  String _boutiqueId = '';
  bool _loading = false;

  List<LigneVente> get panier => _panier;
  List<Produit> get produits => _produits;
  String get boutiqueId => _boutiqueId;
  bool get loading => _loading;

  double get total => _panier.fold(0, (s, l) => s + l.sousTotal);

  void setBoutique(String id) {
    _boutiqueId = id;
    notifyListeners();
  }

  Future<void> loadProduits() async {
    if (_boutiqueId.isEmpty) return;
    _loading = true;
    notifyListeners();
    try {
      final res = await ApiService.get('/produits', params: {'boutiqueId': _boutiqueId});
      _produits = (res as List).map((p) => Produit.fromJson(p)).toList();
      await DbService.cacheProduits(_produits);
    } catch (_) {
      _produits = await DbService.getCachedProduits(boutiqueId: _boutiqueId);
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  void addProduit(Produit p) {
    final idx = _panier.indexWhere((l) => l.produitId == p.id);
    if (idx >= 0) {
      final l = _panier[idx];
      _panier[idx] = LigneVente(
        produitId: l.produitId,
        produitNom: l.produitNom,
        quantite: l.quantite + 1,
        prixUnit: l.prixUnit,
        sousTotal: (l.quantite + 1) * l.prixUnit,
      );
    } else {
      _panier.add(LigneVente(
        produitId: p.id,
        produitNom: p.nom,
        quantite: 1,
        prixUnit: p.prix,
        sousTotal: p.prix,
      ));
    }
    notifyListeners();
  }

  void updateQuantite(String produitId, int qte) {
    if (qte <= 0) {
      _panier.removeWhere((l) => l.produitId == produitId);
    } else {
      final idx = _panier.indexWhere((l) => l.produitId == produitId);
      if (idx >= 0) {
        _panier[idx] = LigneVente(
          produitId: _panier[idx].produitId,
          produitNom: _panier[idx].produitNom,
          quantite: qte,
          prixUnit: _panier[idx].prixUnit,
          sousTotal: qte * _panier[idx].prixUnit,
        );
      }
    }
    notifyListeners();
  }

  void clearPanier() {
    _panier = [];
    notifyListeners();
  }

  Future<Map<String, dynamic>> validerVente(String modePaiement, {String? numeroTable, String? clientId}) async {
    if (_boutiqueId.isEmpty) throw Exception('Sélectionnez une boutique');
    if (_panier.isEmpty) throw Exception('Panier vide');

    final uuid = const Uuid().v4();
    final vente = Vente(
      id: uuid,
      boutiqueId: _boutiqueId,
      caissierId: clientId ?? '',
      lignes: List.from(_panier),
      total: total,
      modePaiement: modePaiement,
      sourceDevice: 'mobile',
      numeroTable: numeroTable,
    );

    try {
      final res = await ApiService.post('/ventes', body: vente.toJson());
      clearPanier();
      return {'status': 'synced', 'data': res};
    } catch (_) {
      await DbService.saveVenteOffline(vente);
      clearPanier();
      return {'status': 'offline', 'id': uuid};
    }
  }
}

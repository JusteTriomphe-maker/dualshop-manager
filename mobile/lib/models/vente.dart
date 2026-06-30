class LigneVente {
  final String? id;
  final String produitId;
  String? produitNom;
  final int quantite;
  final double prixUnit;
  final double sousTotal;

  LigneVente({
    this.id,
    required this.produitId,
    this.produitNom,
    required this.quantite,
    required this.prixUnit,
    required this.sousTotal,
  });

  factory LigneVente.fromJson(Map<String, dynamic> json) {
    return LigneVente(
      id: json['id'],
      produitId: json['produitId'],
      produitNom: json['produit']?['nom'],
      quantite: json['quantite'],
      prixUnit: (json['prixUnit'] as num).toDouble(),
      sousTotal: (json['sousTotal'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
    if (id != null) 'id': id,
    'produitId': produitId,
    'quantite': quantite,
    'prixUnit': prixUnit,
    'sousTotal': sousTotal,
  };
}

class Vente {
  final String? id;
  final String? numero;
  final String boutiqueId;
  final String caissierId;
  final List<LigneVente> lignes;
  final double total;
  final String modePaiement;
  final String statut;
  final DateTime? createdAt;
  final DateTime? synchedAt;
  final String? sourceDevice;
  final String? numeroTable;

  Vente({
    this.id,
    this.numero,
    required this.boutiqueId,
    required this.caissierId,
    required this.lignes,
    required this.total,
    this.modePaiement = 'ESPECES',
    this.statut = 'COMPLETEE',
    this.createdAt,
    this.synchedAt,
    this.sourceDevice,
    this.numeroTable,
  });

  factory Vente.fromJson(Map<String, dynamic> json) {
    return Vente(
      id: json['id'],
      numero: json['numero'],
      boutiqueId: json['boutiqueId'],
      caissierId: json['caissierIId'] ?? json['caissierId'] ?? '',
      lignes: (json['lignes'] as List? ?? [])
          .map((l) => LigneVente.fromJson(l))
          .toList(),
      total: (json['total'] as num).toDouble(),
      modePaiement: json['modePaiement'] ?? 'ESPECES',
      statut: json['statut'] ?? 'COMPLETEE',
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      synchedAt: json['synchedAt'] != null ? DateTime.parse(json['synchedAt']) : null,
      sourceDevice: json['sourceDevice'],
      numeroTable: json['numeroTable'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'numero': numero,
    'boutiqueId': boutiqueId,
    'caissierId': caissierId,
    'lignes': lignes.map((l) => l.toJson()).toList(),
    'total': total,
    'modePaiement': modePaiement,
    'statut': statut,
    'sourceDevice': sourceDevice ?? 'mobile',
    if (numeroTable != null) 'numeroTable': numeroTable,
  };
}

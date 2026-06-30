class Produit {
  final String id;
  final String nom;
  final String? code;
  final double prix;
  final double? coutAchat;
  final int stockActuel;
  final int stockMin;
  final String? categorie;
  final String boutiqueId;
  final bool actif;

  Produit({
    required this.id,
    required this.nom,
    this.code,
    required this.prix,
    this.coutAchat,
    required this.stockActuel,
    required this.stockMin,
    this.categorie,
    required this.boutiqueId,
    required this.actif,
  });

  factory Produit.fromJson(Map<String, dynamic> json) {
    return Produit(
      id: json['id'],
      nom: json['nom'],
      code: json['code'],
      prix: (json['prix'] as num).toDouble(),
      coutAchat: json['coutAchat'] != null ? (json['coutAchat'] as num).toDouble() : null,
      stockActuel: json['stockActuel'] ?? 0,
      stockMin: json['stockMin'] ?? 5,
      categorie: json['categorie'],
      boutiqueId: json['boutiqueId'],
      actif: json['actif'] ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'nom': nom,
    'code': code,
    'prix': prix,
    'coutAchat': coutAchat,
    'stockActuel': stockActuel,
    'stockMin': stockMin,
    'categorie': categorie,
    'boutiqueId': boutiqueId,
    'actif': actif,
  };
}

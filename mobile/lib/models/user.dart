class User {
  final String id;
  final String nom;
  final String email;
  final String role;
  final String? boutiqueId;
  final String? boutiqueType;

  User({
    required this.id,
    required this.nom,
    required this.email,
    required this.role,
    this.boutiqueId,
    this.boutiqueType,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      nom: json['nom'],
      email: json['email'],
      role: json['role'],
      boutiqueId: json['boutiqueId'],
      boutiqueType: json['boutiqueType'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'nom': nom,
    'email': email,
    'role': role,
    'boutiqueId': boutiqueId,
    'boutiqueType': boutiqueType,
  };

  bool get isDG => role == 'DG';
  bool get isGerant => role == 'GERANT';
  bool get isCaissier => role == 'CAISSIER';
}

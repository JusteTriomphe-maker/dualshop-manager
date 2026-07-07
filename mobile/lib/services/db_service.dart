// db_service.dart
// Sélectionne automatiquement l'implémentation selon la plateforme :
// - Web : db_service_web.dart (mémoire + SharedPreferences, pas de SQLite)
// - Mobile/Desktop natif : db_service_native.dart (sqflite)
export 'db_service_stub.dart'
    if (dart.library.io) 'db_service_native.dart'
    if (dart.library.html) 'db_service_web.dart';

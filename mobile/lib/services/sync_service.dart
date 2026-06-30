import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'api_service.dart';
import 'db_service.dart';

class SyncService {
  static Timer? _timer;
  static bool _syncing = false;

  static void start() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => sync());
    Connectivity().onConnectivityChanged.listen((result) {
      if (result.contains(ConnectivityResult.mobile) || result.contains(ConnectivityResult.wifi)) {
        sync();
      }
    });
  }

  static void stop() {
    _timer?.cancel();
    _timer = null;
  }

  static Future<int> countPending() async {
    return DbService.countNonSynced();
  }

  static Future<Map<String, dynamic>> sync() async {
    if (_syncing) return {'status': 'already_syncing'};
    _syncing = true;
    final results = <String, dynamic>{};
    try {
      final ventes = await DbService.getVentesNonSynced();
      if (ventes.isEmpty) {
        results['synced'] = 0;
        return results;
      }
      final batch = ventes.map((v) {
        try {
          return Map<String, dynamic>.from(v['data'] as Map);
        } catch (_) {
          return <String, dynamic>{'id': v['id']};
        }
      }).toList();

      final res = await ApiService.post('/ventes/sync', body: {'ventes': batch});
      final syncResults = res['results'] as List? ?? [];
      for (final sr in syncResults) {
        if (sr['status'] == 'synced' || sr['status'] == 'duplicate') {
          await DbService.markSynced(sr['localId'] ?? sr['serverId']);
        }
      }
      results['synced'] = syncResults.where((s) => s['status'] == 'synced').length;
      results['total'] = ventes.length;
    } catch (e) {
      results['error'] = e.toString();
    } finally {
      _syncing = false;
    }
    return results;
  }

  static Stream<int> get pendingCountStream => Stream.periodic(
    const Duration(seconds: 10),
    (_) => countPending(),
  ).asyncMap((_) => countPending());
}

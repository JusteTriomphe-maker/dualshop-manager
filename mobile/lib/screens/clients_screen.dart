import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ClientsScreen extends StatefulWidget {
  const ClientsScreen({super.key});

  @override
  State<ClientsScreen> createState() => _ClientsScreenState();
}

class _ClientsScreenState extends State<ClientsScreen> {
  List _clients = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.get('/clients');
      _clients = (res as List);
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: _clients.length,
              itemBuilder: (_, i) {
                final c = _clients[i];
                return ListTile(
                  title: Text(c['nom'] ?? ''),
                  subtitle: Text('${c['telephone'] ?? ''} | ${c['_count']?['dettes'] ?? 0} dette(s)'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => _showDetails(c),
                );
              },
            ),
    );
  }

  void _showDetails(Map c) async {
    try {
      final res = await ApiService.get('/clients/${c['id']}');
      if (!mounted) return;
      final dettes = (res['dettes'] as List?) ?? [];
      final totalDues = (res['totalDues'] as num?)?.toDouble() ?? 0;

      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        builder: (_) => DraggableScrollableSheet(
          initialChildSize: 0.7,
          builder: (_, scrollCtrl) => Padding(
            padding: const EdgeInsets.all(16),
            child: ListView(
              controller: scrollCtrl,
              children: [
                Text(c['nom'], style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                Text('Tél: ${c['telephone'] ?? '-'}'),
                const SizedBox(height: 16),
                Text('Total impayé: ${totalDues.toStringAsFixed(0)} F',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.red)),
                const SizedBox(height: 16),
                const Text('Dettes', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ...dettes.map((d) => Card(
                  child: ListTile(
                    title: Text('${d['montantRestant']} / ${d['montant']} F'),
                    subtitle: Text(d['description'] ?? ''),
                    trailing: Text(d['statut'] ?? '', style: TextStyle(
                      color: d['statut'] == 'PAYEE' ? Colors.green : d['statut'] == 'PARTIELLE' ? Colors.orange : Colors.red,
                    )),
                  ),
                )),
              ],
            ),
          ),
        ),
      );
    } catch (_) {}
  }
}

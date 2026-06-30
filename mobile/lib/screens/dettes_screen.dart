import 'package:flutter/material.dart';
import '../services/api_service.dart';

class DettesScreen extends StatefulWidget {
  const DettesScreen({super.key});

  @override
  State<DettesScreen> createState() => _DettesScreenState();
}

class _DettesScreenState extends State<DettesScreen> {
  Map _data = {};
  bool _loading = true;
  String _type = 'clients';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.get('/dettes/rapport');
      _data = res as Map;
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final dettesClients = (_data['clients']?['dettes'] as List?) ?? [];
    final dettesFournisseurs = (_data['fournisseurs']?['dettes'] as List?) ?? [];
    final totalImpaye = (_data['clients']?['totalImpaye'] as num?)?.toDouble() ?? 0;
    final totalDu = (_data['fournisseurs']?['totalDu'] as num?)?.toDouble() ?? 0;

    return RefreshIndicator(
      onRefresh: _load,
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Row(
                  children: [
                    Expanded(child: _summaryCard('Créances', '$totalImpaye F', Colors.red)),
                    const SizedBox(width: 12),
                    Expanded(child: _summaryCard('Dues', '$totalDu F', Colors.orange)),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    _typeBtn('Clients (${dettesClients.length})', 'clients'),
                    const SizedBox(width: 8),
                    _typeBtn('Fournisseurs (${dettesFournisseurs.length})', 'fournisseurs'),
                  ],
                ),
                const SizedBox(height: 12),
                ...(_type == 'clients' ? dettesClients : dettesFournisseurs).map((dynamic d) {
                  final isClient = _type == 'clients';
                  final Map client = isClient ? (d['client'] ?? {}) : (d['fournisseur'] ?? {});
                  final nom = client['nom'] ?? '';
                  final montant = isClient
                      ? '${d['montantRestant']} F'
                      : '${(d['montantDu'] as num? ?? 0) - (d['montantPaye'] as num? ?? 0)} F';
                  return Card(
                    child: ListTile(
                      title: Text(nom ?? ''),
                      subtitle: Text(d['description'] ?? ''),
                      trailing: Text(montant, style: const TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  );
                }),
                if (_type == 'clients' && dettesClients.isEmpty)
                  const Center(child: Text('Aucune dette client')),
                if (_type == 'fournisseurs' && dettesFournisseurs.isEmpty)
                  const Center(child: Text('Aucune dette fournisseur')),
              ],
            ),
    );
  }

  Widget _summaryCard(String label, String value, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text(label, style: const TextStyle(color: Colors.grey)),
            Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _typeBtn(String label, String type) {
    return Expanded(
      child: ElevatedButton(
        onPressed: () => setState(() => _type = type),
        style: ElevatedButton.styleFrom(
          backgroundColor: _type == type ? Colors.blue : Colors.grey[200],
          foregroundColor: _type == type ? Colors.white : Colors.black,
        ),
        child: Text(label),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/vente.dart';

class HistoriqueScreen extends StatefulWidget {
  const HistoriqueScreen({super.key});

  @override
  State<HistoriqueScreen> createState() => _HistoriqueScreenState();
}

class _HistoriqueScreenState extends State<HistoriqueScreen> {
  List<Vente> _ventes = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.get('/ventes');
      _ventes = (res as List).map((v) => Vente.fromJson(v)).toList();
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : _ventes.isEmpty
              ? const Center(child: Text('Aucune vente'))
              : ListView.builder(
                  itemCount: _ventes.length,
                  itemBuilder: (_, i) {
                    final v = _ventes[i];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      child: ListTile(
                        title: Text(v.numero ?? 'N/A', style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(
                          '${v.createdAt?.toString().substring(0, 16) ?? ''} — ${v.modePaiement}',
                        ),
                        trailing: Text(
                          '${v.total.toStringAsFixed(0)} F',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}

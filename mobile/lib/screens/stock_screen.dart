import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/vente_provider.dart';
import '../services/db_service.dart';
import '../models/produit.dart';

class StockScreen extends StatefulWidget {
  const StockScreen({super.key});

  @override
  State<StockScreen> createState() => _StockScreenState();
}

class _StockScreenState extends State<StockScreen> {
  List<Produit> _produits = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final vp = context.read<VenteProvider>();
    if (vp.boutiqueId.isNotEmpty) {
      await vp.loadProduits();
    }
    _produits = await DbService.getCachedProduits();
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: _produits.length,
              itemBuilder: (_, i) {
                final p = _produits[i];
                final isLow = p.stockActuel <= p.stockMin;
                return ListTile(
                  title: Text(p.nom, style: TextStyle(fontWeight: isLow ? FontWeight.bold : FontWeight.normal)),
                  subtitle: Text('${p.categorie ?? 'Général'} | ${p.prix.toStringAsFixed(0)} F'),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: p.stockActuel <= 0 ? Colors.red : isLow ? Colors.orange : Colors.green,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${p.stockActuel}',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                );
              },
            ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/vente_provider.dart';
import '../providers/auth_provider.dart';

class VenteScreen extends StatefulWidget {
  const VenteScreen({super.key});

  @override
  State<VenteScreen> createState() => _VenteScreenState();
}

class _VenteScreenState extends State<VenteScreen> {
  String _modePaiement = 'ESPECES';
  String _numeroTable = '';
  String _nouveauClient = '';
  String _clientId = '';
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final vp = context.read<VenteProvider>();
      final user = context.read<AuthProvider>().user;
      if (user?.boutiqueId != null) {
        vp.setBoutique(user!.boutiqueId!);
        vp.loadProduits();
      }
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final vp = context.watch<VenteProvider>();
    final auth = context.watch<AuthProvider>();
    final isDG = auth.user?.isDG ?? false;

    final filtered = vp.produits
        .where((p) => p.stockActuel > 0)
        .where((p) => _searchCtrl.text.isEmpty || p.nom.toLowerCase().contains(_searchCtrl.text.toLowerCase()))
        .toList();

    return Column(
      children: [
        if (isDG)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: DropdownButtonFormField<String>(
                initialValue: vp.boutiqueId.isEmpty ? null : vp.boutiqueId,
                decoration: const InputDecoration(labelText: 'Boutique', border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: 'boutique-epicerie', child: Text('Épicerie')),
                  DropdownMenuItem(value: 'boutique-restaubar', child: Text('Restau-bar')),
                ],
                onChanged: (v) {
                  if (v != null) {
                    vp.setBoutique(v);
                    vp.loadProduits();
                  }
                },
              ),
          ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: TextField(
            controller: _searchCtrl,
            decoration: const InputDecoration(
              hintText: 'Rechercher un produit...',
              prefixIcon: Icon(Icons.search),
              border: OutlineInputBorder(),
            ),
            onChanged: (_) => setState(() {}),
          ),
        ),
        Expanded(
          child: vp.loading
              ? const Center(child: CircularProgressIndicator())
              : ListView.builder(
                  itemCount: filtered.length,
                  itemBuilder: (_, i) {
                    final p = filtered[i];
                    return ListTile(
                      title: Text(p.nom),
                      subtitle: Text('${p.prix.toStringAsFixed(0)} F | Stock: ${p.stockActuel}'),
                      trailing: IconButton(
                        icon: const Icon(Icons.add_circle, color: Colors.blue),
                        onPressed: () => vp.addProduit(p),
                      ),
                    );
                  },
                ),
        ),
        if (vp.panier.isNotEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 8)],
            ),
            child: Column(
              children: [
                SizedBox(
                  height: 120,
                  child: ListView.builder(
                    itemCount: vp.panier.length,
                    itemBuilder: (_, i) {
                      final l = vp.panier[i];
                      return ListTile(
                        dense: true,
                        title: Text(l.produitNom ?? ''),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove_circle_outline, size: 18),
                              onPressed: () => vp.updateQuantite(l.produitId, l.quantite - 1),
                            ),
                            Text('${l.quantite}'),
                            IconButton(
                              icon: const Icon(Icons.add_circle_outline, size: 18),
                              onPressed: () => vp.updateQuantite(l.produitId, l.quantite + 1),
                            ),
                            SizedBox(
                              width: 80,
                              child: Text('${l.sousTotal.toStringAsFixed(0)} F', textAlign: TextAlign.right),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: TextField(
                    decoration: const InputDecoration(
                      labelText: 'N° table (Restau-bar)',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    onChanged: (v) => _numeroTable = v,
                  ),
                ),
                Row(
                  children: [
                    Text('Total: ${vp.total.toStringAsFixed(0)} F', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const Spacer(),
                    SizedBox(
                      width: 130,
                      child: DropdownButtonFormField<String>(
                        initialValue: _modePaiement,
                        items: const [
                          DropdownMenuItem(value: 'ESPECES', child: Text('Espèces')),
                          DropdownMenuItem(value: 'MOBILE_MONEY', child: Text('Mobile Money')),
                          DropdownMenuItem(value: 'CARTE', child: Text('Carte')),
                          DropdownMenuItem(value: 'CREDIT', child: Text('Crédit')),
                        ],
                        onChanged: (v) => setState(() {
                          _modePaiement = v!;
                          if (v != 'CREDIT') { _clientId = ''; _nouveauClient = ''; }
                        }),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: () async {
                        if (_modePaiement == 'CREDIT' && _clientId.isEmpty && _nouveauClient.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Choisissez ou saisissez un client')));
                          return;
                        }
                        try {
                          final res = await vp.validerVente(_modePaiement, numeroTable: _numeroTable.isEmpty ? null : _numeroTable);
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                              content: Text(res['status'] == 'synced' ? 'Vente enregistrée!' : 'Vente sauvegardée (hors-ligne)'),
                            ));
                          }
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                          }
                        }
                      },
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                      child: const Text('Valider', style: TextStyle(color: Colors.white)),
                    ),
                  ],
                ),
                if (_modePaiement == 'CREDIT')
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Column(
                      children: [
                        DropdownButtonFormField<String>(
                          decoration: const InputDecoration(labelText: 'Client existant', border: OutlineInputBorder(), isDense: true),
                          items: const [DropdownMenuItem(value: '', child: Text('Choisir...'))],
                          onChanged: (v) => setState(() { _clientId = v ?? ''; _nouveauClient = ''; }),
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 4),
                          child: Text('— ou —', style: TextStyle(color: Colors.grey)),
                        ),
                        TextField(
                          decoration: const InputDecoration(labelText: 'Nouveau client', border: OutlineInputBorder(), isDense: true),
                          onChanged: (v) => setState(() { _nouveauClient = v; _clientId = ''; }),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
      ],
    );
  }
}

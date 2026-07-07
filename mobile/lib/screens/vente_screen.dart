import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:printing/printing.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
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
        vp.setBoutique(user!.boutiqueId!, type: user.boutiqueType);
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

    final isRestaubar = vp.boutiqueType == 'RESTAUBAR';

    final filtered = vp.produits
        .where((p) => p.stockActuel > 0)
        .where(
          (p) =>
              _searchCtrl.text.isEmpty ||
              p.nom.toLowerCase().contains(_searchCtrl.text.toLowerCase()),
        )
        .toList();

    return Column(
      children: [
        if (isDG)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: DropdownButtonFormField<String>(
              initialValue: vp.boutiqueId.isEmpty ? null : vp.boutiqueId,
              decoration: const InputDecoration(
                labelText: 'Boutique',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(
                  value: 'boutique-epicerie',
                  child: Text('Épicerie'),
                ),
                DropdownMenuItem(
                  value: 'boutique-restaubar',
                  child: Text('Restau-bar'),
                ),
              ],
              onChanged: (v) {
                if (v != null) {
                  vp.setBoutique(
                    v,
                    type: v == 'boutique-restaubar' ? 'RESTAUBAR' : 'EPICERIE',
                  );
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
                      subtitle: Text(
                        '${p.prix.toStringAsFixed(0)} F | Stock: ${p.stockActuel}',
                      ),
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
                              icon: const Icon(
                                Icons.remove_circle_outline,
                                size: 18,
                              ),
                              onPressed: () => vp.updateQuantite(
                                l.produitId,
                                l.quantite - 1,
                              ),
                            ),
                            Text('${l.quantite}'),
                            IconButton(
                              icon: const Icon(
                                Icons.add_circle_outline,
                                size: 18,
                              ),
                              onPressed: () => vp.updateQuantite(
                                l.produitId,
                                l.quantite + 1,
                              ),
                            ),
                            SizedBox(
                              width: 80,
                              child: Text(
                                '${l.sousTotal.toStringAsFixed(0)} F',
                                textAlign: TextAlign.right,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                if (isRestaubar)
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
                    Text(
                      'Total: ${vp.total.toStringAsFixed(0)} F',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const Spacer(),
                    SizedBox(
                      width: 130,
                      child: DropdownButtonFormField<String>(
                        initialValue: _modePaiement,
                        items: const [
                          DropdownMenuItem(
                            value: 'ESPECES',
                            child: Text('Espèces'),
                          ),
                          DropdownMenuItem(
                            value: 'MOBILE_MONEY',
                            child: Text('Mobile Money'),
                          ),
                          DropdownMenuItem(
                            value: 'CARTE',
                            child: Text('Carte'),
                          ),
                          DropdownMenuItem(
                            value: 'CREDIT',
                            child: Text('Crédit'),
                          ),
                        ],
                        onChanged: (v) => setState(() {
                          _modePaiement = v!;
                          if (v != 'CREDIT') {
                            _clientId = '';
                            _nouveauClient = '';
                          }
                        }),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: () async {
                        final messenger = ScaffoldMessenger.of(context);
                        if (_modePaiement == 'CREDIT' &&
                            _clientId.isEmpty &&
                            _nouveauClient.isEmpty) {
                          messenger.showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Choisissez ou saisissez un client',
                              ),
                            ),
                          );
                          return;
                        }
                        try {
                          final res = await vp.validerVente(
                            _modePaiement,
                            numeroTable: isRestaubar && _numeroTable.isNotEmpty
                                ? _numeroTable
                                : null,
                          );
                          if (!mounted) return;
                          messenger.showSnackBar(
                            SnackBar(
                              content: Text(
                                res['status'] == 'synced'
                                    ? 'Vente enregistrée!'
                                    : 'Vente sauvegardée (hors-ligne)',
                              ),
                            ),
                          );
                          if (res['status'] == 'synced' && res['data'] != null) {
                            _showReceiptDialog(res['data']);
                          }
                        } catch (e) {
                          if (!mounted) return;
                          messenger.showSnackBar(
                            SnackBar(content: Text(e.toString())),
                          );
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                      ),
                      child: const Text(
                        'Valider',
                        style: TextStyle(color: Colors.white),
                      ),
                    ),
                  ],
                ),
                if (_modePaiement == 'CREDIT')
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Column(
                      children: [
                        DropdownButtonFormField<String>(
                          decoration: const InputDecoration(
                            labelText: 'Client existant',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                          items: const [
                            DropdownMenuItem(
                              value: '',
                              child: Text('Choisir...'),
                            ),
                          ],
                          onChanged: (v) => setState(() {
                            _clientId = v ?? '';
                            _nouveauClient = '';
                          }),
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 4),
                          child: Text(
                            '— ou —',
                            style: TextStyle(color: Colors.grey),
                          ),
                        ),
                        TextField(
                          decoration: const InputDecoration(
                            labelText: 'Nouveau client',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                          onChanged: (v) => setState(() {
                            _nouveauClient = v;
                            _clientId = '';
                          }),
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

  String _formatPayment(String mode) {
    switch (mode) {
      case 'ESPECES':
        return 'Espèces';
      case 'MOBILE_MONEY':
        return 'Mobile Money';
      case 'CARTE':
        return 'Carte';
      case 'CREDIT':
        return 'Crédit';
      default:
        return mode;
    }
  }

  Future<void> _printReceipt(Map<String, dynamic> vente) async {
    final doc = pw.Document();

    final lines = vente['lignes'] as List? ?? [];
    final boutique = vente['boutique'] as Map? ?? {};
    final caissier = vente['caissier'] as Map? ?? {};
    final client = vente['client'] as Map? ?? {};
    final String numero = vente['numero'] ?? '';
    final String modePaiement = vente['modePaiement'] ?? '';
    final double total = (vente['total'] as num? ?? 0).toDouble();
    final String? tableNum = vente['numeroTable'];
    final DateTime date = DateTime.tryParse(vente['createdAt'] ?? '') ?? DateTime.now();

    doc.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.roll80,
        margin: const pw.EdgeInsets.all(5),
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Center(
                child: pw.Text(
                  boutique['nom']?.toString().toUpperCase() ?? 'BOUTIQUE',
                  style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 12),
                ),
              ),
              pw.Center(
                child: pw.Text('République du Congo', style: const pw.TextStyle(fontSize: 8)),
              ),
              pw.Text('=' * 32),
              pw.Text('N°: $numero', style: const pw.TextStyle(fontSize: 8)),
              pw.Text('Date: ${DateFormat('dd/MM/yyyy HH:mm').format(date)}', style: const pw.TextStyle(fontSize: 8)),
              pw.Text('Caissier: ${caissier['nom'] ?? ''}', style: const pw.TextStyle(fontSize: 8)),
              if (tableNum != null) pw.Text('Table: N° $tableNum', style: const pw.TextStyle(fontSize: 8)),
              if (client['nom'] != null) pw.Text('Client: ${client['nom']}', style: const pw.TextStyle(fontSize: 8)),
              pw.Text('=' * 32),
              
              // Items
              pw.Row(
                children: [
                  pw.Expanded(child: pw.Text('Article', style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold))),
                  pw.Text('Qté', style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold)),
                  pw.SizedBox(width: 25, child: pw.Text('P.U', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold))),
                  pw.SizedBox(width: 35, child: pw.Text('Total', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold))),
                ],
              ),
              pw.Divider(),
              ...lines.map((l) {
                final prod = l['produit'] as Map? ?? {};
                final double price = (l['prixUnit'] as num? ?? 0).toDouble();
                final double sub = (l['sousTotal'] as num? ?? 0).toDouble();
                return pw.Row(
                  children: [
                    pw.Expanded(child: pw.Text(prod['nom']?.toString() ?? '', style: const pw.TextStyle(fontSize: 8))),
                    pw.Text(l['quantite']?.toString() ?? '0', style: const pw.TextStyle(fontSize: 8)),
                    pw.SizedBox(width: 25, child: pw.Text(price.toStringAsFixed(0), textAlign: pw.TextAlign.right, style: const pw.TextStyle(fontSize: 8))),
                    pw.SizedBox(width: 35, child: pw.Text(sub.toStringAsFixed(0), textAlign: pw.TextAlign.right, style: const pw.TextStyle(fontSize: 8))),
                  ],
                );
              }),
              pw.Text('=' * 32),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('TOTAL À PAYER', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10)),
                  pw.Text('${total.toStringAsFixed(0)} FCFA', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10)),
                ],
              ),
              pw.Text('=' * 32),
              pw.Text('Paiement: ${_formatPayment(modePaiement)}', style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold)),
              pw.Text('-' * 32),
              pw.Center(
                child: pw.Text('Merci de votre visite !', style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold)),
              ),
              pw.Center(
                child: pw.Text('À très bientôt', style: pw.TextStyle(fontSize: 7)),
              ),
            ],
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => doc.save(),
      name: 'recu_$numero.pdf',
    );
  }

  void _showReceiptDialog(Map<String, dynamic> vente) {
    final lines = vente['lignes'] as List? ?? [];
    final boutique = vente['boutique'] as Map? ?? {};
    final caissier = vente['caissier'] as Map? ?? {};
    final client = vente['client'] as Map? ?? {};
    final String numero = vente['numero'] ?? '';
    final String modePaiement = vente['modePaiement'] ?? '';
    final double total = (vente['total'] as num? ?? 0).toDouble();
    final String? tableNum = vente['numeroTable'];
    final DateTime date = DateTime.tryParse(vente['createdAt'] ?? '') ?? DateTime.now();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return AlertDialog(
          title: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.green),
              const SizedBox(width: 8),
              const Text('Vente enregistrée'),
            ],
          ),
          content: Container(
            width: double.maxFinite,
            constraints: const BoxConstraints(maxWidth: 400, maxHeight: 500),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(4),
            ),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Center(
                    child: Text(
                      boutique['nom']?.toString().toUpperCase() ?? 'BOUTIQUE',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, fontFamily: 'monospace'),
                    ),
                  ),
                  const Center(
                    child: Text('République du Congo', style: TextStyle(fontSize: 11, fontFamily: 'monospace')),
                  ),
                  const SizedBox(height: 8),
                  Text('================================', style: TextStyle(color: Colors.grey.shade600, fontFamily: 'monospace')),
                  Text('N°: $numero', style: const TextStyle(fontFamily: 'monospace', fontSize: 12)),
                  Text('Date: ${DateFormat('dd/MM/yyyy HH:mm').format(date)}', style: const TextStyle(fontFamily: 'monospace', fontSize: 12)),
                  Text('Caissier: ${caissier['nom'] ?? ''}', style: const TextStyle(fontFamily: 'monospace', fontSize: 12)),
                  if (tableNum != null) Text('Table: N° $tableNum', style: const TextStyle(fontFamily: 'monospace', fontSize: 12)),
                  if (client['nom'] != null) Text('Client: ${client['nom']}', style: const TextStyle(fontFamily: 'monospace', fontSize: 12)),
                  Text('================================', style: TextStyle(color: Colors.grey.shade600, fontFamily: 'monospace')),
                  
                  const Row(
                    children: [
                      Expanded(child: Text('Article', style: TextStyle(fontWeight: FontWeight.bold, fontFamily: 'monospace'))),
                      Text('Qté', style: TextStyle(fontWeight: FontWeight.bold, fontFamily: 'monospace')),
                      SizedBox(width: 50, child: Text('P.U', textAlign: TextAlign.right, style: TextStyle(fontWeight: FontWeight.bold, fontFamily: 'monospace'))),
                      SizedBox(width: 70, child: Text('Total', textAlign: TextAlign.right, style: TextStyle(fontWeight: FontWeight.bold, fontFamily: 'monospace'))),
                    ],
                  ),
                  Text('--------------------------------', style: TextStyle(color: Colors.grey.shade400, fontFamily: 'monospace')),
                  ...lines.map((l) {
                    final prod = l['produit'] as Map? ?? {};
                    final double price = (l['prixUnit'] as num? ?? 0).toDouble();
                    final double subTotal = (l['sousTotal'] as num? ?? 0).toDouble();
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Row(
                        children: [
                          Expanded(child: Text(prod['nom']?.toString() ?? '', style: const TextStyle(fontFamily: 'monospace', fontSize: 12))),
                          Text('${l['quantite']}', style: const TextStyle(fontFamily: 'monospace', fontSize: 12)),
                          SizedBox(width: 50, child: Text(price.toStringAsFixed(0), textAlign: TextAlign.right, style: const TextStyle(fontFamily: 'monospace', fontSize: 12))),
                          SizedBox(width: 70, child: Text(subTotal.toStringAsFixed(0), textAlign: TextAlign.right, style: const TextStyle(fontFamily: 'monospace', fontSize: 12))),
                        ],
                      ),
                    );
                  }),
                  Text('================================', style: TextStyle(color: Colors.grey.shade600, fontFamily: 'monospace')),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('TOTAL À PAYER', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, fontFamily: 'monospace')),
                      Text('${total.toStringAsFixed(0)} FCFA', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, fontFamily: 'monospace')),
                    ],
                  ),
                  Text('================================', style: TextStyle(color: Colors.grey.shade600, fontFamily: 'monospace')),
                  Text('Paiement: ${_formatPayment(modePaiement)}', style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'monospace', fontSize: 12)),
                  Text('--------------------------------', style: TextStyle(color: Colors.grey.shade400, fontFamily: 'monospace')),
                  const SizedBox(height: 8),
                  const Center(
                    child: Text('Merci de votre visite !', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, fontFamily: 'monospace')),
                  ),
                  const Center(
                    child: Text('À très bientôt', style: TextStyle(fontSize: 11, fontFamily: 'monospace', color: Colors.grey)),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Fermer'),
            ),
            FilledButton.icon(
              onPressed: () {
                _printReceipt(vente);
              },
              icon: const Icon(Icons.print),
              label: const Text('Imprimer'),
            ),
          ],
        );
      },
    );
  }
}

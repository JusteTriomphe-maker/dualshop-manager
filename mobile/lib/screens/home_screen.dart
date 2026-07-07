import 'package:flutter/material.dart';
import 'vente_screen.dart';
import 'stock_screen.dart';
import 'historique_screen.dart';
import 'clients_screen.dart';
import 'dettes_screen.dart';
import '../services/sync_service.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  int _pendingSync = 0;

  final _pages = const [
    VenteScreen(),
    StockScreen(),
    HistoriqueScreen(),
    ClientsScreen(),
    DettesScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _checkSync();
    SyncService.start();
  }

  @override
  void dispose() {
    SyncService.stop();
    super.dispose();
  }

  void _checkSync() async {
    final count = await SyncService.countPending();
    if (!mounted) return;
    setState(() => _pendingSync = count);
    Future.delayed(const Duration(seconds: 10), () {
      if (mounted) _checkSync();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('DualShop'),
        actions: [
          if (_pendingSync > 0)
            Center(
              child: Container(
                margin: const EdgeInsets.only(right: 8),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.orange,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$_pendingSync en attente',
                  style: const TextStyle(color: Colors.white, fontSize: 11),
                ),
              ),
            ),
          IconButton(
            icon: const Icon(Icons.sync),
            onPressed: () async {
              final messenger = ScaffoldMessenger.of(context);
              final res = await SyncService.sync();
              if (mounted) {
                messenger.showSnackBar(
                  SnackBar(
                    content: Text(
                      res['synced'] != null
                          ? '${res['synced']} ventes synchronisées'
                          : 'Sync terminée',
                    ),
                  ),
                );
                _checkSync();
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => auth.logout(),
          ),
        ],
      ),
      body: _pages[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.point_of_sale),
            label: 'Vente',
          ),
          NavigationDestination(icon: Icon(Icons.inventory), label: 'Stock'),
          NavigationDestination(icon: Icon(Icons.history), label: 'Ventes'),
          NavigationDestination(icon: Icon(Icons.people), label: 'Clients'),
          NavigationDestination(
            icon: Icon(Icons.account_balance_wallet),
            label: 'Dettes',
          ),
        ],
      ),
    );
  }
}

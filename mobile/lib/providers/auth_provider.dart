import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  bool _loading = false;
  String? _error;

  User? get user => _user;
  bool get loading => _loading;
  String? get error => _error;
  bool get isLoggedIn => _user != null;

  Future<void> login(String email, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await ApiService.post('/auth/login', body: {
        'email': email,
        'password': password,
      });
      await ApiService.setToken(res['token']);
      _user = User.fromJson(res['user']);
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> checkAuth() async {
    await ApiService.loadToken();
    if (ApiService.token.isEmpty) return;
    try {
      final res = await ApiService.get('/auth/me');
      _user = User.fromJson(res);
      notifyListeners();
    } catch (_) {
      await ApiService.clearToken();
    }
  }

  Future<void> logout() async {
    await ApiService.clearToken();
    _user = null;
    notifyListeners();
  }
}

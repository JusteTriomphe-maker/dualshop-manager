import 'package:http/http.dart' as http;
import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String _baseUrlKey = 'api_url';
  static const Duration _timeout = Duration(seconds: 12);
  static const String _configuredBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
  );

  static String get _defaultBaseUrl {
    if (_configuredBaseUrl.trim().isNotEmpty) {
      return _normalizeBaseUrl(_configuredBaseUrl);
    }
    // Sur Web/Chrome : localhost (même machine que le backend)
    if (kIsWeb) {
      return 'http://localhost:3001/api/v1';
    }
    // Sur Android émulateur natif : 10.0.2.2 redirige vers l'hôte
    // Sur vrai téléphone : configurer l'IP via le bouton ⚙ de la login
    return 'http://10.0.2.2:3001/api/v1';
  }

  static String _token = '';
  static String get token => _token;

  static Future<String> get baseUrl async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_baseUrlKey) ?? _defaultBaseUrl;
  }

  static Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_baseUrlKey, _normalizeBaseUrl(url));
  }

  static Future<String> getCurrentBaseUrl() async {
    return await baseUrl;
  }

  static Future<void> resetBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_baseUrlKey);
  }

  static Future<void> setToken(String t) async {
    _token = t;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', t);
  }

  static Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token') ?? '';
  }

  static Future<void> clearToken() async {
    _token = '';
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  static Future<Map<String, String>> _headers() async {
    return {
      'Content-Type': 'application/json',
      if (_token.isNotEmpty) 'Authorization': 'Bearer $_token',
    };
  }

  static Future<dynamic> get(String path, {Map<String, String>? params}) async {
    final url = Uri.parse(
      '${await baseUrl}$path',
    ).replace(queryParameters: params);
    return _send(url, () async => http.get(url, headers: await _headers()));
  }

  static Future<dynamic> post(String path, {Map<String, dynamic>? body}) async {
    final url = Uri.parse('${await baseUrl}$path');
    return _send(url, () async {
      return http.post(
        url,
        headers: await _headers(),
        body: jsonEncode(body ?? {}),
      );
    });
  }

  static Future<dynamic> put(String path, {Map<String, dynamic>? body}) async {
    final url = Uri.parse('${await baseUrl}$path');
    return _send(url, () async {
      return http.put(
        url,
        headers: await _headers(),
        body: jsonEncode(body ?? {}),
      );
    });
  }

  static Future<dynamic> delete(String path) async {
    final url = Uri.parse('${await baseUrl}$path');
    return _send(url, () async => http.delete(url, headers: await _headers()));
  }

  static Future<dynamic> _send(
    Uri url,
    Future<http.Response> Function() request,
  ) async {
    try {
      final res = await request().timeout(_timeout);
      return _handleResponse(res);
    } on TimeoutException {
      throw ApiException(_networkErrorMessage(url), 0);
    } on http.ClientException {
      throw ApiException(_networkErrorMessage(url), 0);
    } catch (e) {
      // Capture SocketException et autres erreurs réseau sans dart:io
      throw ApiException(_networkErrorMessage(url), 0);
    }
  }

  static dynamic _handleResponse(http.Response res) {
    final data = _decodeResponseBody(res);
    if (res.statusCode >= 200 && res.statusCode < 300) return data;
    final message = data is Map<String, dynamic> ? data['error'] : null;
    throw ApiException(message ?? 'Erreur ${res.statusCode}', res.statusCode);
  }

  static dynamic _decodeResponseBody(http.Response res) {
    try {
      return jsonDecode(res.body);
    } on FormatException {
      throw ApiException(
        'Réponse serveur invalide (${res.statusCode}). Vérifie l\'URL API configurée.',
        res.statusCode,
      );
    }
  }

  static String _normalizeBaseUrl(String url) {
    var normalized = url.trim();
    while (normalized.endsWith('/')) {
      normalized = normalized.substring(0, normalized.length - 1);
    }
    if (!normalized.endsWith('/api/v1')) {
      normalized = '$normalized/api/v1';
    }
    final uri = Uri.tryParse(normalized);
    if (uri == null || !uri.hasScheme || uri.host.isEmpty) {
      throw ApiException('URL serveur invalide.', 0);
    }
    return normalized;
  }

  static String _networkErrorMessage(Uri url) {
    return 'Impossible de joindre le serveur ${url.origin}. '
        'Vérifie que le backend est démarré et que cette adresse est accessible depuis cet appareil. '
        'Sur un téléphone physique, utilise l\'adresse IP du PC au lieu de 10.0.2.2.';
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);
  @override
  String toString() => message;
}

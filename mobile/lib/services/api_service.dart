import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io' show Platform;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String _baseUrlKey = 'api_url';

  static String get _defaultBaseUrl {
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:3001/api/v1';
    }
    return 'http://localhost:3001/api/v1';
  }

  static String _token = '';
  static String get token => _token;

  static Future<String> get baseUrl async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_baseUrlKey) ?? _defaultBaseUrl;
  }

  static Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_baseUrlKey, url);
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
    final url = Uri.parse('${await baseUrl}$path').replace(queryParameters: params);
    final res = await http.get(url, headers: await _headers());
    return _handleResponse(res);
  }

  static Future<dynamic> post(String path, {Map<String, dynamic>? body}) async {
    final url = Uri.parse('${await baseUrl}$path');
    final res = await http.post(url, headers: await _headers(), body: jsonEncode(body ?? {}));
    return _handleResponse(res);
  }

  static Future<dynamic> put(String path, {Map<String, dynamic>? body}) async {
    final url = Uri.parse('${await baseUrl}$path');
    final res = await http.put(url, headers: await _headers(), body: jsonEncode(body ?? {}));
    return _handleResponse(res);
  }

  static Future<dynamic> delete(String path) async {
    final url = Uri.parse('${await baseUrl}$path');
    final res = await http.delete(url, headers: await _headers());
    return _handleResponse(res);
  }

  static dynamic _handleResponse(http.Response res) {
    final data = jsonDecode(res.body);
    if (res.statusCode >= 200 && res.statusCode < 300) return data;
    throw ApiException(data['error'] ?? 'Erreur ${res.statusCode}', res.statusCode);
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);
  @override
  String toString() => message;
}

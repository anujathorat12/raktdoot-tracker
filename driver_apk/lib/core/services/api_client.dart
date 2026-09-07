/// Core API client — handles HTTP requests with JWT token management.
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  // Change this to your backend IP when testing on physical device
  // Android emulator: http://10.0.2.2:5000
  // Physical device on LAN: http://192.168.x.x:5000
  static const String baseUrl = 'http://10.0.2.2:5000/api';

  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  static Future<Map<String, String>> _headers({bool multipart = false}) async {
    final token = await _getToken();
    final headers = <String, String>{};
    if (!multipart) headers['Content-Type'] = 'application/json';
    if (token != null) headers['Authorization'] = 'Bearer $token';
    return headers;
  }

  /// POST request — returns decoded JSON body.
  static Future<Map<String, dynamic>> post(
    String path,
    Map<String, dynamic> body,
  ) async {
    final headers = await _headers();
    final response = await http
        .post(
          Uri.parse('$baseUrl$path'),
          headers: headers,
          body: jsonEncode(body),
        )
        .timeout(const Duration(seconds: 15));

    return _handleResponse(response);
  }

  /// GET request — returns decoded JSON body.
  static Future<Map<String, dynamic>> get(
    String path, {
    Map<String, String>? queryParams,
  }) async {
    final headers = await _headers();
    var uri = Uri.parse('$baseUrl$path');
    if (queryParams != null) uri = uri.replace(queryParameters: queryParams);

    final response = await http
        .get(uri, headers: headers)
        .timeout(const Duration(seconds: 15));

    return _handleResponse(response);
  }

  /// PATCH request.
  static Future<Map<String, dynamic>> patch(
    String path,
    Map<String, dynamic> body,
  ) async {
    final headers = await _headers();
    final response = await http
        .patch(
          Uri.parse('$baseUrl$path'),
          headers: headers,
          body: jsonEncode(body),
        )
        .timeout(const Duration(seconds: 15));

    return _handleResponse(response);
  }

  /// Multipart POST for image upload.
  static Future<Map<String, dynamic>> postMultipart(
    String path,
    Map<String, String> fields,
    File? imageFile,
  ) async {
    final token = await _getToken();
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl$path'),
    );
    if (token != null) request.headers['Authorization'] = 'Bearer $token';
    request.fields.addAll(fields);
    if (imageFile != null) {
      request.files.add(
        await http.MultipartFile.fromPath('image', imageFile.path),
      );
    }
    final streamed = await request.send().timeout(const Duration(seconds: 30));
    final response = await http.Response.fromStream(streamed);
    return _handleResponse(response);
  }

  static Map<String, dynamic> _handleResponse(http.Response response) {
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }
    throw ApiException(
      message: body['message'] as String? ?? 'Request failed',
      statusCode: response.statusCode,
    );
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;
  const ApiException({required this.message, required this.statusCode});

  @override
  String toString() => 'ApiException($statusCode): $message';
}

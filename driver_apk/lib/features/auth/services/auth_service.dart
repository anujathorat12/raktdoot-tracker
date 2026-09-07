/// Authentication service — login, token persistence, user model.
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/services/api_client.dart';

class UserModel {
  final String id;
  final String name;
  final String email;
  final String role;
  final String? phone;
  final String? avatarColor;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone,
    this.avatarColor,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'] as String,
        name: json['name'] as String,
        email: json['email'] as String,
        role: json['role'] as String,
        phone: json['phone'] as String?,
        avatarColor: json['avatar_color'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'role': role,
        'phone': phone,
        'avatar_color': avatarColor,
      };
}

class AuthService {
  static const _tokenKey = 'auth_token';
  static const _userKey = 'auth_user';

  UserModel? _currentUser;
  UserModel? get currentUser => _currentUser;

  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    if (token == null) return false;
    final userJson = prefs.getString(_userKey);
    if (userJson != null) {
      _currentUser = UserModel.fromJson(jsonDecode(userJson) as Map<String, dynamic>);
    }
    return true;
  }

  Future<UserModel> login(String email, String password) async {
    final response = await ApiClient.post('/auth/login', {
      'email': email,
      'password': password,
    });
    final data = response['data'] as Map<String, dynamic>;
    final token = data['token'] as String;
    final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userKey, jsonEncode(user.toJson()));

    _currentUser = user;
    return user;
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
    _currentUser = null;
  }
}

final authService = AuthService();

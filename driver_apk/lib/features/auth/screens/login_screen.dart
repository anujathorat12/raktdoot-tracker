import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;
  bool _showPass = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    setState(() { _loading = true; _error = null; });
    try {
      final user = await authService.login(
        _emailController.text.trim(),
        _passwordController.text,
      );
      if (!mounted) return;
      if (user.role == 'driver') {
        Navigator.pushReplacementNamed(context, '/home');
      } else {
        setState(() { _error = 'Only driver accounts can log in to this app.'; });
      }
    } catch (e) {
      setState(() { _error = e.toString().replaceAll('ApiException', '').trim(); });
    } finally {
      if (mounted) setState(() { _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0B0F),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 48),

              // Logo
              Center(
                child: Container(
                  width: 80, height: 80,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF6366F1), Color(0xFF06B6D4)],
                      begin: Alignment.topLeft, end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.4), blurRadius: 20, spreadRadius: 2)],
                  ),
                  child: const Center(child: Text('🚚', style: TextStyle(fontSize: 36))),
                ),
              ),
              const SizedBox(height: 24),

              Text(
                'Driver Login',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white),
              ),
              const SizedBox(height: 8),
              Text(
                'Delivery Tracking Platform',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF94A3B8)),
              ),
              const SizedBox(height: 40),

              // Error box
              if (_error != null) ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444).withOpacity(0.1),
                    border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.4)),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(_error!, style: GoogleFonts.inter(color: const Color(0xFFEF4444), fontSize: 13)),
                ),
                const SizedBox(height: 16),
              ],

              // Email field
              _buildLabel('Email Address'),
              const SizedBox(height: 6),
              _buildTextField(
                controller: _emailController,
                hint: 'driver1@delivery.com',
                keyboardType: TextInputType.emailAddress,
                prefix: const Icon(Icons.email_outlined, size: 18, color: Color(0xFF94A3B8)),
              ),
              const SizedBox(height: 16),

              // Password field
              _buildLabel('Password'),
              const SizedBox(height: 6),
              _buildTextField(
                controller: _passwordController,
                hint: '••••••••',
                obscure: !_showPass,
                prefix: const Icon(Icons.lock_outline, size: 18, color: Color(0xFF94A3B8)),
                suffix: IconButton(
                  icon: Icon(_showPass ? Icons.visibility_off : Icons.visibility, size: 18, color: const Color(0xFF94A3B8)),
                  onPressed: () => setState(() => _showPass = !_showPass),
                ),
              ),
              const SizedBox(height: 32),

              // Submit button
              GestureDetector(
                onTap: _loading ? null : _login,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  height: 52,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: _loading
                          ? [const Color(0xFF4F46E5), const Color(0xFF0891B2)]
                          : [const Color(0xFF6366F1), const Color(0xFF06B6D4)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.35), blurRadius: 16)],
                  ),
                  child: Center(
                    child: _loading
                        ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : Text('Sign In', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15)),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Demo hint
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF16181F),
                  border: Border.all(color: const Color(0xFF2A2D38)),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('⚡ Demo Credentials', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF94A3B8), letterSpacing: 0.5)),
                    const SizedBox(height: 6),
                    Text('driver1@delivery.com / driver123', style: GoogleFonts.jetBrainsMono(fontSize: 12, color: const Color(0xFF6366F1))),
                    Text('driver2@delivery.com / driver123', style: GoogleFonts.jetBrainsMono(fontSize: 12, color: const Color(0xFF94A3B8))),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) => Text(
    text,
    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF94A3B8), letterSpacing: 0.5),
  );

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    bool obscure = false,
    TextInputType? keyboardType,
    Widget? prefix,
    Widget? suffix,
  }) => TextFormField(
    controller: controller,
    obscureText: obscure,
    keyboardType: keyboardType,
    style: GoogleFonts.inter(color: Colors.white, fontSize: 14),
    decoration: InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.inter(color: const Color(0xFF475569)),
      prefixIcon: prefix,
      suffixIcon: suffix,
      filled: true,
      fillColor: const Color(0xFF1C1E27),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF2A2D38))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF2A2D38))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    ),
    onFieldSubmitted: (_) => _login(),
  );
}

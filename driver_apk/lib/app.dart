import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../auth/services/auth_service.dart';
import '../../core/services/socket_service.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/home/screens/driver_home_screen.dart';
import '../../features/issues/screens/report_issue_screen.dart';

class DeliveryApp extends StatelessWidget {
  const DeliveryApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Delivery Driver',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0A0B0F),
        colorScheme: const ColorScheme.dark(primary: Color(0xFF6366F1)),
        textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
        snackBarTheme: SnackBarThemeData(
          backgroundColor: const Color(0xFF16181F),
          contentTextStyle: GoogleFonts.inter(color: Colors.white),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
      routes: {
        '/login': (_) => const LoginScreen(),
        '/home': (_) => const DriverHomeScreen(),
        '/report-issue': (_) => const ReportIssueScreen(),
      },
      home: const _SplashRouter(),
    );
  }
}

class _SplashRouter extends StatefulWidget {
  const _SplashRouter();

  @override
  State<_SplashRouter> createState() => _SplashRouterState();
}

class _SplashRouterState extends State<_SplashRouter> {
  @override
  void initState() {
    super.initState();
    _route();
  }

  Future<void> _route() async {
    await Future.delayed(const Duration(milliseconds: 800));
    final loggedIn = await authService.isLoggedIn();
    if (!mounted) return;
    if (loggedIn && authService.currentUser?.role == 'driver') {
      Navigator.pushReplacementNamed(context, '/home');
    } else {
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0B0F),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80, height: 80,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF06B6D4)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.4), blurRadius: 24, spreadRadius: 4)],
              ),
              child: const Center(child: Text('🚚', style: TextStyle(fontSize: 36))),
            ),
            const SizedBox(height: 20),
            Text('DeliveryTrack', style: GoogleFonts.inter(fontSize: 26, fontWeight: FontWeight.w800, color: Colors.white)),
            const SizedBox(height: 6),
            Text('Driver Portal', style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8))),
            const SizedBox(height: 32),
            const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Color(0xFF6366F1), strokeWidth: 2)),
          ],
        ),
      ),
    );
  }
}

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:geolocator/geolocator.dart';
import '../../core/services/location_service.dart';
import '../../core/services/socket_service.dart';
import '../../auth/services/auth_service.dart';

class DriverHomeScreen extends StatefulWidget {
  const DriverHomeScreen({super.key});

  @override
  State<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends State<DriverHomeScreen> {
  String _status = 'active';
  Position? _currentPosition;
  bool _locationReady = false;
  StreamSubscription<Position>? _posStream;
  Timer? _socketTimer;

  @override
  void initState() {
    super.initState();
    _initLocation();
  }

  Future<void> _initLocation() async {
    await locationService.enforceLocationService(context);
    final granted = await locationService.checkAndRequestPermissions();
    if (!granted) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Location permission required')),
        );
      }
      return;
    }
    await socketService.connect();
    setState(() => _locationReady = true);

    // Start listening to GPS
    _posStream = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, distanceFilter: 5),
    ).listen((pos) {
      setState(() => _currentPosition = pos);
      socketService.emitLocationUpdate(
        driverId: authService.currentUser!.id,
        lat: pos.latitude,
        lng: pos.longitude,
        speed: (pos.speed * 3.6).clamp(0, 200),
        heading: pos.heading,
        status: _status,
      );
    });
  }

  @override
  void dispose() {
    _posStream?.cancel();
    _socketTimer?.cancel();
    super.dispose();
  }

  void _toggleStatus(String newStatus) {
    setState(() => _status = newStatus);
    socketService.emitStatusChange(newStatus);
  }

  Future<void> _logout() async {
    _posStream?.cancel();
    socketService.emitStatusChange('offline');
    socketService.disconnect();
    await authService.logout();
    if (mounted) Navigator.pushReplacementNamed(context, '/login');
  }

  Color get _statusColor {
    switch (_status) {
      case 'active': return const Color(0xFF10B981);
      case 'idle': return const Color(0xFFF59E0B);
      case 'issue': return const Color(0xFFEF4444);
      default: return const Color(0xFF6B7280);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = authService.currentUser;
    final initials = user?.name.split(' ').map((w) => w[0]).join().toUpperCase().substring(0, user.name.split(' ').length > 1 ? 2 : 1) ?? 'D';

    return Scaffold(
      backgroundColor: const Color(0xFF0A0B0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111218),
        elevation: 0,
        title: Row(
          children: [
            Container(
              width: 34, height: 34,
              decoration: BoxDecoration(color: const Color(0xFF6366F1), borderRadius: BorderRadius.circular(8)),
              child: Center(child: Text(initials, style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13))),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(user?.name ?? 'Driver', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14)),
                Text('Driver Portal', style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 11)),
              ],
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 8),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: socketService.isConnected ? const Color(0xFF10B981).withOpacity(0.15) : const Color(0xFFEF4444).withOpacity(0.15),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: socketService.isConnected ? const Color(0xFF10B981).withOpacity(0.4) : const Color(0xFFEF4444).withOpacity(0.4)),
            ),
            child: Row(
              children: [
                Icon(socketService.isConnected ? Icons.wifi : Icons.wifi_off, size: 12, color: socketService.isConnected ? const Color(0xFF10B981) : const Color(0xFFEF4444)),
                const SizedBox(width: 4),
                Text(socketService.isConnected ? 'Live' : 'Off', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: socketService.isConnected ? const Color(0xFF10B981) : const Color(0xFFEF4444))),
              ],
            ),
          ),
          IconButton(icon: const Icon(Icons.logout, color: Color(0xFF94A3B8), size: 20), onPressed: _logout),
        ],
        bottom: PreferredSize(preferredSize: const Size.fromHeight(1), child: Container(height: 1, color: const Color(0xFF2A2D38))),
      ),
      body: _locationReady
          ? SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  // Status card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFF16181F),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: _statusColor.withOpacity(0.3)),
                      boxShadow: [BoxShadow(color: _statusColor.withOpacity(0.1), blurRadius: 20)],
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 12, height: 12,
                              decoration: BoxDecoration(color: _statusColor, shape: BoxShape.circle,
                                boxShadow: [BoxShadow(color: _statusColor.withOpacity(0.5), blurRadius: 8)]),
                            ),
                            const SizedBox(width: 8),
                            Text('Status: ${_status.toUpperCase()}', style: GoogleFonts.inter(color: _statusColor, fontWeight: FontWeight.w700, fontSize: 14)),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            for (final s in ['active', 'idle', 'issue'])
                              Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 3),
                                  child: GestureDetector(
                                    onTap: () => _toggleStatus(s),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(vertical: 10),
                                      decoration: BoxDecoration(
                                        color: _status == s ? _statusColor.withOpacity(0.2) : const Color(0xFF1C1E27),
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(color: _status == s ? _statusColor : const Color(0xFF2A2D38)),
                                      ),
                                      child: Text(
                                        s[0].toUpperCase() + s.substring(1),
                                        textAlign: TextAlign.center,
                                        style: GoogleFonts.inter(color: _status == s ? _statusColor : const Color(0xFF94A3B8), fontWeight: FontWeight.w600, fontSize: 12),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // GPS Info
                  if (_currentPosition != null) ...[
                    _infoGrid([
                      {'icon': '📍', 'label': 'Latitude', 'value': _currentPosition!.latitude.toStringAsFixed(5)},
                      {'icon': '📍', 'label': 'Longitude', 'value': _currentPosition!.longitude.toStringAsFixed(5)},
                      {'icon': '⚡', 'label': 'Speed', 'value': '${(_currentPosition!.speed * 3.6).clamp(0, 200).toStringAsFixed(0)} km/h'},
                      {'icon': '🧭', 'label': 'Heading', 'value': '${_currentPosition!.heading.toStringAsFixed(0)}°'},
                    ]),
                    const SizedBox(height: 16),
                  ],

                  // Report Issue button
                  GestureDetector(
                    onTap: () => Navigator.pushNamed(context, '/report-issue'),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors: [const Color(0xFFEF4444).withOpacity(0.1), const Color(0xFFDC2626).withOpacity(0.05)]),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 48, height: 48,
                            decoration: BoxDecoration(color: const Color(0xFFEF4444).withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
                            child: const Icon(Icons.warning_amber_rounded, color: Color(0xFFEF4444), size: 24),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Report an Issue', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15)),
                                Text('Take photo + describe incident', style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 12)),
                              ],
                            ),
                          ),
                          const Icon(Icons.arrow_forward_ios, color: Color(0xFFEF4444), size: 14),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            )
          : Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CircularProgressIndicator(color: Color(0xFF6366F1)),
                  const SizedBox(height: 16),
                  Text('Initializing GPS...', style: GoogleFonts.inter(color: const Color(0xFF94A3B8))),
                ],
              ),
            ),
    );
  }

  Widget _infoGrid(List<Map<String, String>> items) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 2.2,
      children: items.map((item) => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF16181F),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF2A2D38)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(item['icon']!, style: const TextStyle(fontSize: 16)),
            const SizedBox(height: 4),
            Text(item['value']!, style: GoogleFonts.jetBrainsMono(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
            Text(item['label']!, style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 10)),
          ],
        ),
      )).toList(),
    );
  }
}

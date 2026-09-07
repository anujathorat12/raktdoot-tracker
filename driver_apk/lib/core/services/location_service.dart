/// GPS Location service — enforces GPS on, streams location updates.
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'socket_service.dart';

class LocationService {
  StreamSubscription<Position>? _subscription;
  bool _streaming = false;

  bool get isStreaming => _streaming;

  /// Checks and requests all required location permissions.
  /// Returns true if permissions are granted.
  Future<bool> checkAndRequestPermissions() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return false;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return false;
    }
    if (permission == LocationPermission.deniedForever) return false;

    return true;
  }

  /// Shows a mandatory, un-dismissable dialog forcing the user to enable GPS.
  /// The dialog CANNOT be dismissed by back button until GPS is enabled.
  Future<void> enforceLocationService(BuildContext context) async {
    while (true) {
      final enabled = await Geolocator.isLocationServiceEnabled();
      if (enabled) break;

      if (!context.mounted) return;
      await showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => WillPopScope(
          // Block back button — GPS is mandatory
          onWillPop: () async => false,
          child: AlertDialog(
            backgroundColor: const Color(0xFF16181F),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Row(
              children: [
                Text('📍', style: TextStyle(fontSize: 24)),
                SizedBox(width: 10),
                Text(
                  'GPS Required',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            content: const Text(
              'Location services must be enabled to use the Delivery Driver app. '
              'Your GPS data is used to track your delivery route in real time.\n\n'
              'Please enable Location Services to continue.',
              style: TextStyle(color: Color(0xFF94A3B8), height: 1.5),
            ),
            actions: [
              TextButton(
                onPressed: () async {
                  await Geolocator.openLocationSettings();
                },
                style: TextButton.styleFrom(
                  backgroundColor: const Color(0xFF6366F1),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('Open Location Settings'),
              ),
            ],
          ),
        ),
      );

      // After dialog closes, check again
      await Future.delayed(const Duration(seconds: 2));
    }
  }

  /// Starts streaming GPS updates via Socket.io every ~5 seconds.
  Future<void> startStreaming(String driverId, String status) async {
    if (_streaming) return;
    _streaming = true;

    _subscription = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 5, // only update if moved ≥5 meters
        timeLimit: Duration(seconds: 5),
      ),
    ).listen(
      (Position position) {
        socketService.emitLocationUpdate(
          driverId: driverId,
          lat: position.latitude,
          lng: position.longitude,
          speed: (position.speed * 3.6).clamp(0, 200), // m/s → km/h
          heading: position.heading,
          status: status,
        );
      },
      onError: (err) => print('[Location] Stream error: $err'),
    );
  }

  /// Stop streaming.
  void stopStreaming() {
    _subscription?.cancel();
    _subscription = null;
    _streaming = false;
  }

  /// Get current position once.
  Future<Position?> getCurrentPosition() async {
    try {
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
    } catch (e) {
      print('[Location] Error: $e');
      return null;
    }
  }
}

final locationService = LocationService();

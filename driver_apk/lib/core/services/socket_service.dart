/// Socket.io service — manages real-time connection to backend.
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:shared_preferences/shared_preferences.dart';

typedef LocationCallback = void Function(Map<String, dynamic> data);

class SocketService {
  static const String _serverUrl = 'http://10.0.2.2:5000';

  IO.Socket? _socket;
  bool _isConnected = false;

  bool get isConnected => _isConnected;

  /// Connect to Socket.io server with JWT token.
  Future<void> connect() async {
    if (_socket != null && _isConnected) return;

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    if (token == null) throw Exception('No auth token found. Please login first.');

    _socket = IO.io(
      _serverUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth({'token': token})
          .setReconnectionAttempts(5)
          .setReconnectionDelay(2000)
          .build(),
    );

    _socket!.onConnect((_) {
      _isConnected = true;
      print('[Socket] ✅ Connected');
    });

    _socket!.onDisconnect((_) {
      _isConnected = false;
      print('[Socket] ❌ Disconnected');
    });

    _socket!.onConnectError((err) => print('[Socket] Connect error: $err'));

    _socket!.connect();
  }

  /// Disconnect from server.
  void disconnect() {
    _socket?.disconnect();
    _socket = null;
    _isConnected = false;
  }

  /// Emit GPS location update to server.
  void emitLocationUpdate({
    required String driverId,
    required double lat,
    required double lng,
    required double speed,
    required double heading,
    required String status,
  }) {
    if (!_isConnected) return;
    _socket!.emit('location_update', {
      'driver_id': driverId,
      'lat': lat,
      'lng': lng,
      'speed': speed,
      'heading': heading,
      'status': status,
    });
  }

  /// Emit driver status change.
  void emitStatusChange(String status) {
    if (!_isConnected) return;
    _socket!.emit('status_change', {'status': status});
  }

  /// Emit issue reported notification.
  void emitIssueReported(Map<String, dynamic> data) {
    if (!_isConnected) return;
    _socket!.emit('issue_reported', data);
  }
}

// Singleton instance
final socketService = SocketService();

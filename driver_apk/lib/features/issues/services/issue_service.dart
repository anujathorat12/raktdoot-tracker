/// Issue reporting service — forced camera-only capture + multipart upload.
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import '../../core/services/api_client.dart';

class IssueService {
  final _picker = ImagePicker();

  /// Captures a photo STRICTLY from the camera — gallery access is blocked.
  /// Returns the captured file or null if cancelled.
  Future<File?> captureLiveIssuePhoto() async {
    final XFile? photo = await _picker.pickImage(
      source: ImageSource.camera, // 🔴 MANDATORY: camera only, no gallery
      imageQuality: 70,           // Compress to save mobile data
      maxWidth: 1280,
      maxHeight: 960,
    );
    if (photo == null) return null;
    return File(photo.path);
  }

  /// Submit an issue report with optional photo to backend.
  Future<Map<String, dynamic>> reportIssue({
    required String description,
    File? imageFile,
    double? lat,
    double? lng,
  }) async {
    final fields = <String, String>{
      'description': description,
      if (lat != null) 'lat': lat.toString(),
      if (lng != null) 'lng': lng.toString(),
    };
    return ApiClient.postMultipart('/issues', fields, imageFile);
  }
}

final issueService = IssueService();

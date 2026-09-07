import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/issue_service.dart';
import '../../core/services/location_service.dart';
import 'package:geolocator/geolocator.dart';

class ReportIssueScreen extends StatefulWidget {
  const ReportIssueScreen({super.key});

  @override
  State<ReportIssueScreen> createState() => _ReportIssueScreenState();
}

class _ReportIssueScreenState extends State<ReportIssueScreen> {
  final _descriptionController = TextEditingController();
  File? _capturedPhoto;
  bool _loading = false;
  bool _capturing = false;
  String? _error;
  bool _submitted = false;

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _capturePhoto() async {
    setState(() { _capturing = true; _error = null; });
    try {
      final file = await issueService.captureLiveIssuePhoto();
      if (file != null) setState(() => _capturedPhoto = file);
    } catch (e) {
      setState(() => _error = 'Camera error: $e');
    } finally {
      setState(() => _capturing = false);
    }
  }

  Future<void> _submit() async {
    if (_descriptionController.text.trim().isEmpty) {
      setState(() => _error = 'Please describe the issue.');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      Position? pos = await locationService.getCurrentPosition();
      await issueService.reportIssue(
        description: _descriptionController.text.trim(),
        imageFile: _capturedPhoto,
        lat: pos?.latitude,
        lng: pos?.longitude,
      );
      setState(() => _submitted = true);
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0B0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111218),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text('Report Issue', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w700)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: const Color(0xFF2A2D38)),
        ),
      ),
      body: _submitted
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('✅', style: TextStyle(fontSize: 64)),
                  const SizedBox(height: 16),
                  Text('Issue Reported!', style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white)),
                  const SizedBox(height: 8),
                  Text('Your manager has been notified.', style: GoogleFonts.inter(color: const Color(0xFF94A3B8))),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Camera capture
                  GestureDetector(
                    onTap: _capturing ? null : _capturePhoto,
                    child: Container(
                      height: 200,
                      decoration: BoxDecoration(
                        color: const Color(0xFF16181F),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: _capturedPhoto != null ? const Color(0xFF10B981) : const Color(0xFF2A2D38),
                          width: _capturedPhoto != null ? 2 : 1,
                        ),
                      ),
                      child: _capturedPhoto != null
                          ? Stack(
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(13),
                                  child: Image.file(_capturedPhoto!, fit: BoxFit.cover, width: double.infinity),
                                ),
                                Positioned(
                                  top: 8, right: 8,
                                  child: GestureDetector(
                                    onTap: _capturePhoto,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      decoration: BoxDecoration(color: Colors.black.withOpacity(0.7), borderRadius: BorderRadius.circular(8)),
                                      child: Text('Retake', style: GoogleFonts.inter(color: Colors.white, fontSize: 12)),
                                    ),
                                  ),
                                ),
                              ],
                            )
                          : Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                _capturing
                                    ? const CircularProgressIndicator(color: Color(0xFF6366F1))
                                    : const Icon(Icons.camera_alt_rounded, size: 48, color: Color(0xFF475569)),
                                const SizedBox(height: 12),
                                Text(
                                  _capturing ? 'Opening camera...' : '📸 Take Photo (Required)',
                                  style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 14),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Live camera capture only — no gallery',
                                  style: GoogleFonts.inter(color: const Color(0xFF475569), fontSize: 11),
                                ),
                              ],
                            ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Description
                  Text('Describe the Issue *', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF94A3B8), letterSpacing: 0.5)),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _descriptionController,
                    maxLines: 4,
                    style: GoogleFonts.inter(color: Colors.white, fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'e.g., Vehicle breakdown, traffic accident, package damaged...',
                      hintStyle: GoogleFonts.inter(color: const Color(0xFF475569), fontSize: 13),
                      filled: true,
                      fillColor: const Color(0xFF1C1E27),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF2A2D38))),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF2A2D38))),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFEF4444), width: 2)),
                    ),
                  ),
                  const SizedBox(height: 16),

                  if (_error != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEF4444).withOpacity(0.1),
                        border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.4)),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(_error!, style: GoogleFonts.inter(color: const Color(0xFFEF4444), fontSize: 12)),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Submit
                  GestureDetector(
                    onTap: _loading ? null : _submit,
                    child: Container(
                      height: 52,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [Color(0xFFEF4444), Color(0xFFDC2626)]),
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [BoxShadow(color: const Color(0xFFEF4444).withOpacity(0.3), blurRadius: 16)],
                      ),
                      child: Center(
                        child: _loading
                            ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 18),
                                  const SizedBox(width: 8),
                                  Text('Submit Issue Report', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15)),
                                ],
                              ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}

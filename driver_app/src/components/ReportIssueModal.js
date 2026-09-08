import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { ISSUE_TYPES, SEVERITIES } from '../config/constants';

export default function ReportIssueModal({
  visible,
  onClose,
  onSubmit,
  currentLocation,
}) {
  const [selectedType, setSelectedType] = useState(ISSUE_TYPES[0].id);
  const [selectedSeverity, setSelectedSeverity] = useState('high');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please enter a brief description of the incident.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        type: selectedType,
        severity: selectedSeverity,
        description: description.trim(),
        lat: currentLocation?.lat || 0,
        lng: currentLocation?.lng || 0,
      });
      setDescription('');
      onClose();
    } catch (err) {
      Alert.alert('Submission Error', err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 20 }}>🚨</Text>
              <Text style={styles.title}>Report Breakdown / Issue</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* GPS Location Tag */}
            <View style={styles.locationTag}>
              <Text style={styles.locationText}>
                📍 Attached GPS: {currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : 'Waiting for GPS...'}
              </Text>
            </View>

            {/* Issue Category */}
            <Text style={styles.sectionLabel}>Select Incident Category</Text>
            <View style={styles.typesGrid}>
              {ISSUE_TYPES.map(type => {
                const isSelected = selectedType === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.typeBtn, isSelected && styles.typeBtnActive]}
                    onPress={() => setSelectedType(type.id)}
                  >
                    <Text style={{ fontSize: 18, marginBottom: 2 }}>{type.emoji}</Text>
                    <Text style={[styles.typeLabel, isSelected && styles.typeLabelActive]} numberOfLines={1}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Severity Level */}
            <Text style={styles.sectionLabel}>Severity Level</Text>
            <View style={styles.severityRow}>
              {SEVERITIES.map(sev => {
                const isSelected = selectedSeverity === sev.id;
                return (
                  <TouchableOpacity
                    key={sev.id}
                    style={[
                      styles.sevBtn,
                      isSelected && { borderColor: sev.color, backgroundColor: `${sev.color}22` },
                    ]}
                    onPress={() => setSelectedSeverity(sev.id)}
                  >
                    <View style={[styles.sevDot, { backgroundColor: sev.color }]} />
                    <Text style={[styles.sevLabel, isSelected && { color: sev.color, fontWeight: '700' }]}>
                      {sev.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Description Input */}
            <Text style={styles.sectionLabel}>Incident Details & Instructions</Text>
            <TextInput
              style={styles.textArea}
              placeholder="e.g. Engine overheated near Kalanagar Flyover, vehicle cannot move..."
              placeholderTextColor="#64748b"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitBtnText}>🚨 Send Live Alert to Manager</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#161822',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: '88%',
    padding: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    maxHeight: 500,
  },
  locationTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  locationText: {
    color: '#34d399',
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
    marginTop: 4,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeBtn: {
    width: '48%',
    backgroundColor: '#0f111a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  typeBtnActive: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94a3b8',
  },
  typeLabelActive: {
    color: '#fca5a5',
    fontWeight: '700',
  },
  severityRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  sevBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0f111a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingVertical: 8,
  },
  sevDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sevLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#0f111a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    padding: 12,
    color: '#f8fafc',
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
});

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';

export default function IssuesHistoryModal({ visible, onClose, issues = [] }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <Text style={styles.title}>Incident Reports ({issues.length})</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {issues.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(16, 185, 129, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#10b981' }} />
              </View>
              <Text style={{ color: '#f8fafc', fontWeight: '600', fontSize: 14 }}>No Incidents Reported</Text>
              <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                Your shift has zero reported breakdowns or issues.
              </Text>
            </View>
          ) : (
            <FlatList
              data={issues}
              keyExtractor={(item, index) => item.id || String(index)}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isResolved = item.status === 'resolved';
                const statusColor = isResolved ? '#10b981' : item.status === 'in_progress' ? '#f59e0b' : '#ef4444';

                return (
                  <View style={styles.issueCard}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.issueType}>{item.type?.replace('_', ' ').toUpperCase()}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22`, borderColor: statusColor }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          ● {item.status || 'open'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.issueDesc}>{item.description}</Text>

                    <View style={styles.cardFooter}>
                      <Text style={styles.metaText}>
                        Severity: <Text style={{ textTransform: 'capitalize', color: '#e2e8f0' }}>{item.severity}</Text>
                      </Text>
                      {item.created_at && (
                        <Text style={styles.metaText}>
                          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              }}
            />
          )}
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
    maxHeight: '80%',
    padding: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
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
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  issueCard: {
    backgroundColor: '#0f111a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  issueType: {
    color: '#f1f5f9',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  issueDesc: {
    color: '#cbd5e1',
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 6,
  },
  metaText: {
    color: '#64748b',
    fontSize: 11,
  },
});

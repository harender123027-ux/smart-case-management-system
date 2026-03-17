import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, Alert, StatusBar,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { t } from '../i18n/translations';
import api from '../services/api';
import { syncAll } from '../db/syncManager';
import { getLocalComplaints, getLocalCases } from '../db/localDb';

const StatCard = ({ value, label, color, icon }) => (
  <View style={[styles.statCard, { borderTopColor: color }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const QuickBtn = ({ icon, label, onPress, color }) => (
  <TouchableOpacity style={[styles.quickBtn, { backgroundColor: color }]} onPress={onPress}>
    <Text style={styles.quickIcon}>{icon}</Text>
    <Text style={styles.quickLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function DashboardScreen({ navigation }) {
  const { user, language, isOnline, token, logout } = useApp();
  const [stats, setStats] = useState({ total_cases: 0, open_cases: 0, urgent_cases: 0, pending: 0 });
  const [recentCases, setRecentCases] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const loadData = useCallback(async () => {
    if (isOnline && token !== 'offline_token') {
      try {
        const [statsRes, casesRes] = await Promise.all([
          api.get('/cases/stats/summary'),
          api.get('/cases?limit=5'),
        ]);
        setStats(statsRes.data);
        setRecentCases(casesRes.data.cases || []);
      } catch (e) {
        // Fallback to local
        loadLocalData();
      }
    } else {
      loadLocalData();
    }
  }, [isOnline, token]);

  const loadLocalData = () => {
    const localCases = getLocalCases();
    const localComplaints = getLocalComplaints();
    setRecentCases(localCases.slice(0, 5));
    setStats({
      total_cases: localCases.length,
      open_cases: localCases.filter(c => c.status === 'open').length,
      urgent_cases: localCases.filter(c => c.priority === 'urgent').length,
      pending: localComplaints.filter(c => c.status === 'pending').length,
    });
  };

  useEffect(() => { loadData(); }, [loadData]);

  const handleSync = async () => {
    if (!isOnline) return Alert.alert('Offline', 'Cannot sync while offline');
    setSyncing(true);
    setSyncMsg('Starting sync...');
    await syncAll(token, setSyncMsg);
    setSyncing(false);
    loadData();
    setTimeout(() => setSyncMsg(''), 3000);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const statusColor = { open: '#2196F3', investigating: '#FF9800', closed: '#4CAF50', pending: '#9C27B0' };
  const priorityColor = { urgent: '#f44336', high: '#FF5722', medium: '#FF9800', low: '#4CAF50' };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a237e" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>🚔 {t('dashboard', language)}</Text>
          <Text style={styles.userName}>{user?.full_name || user?.username} · {user?.station}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.badge, { backgroundColor: isOnline ? '#4CAF50' : '#f44336' }]}>
            <Text style={styles.badgeText}>{isOnline ? '🟢 Online' : '🔴 Offline'}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>↩</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sync banner */}
      {syncing && <View style={styles.syncBanner}><Text style={styles.syncText}>🔄 {syncMsg}</Text></View>}
      {syncMsg && !syncing && <View style={[styles.syncBanner, { backgroundColor: '#4CAF50' }]}><Text style={styles.syncText}>✅ {syncMsg}</Text></View>}

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a237e']} />}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard value={stats.total_cases} label={t('totalCases', language)} color="#1a237e" icon="📁" />
          <StatCard value={stats.open_cases} label={t('openCases', language)} color="#2196F3" icon="🔓" />
          <StatCard value={stats.urgent_cases} label={t('urgentCases', language)} color="#f44336" icon="🚨" />
          <StatCard value={stats.pending} label={t('pendingComplaints', language)} color="#FF9800" icon="⏳" />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('quickActions', language)}</Text>
        <View style={styles.quickRow}>
          <QuickBtn icon="📝" label={t('newComplaint', language)} color="#1a237e" onPress={() => navigation.navigate('Complaint')} />
          <QuickBtn icon="🔍" label={t('searchCase', language)} color="#2196F3" onPress={() => navigation.navigate('Cases')} />
          <QuickBtn icon="🗂️" label={t('evidence', language)} color="#4CAF50" onPress={() => navigation.navigate('Evidence')} />
          <QuickBtn icon="🤖" label={t('predictive', language)} color="#9C27B0" onPress={() => navigation.navigate('Predictive')} />
        </View>

        {/* Sync Button */}
        <TouchableOpacity
          style={[styles.syncBtn, !isOnline && styles.syncBtnDisabled]}
          onPress={handleSync}
          disabled={syncing || !isOnline}
        >
          <Text style={styles.syncBtnText}>🔄 {syncing ? t('syncing', language) : t('sync', language) + ' Offline Data'}</Text>
        </TouchableOpacity>

        {/* Recent Cases */}
        <Text style={styles.sectionTitle}>{t('recentCases', language)}</Text>
        {recentCases.length === 0 ? (
          <View style={styles.emptyCard}><Text style={styles.emptyText}>No cases found</Text></View>
        ) : (
          recentCases.map((c, i) => (
            <TouchableOpacity key={c.id || c.offline_id || i} style={styles.caseCard}
              onPress={() => navigation.navigate('Cases')}>
              <View style={styles.caseHeader}>
                <Text style={styles.caseNumber}>{c.case_number || c.offline_id?.slice(0, 16) || 'Draft'}</Text>
                <View style={[styles.pill, { backgroundColor: statusColor[c.status] || '#757575' }]}>
                  <Text style={styles.pillText}>{t(c.status, language)}</Text>
                </View>
              </View>
              <Text style={styles.caseTitle}>{c.title || 'Untitled Case'}</Text>
              <View style={styles.caseMeta}>
                <View style={[styles.priorityDot, { backgroundColor: priorityColor[c.priority] || '#757575' }]} />
                <Text style={styles.caseMetaText}>{t(c.priority, language)} Priority · {c.case_type || 'N/A'}</Text>
                {!c.server_id && !c.synced && <Text style={styles.offlineTag}>📴 Offline</Text>}
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  header: { backgroundColor: '#1a237e', padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  userName: { color: '#9fa8da', fontSize: 12, marginTop: 4 },
  headerRight: { alignItems: 'flex-end', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  logoutBtn: { padding: 6 },
  logoutText: { color: '#fff', fontSize: 18 },
  syncBanner: { backgroundColor: '#FF9800', padding: 10, alignItems: 'center' },
  syncText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  scroll: { flex: 1, padding: 16 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, minWidth: '43%', backgroundColor: '#fff', borderRadius: 12, padding: 14,
    alignItems: 'center', borderTopWidth: 3, elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4,
  },
  statIcon: { fontSize: 22 },
  statValue: { fontSize: 26, fontWeight: 'bold', marginTop: 4 },
  statLabel: { fontSize: 11, color: '#757575', marginTop: 2, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a237e', marginBottom: 12, marginTop: 4 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  quickBtn: { flex: 1, minWidth: '43%', borderRadius: 14, padding: 16, alignItems: 'center', elevation: 3 },
  quickIcon: { fontSize: 28 },
  quickLabel: { color: '#fff', fontWeight: '600', fontSize: 12, marginTop: 6, textAlign: 'center' },
  syncBtn: { backgroundColor: '#1a237e', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 20 },
  syncBtnDisabled: { backgroundColor: '#bdbdbd' },
  syncBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center' },
  emptyText: { color: '#9e9e9e', fontSize: 14 },
  caseCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3,
  },
  caseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  caseNumber: { fontSize: 11, color: '#9e9e9e', fontWeight: '600' },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  pillText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  caseTitle: { fontSize: 15, fontWeight: '600', color: '#212121', marginTop: 6 },
  caseMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  caseMetaText: { fontSize: 12, color: '#757575', flex: 1 },
  offlineTag: { fontSize: 10, color: '#FF9800', fontWeight: '600' },
});

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, StatusBar, Alert, Platform,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { t } from '../i18n/translations';
import api from '../services/api';
import { getLocalCases, saveCaseLocally, getLocalComplaints } from '../db/localDb';
import voiceService from '../services/voiceService';

// ─── Fuzzy match helper ─────────────────────────────────────
const fuzzyMatch = (str = '', query = '') => {
  if (!query) return true;
  const s = String(str).toLowerCase();
  const q = query.toLowerCase().trim();
  if (s.includes(q)) return true;
  let si = 0;
  for (let qi = 0; qi < q.length; qi++) {
    while (si < s.length && s[si] !== q[qi]) si++;
    if (si >= s.length) return false;
    si++;
  }
  return true;
};

const STATUS_COLORS = { open: '#2196F3', investigating: '#FF9800', closed: '#4CAF50', archived: '#9E9E9E' };
const PRIORITY_COLORS = { urgent: '#f44336', high: '#FF5722', medium: '#FF9800', low: '#4CAF50' };

export default function CaseSearchScreen({ navigation }) {
  const { language, isOnline } = useApp();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('cases'); // 'cases' or 'complaints'
  const [cases, setCases] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [aiResult, setAiResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [newCase, setNewCase] = useState({ title: '', case_type: '', location: '', priority: 'medium' });
  const [showForm, setShowForm] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const [casesRes, compRes] = await Promise.all([
          api.get('/cases?limit=30').catch(() => ({ data: { cases: [] } })),
          api.get('/complaints?limit=30').catch(() => ({ data: { complaints: [] } }))
        ]);
        setCases(casesRes.data.cases || []);
        setComplaints(compRes.data.complaints || []);
      } else {
        setCases(getLocalCases());
        setComplaints(getLocalComplaints());
      }
    } catch {
      setCases(getLocalCases());
      setComplaints(getLocalComplaints());
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return loadData();

    if (activeTab === 'cases') {
      if (!isOnline) {
        // Offline search — filter local cases
        const local = getLocalCases().filter(c =>
          c.title?.toLowerCase().includes(query.toLowerCase()) ||
          c.case_type?.toLowerCase().includes(query.toLowerCase()) ||
          c.description?.toLowerCase().includes(query.toLowerCase())
        );
        setCases(local);
        return;
      }

      // Online AI search
      setAiLoading(true);
      setAiResult('');
      try {
        const res = await api.post('/ai/search', { query, language });
        setAiResult(res.data.result);
        const filtered = await api.get(`/cases?search=${encodeURIComponent(query)}&limit=30`);
        setCases(filtered.data.cases || []);
      } catch (err) {
        Alert.alert(t('error', language), 'AI search failed. Showing local results.');
        const local = getLocalCases().filter(c => c.title?.toLowerCase().includes(query.toLowerCase()));
        setCases(local);
      } finally {
        setAiLoading(false);
      }
    } else {
      // Complaints fuzzy search
      const source = isOnline ? complaints : getLocalComplaints();
      const filtered = source.filter(c => 
        fuzzyMatch(c.complainant_name, query) || 
        fuzzyMatch(c.description, query) ||
        fuzzyMatch(c.complaint_type, query)
      );
      setComplaints(filtered);
      setAiResult('');
    }
  };

  const handleAddCase = async () => {
    if (!newCase.title.trim()) return Alert.alert(t('error', language), 'Case title required');
    try {
      if (isOnline) {
        await api.post('/cases', { ...newCase });
        Alert.alert('✅', 'Case created');
      } else {
        saveCaseLocally({ ...newCase });
        Alert.alert('📴 Saved Offline', 'Case saved locally. Will sync when online.');
      }
      setShowForm(false);
      setNewCase({ title: '', case_type: '', location: '', priority: 'medium' });
      loadData();
    } catch {
      saveCaseLocally({ ...newCase });
      Alert.alert('📴 Saved Offline', 'Case saved locally.');
      setShowForm(false);
      loadData();
    }
  };

  const toggleVoiceSearch = () => {
    if (Platform.OS !== 'web') {
      Alert.alert(t('error', language), 'Voice search is only supported on Web.');
      return;
    }

    if (!voiceService.isSupported()) {
      Alert.alert(t('error', language), 'Speech recognition not supported.');
      return;
    }

    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      return;
    }

    voiceService.setLanguage(language);
    setIsListening(true);
    voiceService.startListening(
      (text) => {
        setQuery(text);
      },
      (err) => {
        setIsListening(false);
        if (err !== 'no-speech' && err !== 'aborted') {
          Alert.alert(t('error', language), `Voice Error: ${err}`);
        }
      },
      () => setIsListening(false)
    );
  };

  const renderItem = ({ item }) => {
    if (activeTab === 'complaints') {
       return (
         <View style={styles.caseCard}>
            <View style={styles.caseHeader}>
              <Text style={styles.caseNumber}>{item.offline_id?.slice(0, 16) || item.id || '—'}</Text>
              <View style={[styles.statusPill, { backgroundColor: STATUS_COLORS[item.status] || '#757575' }]}>
                <Text style={styles.pillText}>{t(item.status, language) || item.status || 'Pending'}</Text>
              </View>
            </View>
            <Text style={styles.caseTitle}>{item.complainant_name || 'Anonymous'}</Text>
            {item.description ? <Text style={styles.caseDesc} numberOfLines={2}>{item.description}</Text> : null}
            <View style={styles.caseMeta}>
              <View style={[styles.dot, { backgroundColor: PRIORITY_COLORS[item.priority] || '#757575' }]} />
              <Text style={styles.caseMetaTxt}>{t(item.priority, language) || item.priority} · {t(`types.${item.complaint_type}`, language) || item.complaint_type}</Text>
              {!item.server_id && !item.synced && <Text style={styles.offlineTag}>📴 Offline</Text>}
            </View>
         </View>
       );
    }

    return (
      <View style={styles.caseCard}>
        <View style={styles.caseHeader}>
          <Text style={styles.caseNumber}>{item.case_number || item.offline_id?.slice(0, 16) || '—'}</Text>
          <View style={[styles.statusPill, { backgroundColor: STATUS_COLORS[item.status] || '#757575' }]}>
            <Text style={styles.pillText}>{t(item.status, language) || item.status}</Text>
          </View>
        </View>
        <Text style={styles.caseTitle}>{item.title}</Text>
        {item.description ? <Text style={styles.caseDesc} numberOfLines={2}>{item.description}</Text> : null}
        <View style={styles.caseMeta}>
          <View style={[styles.dot, { backgroundColor: PRIORITY_COLORS[item.priority] || '#757575' }]} />
          <Text style={styles.caseMetaTxt}>{t(item.priority, language)} · {item.case_type || 'N/A'}</Text>
          {!item.server_id && !item.synced && <Text style={styles.offlineTag}>📴 Offline</Text>}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a237e" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('searchRecords', language) || 'Search Records'}</Text>
        {activeTab === 'cases' && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
            <Text style={styles.addBtnText}>{showForm ? '✕' : '+ Case'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'cases' && styles.activeTab]} 
          onPress={() => { setActiveTab('cases'); setQuery(''); loadData(); }}>
          <Text style={[styles.tabText, activeTab === 'cases' && styles.activeTabText]}>Cases</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'complaints' && styles.activeTab]} 
          onPress={() => { setActiveTab('complaints'); setQuery(''); loadData(); }}>
          <Text style={[styles.tabText, activeTab === 'complaints' && styles.activeTabText]}>Complaints</Text>
        </TouchableOpacity>
      </View>

      {/* Add Case Form */}
      {showForm && activeTab === 'cases' && (
        <View style={styles.formCard}>
          <TextInput style={styles.formInput} value={newCase.title}
            onChangeText={v => setNewCase(p => ({ ...p, title: v }))} placeholder="Case title *" placeholderTextColor="#9e9e9e" />
          <TextInput style={styles.formInput} value={newCase.case_type}
            onChangeText={v => setNewCase(p => ({ ...p, case_type: v }))} placeholder="Case type (e.g. theft)" placeholderTextColor="#9e9e9e" />
          <TextInput style={styles.formInput} value={newCase.location}
            onChangeText={v => setNewCase(p => ({ ...p, location: v }))} placeholder="Location" placeholderTextColor="#9e9e9e" />
          <TouchableOpacity style={styles.submitBtn} onPress={handleAddCase}>
            <Text style={styles.submitTxt}>{isOnline ? '➕ Create Case' : '📴 Save Offline'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={t('searchPlaceholder', language)}
          placeholderTextColor="#9e9e9e"
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity 
          style={[styles.voiceSearchBtn, isListening && styles.voiceSearchBtnActive]} 
          onPress={toggleVoiceSearch}
        >
          <Text style={[styles.voiceSearchBtnTxt, isListening && styles.voiceSearchBtnTxtActive]}>{isListening ? '🎤...' : '🎤'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          {aiLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.searchBtnTxt}>🔍 AI</Text>}
        </TouchableOpacity>
      </View>

      {/* AI Result (Only for Cases online search usually) */}
      {aiResult ? (
        <View style={styles.aiCard}>
          <Text style={styles.aiLabel}>🤖 AI Result</Text>
          <Text style={styles.aiText}>{aiResult}</Text>
        </View>
      ) : null}

      {/* List */}
      {loading ? (
        <ActivityIndicator color="#1a237e" size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={activeTab === 'cases' ? cases : complaints}
          keyExtractor={(item, i) => String(item.id || item.offline_id || i)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
          ListEmptyComponent={<Text style={styles.emptyTxt}>{t('noResults', language)}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e0e0e0' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#1a237e' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#757575' },
  activeTabText: { color: '#1a237e' },
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  header: { backgroundColor: '#1a237e', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  addBtn: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  addBtnText: { color: '#1a237e', fontWeight: 'bold', fontSize: 13 },
  searchBar: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff', elevation: 2 },
  searchInput: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#212121' },
  searchBtn: { backgroundColor: '#1a237e', borderRadius: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  searchBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  aiCard: { backgroundColor: '#e8eaf6', margin: 12, borderRadius: 12, padding: 14 },
  aiLabel: { color: '#1a237e', fontWeight: 'bold', fontSize: 13, marginBottom: 6 },
  aiText: { color: '#3c4043', fontSize: 13, lineHeight: 20 },
  caseCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, elevation: 2 },
  caseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  caseNumber: { fontSize: 11, color: '#9e9e9e', fontWeight: '600' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  pillText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  caseTitle: { fontSize: 15, fontWeight: '600', color: '#212121', marginTop: 6 },
  caseDesc: { fontSize: 13, color: '#757575', marginTop: 4 },
  caseMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  caseMetaTxt: { fontSize: 12, color: '#757575', flex: 1 },
  offlineTag: { fontSize: 10, color: '#FF9800', fontWeight: '600' },
  emptyTxt: { textAlign: 'center', color: '#9e9e9e', marginTop: 40, fontSize: 15 },
  formCard: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderColor: '#e0e0e0' },
  formInput: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12, fontSize: 14, color: '#212121', marginBottom: 8 },
  submitBtn: { backgroundColor: '#1a237e', borderRadius: 10, padding: 13, alignItems: 'center' },
  submitTxt: { color: '#fff', fontWeight: 'bold' },
  voiceSearchBtn: { backgroundColor: '#e8eaf6', borderRadius: 10, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e0e0e0' },
  voiceSearchBtnActive: { backgroundColor: '#f44336', borderColor: '#f44336' },
  voiceSearchBtnTxt: { fontSize: 16, color: '#1a237e' },
  voiceSearchBtnTxtActive: { color: '#fff' },
});

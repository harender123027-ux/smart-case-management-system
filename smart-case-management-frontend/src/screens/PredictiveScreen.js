import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { t } from '../i18n/translations';
import api from '../services/api';

export default function PredictiveScreen() {
  const { language, isOnline } = useApp();
  const [insights, setInsights] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    if (!isOnline) {
      return Alert.alert('Offline', 'Predictive analysis requires internet connection to access crime data.');
    }
    setLoading(true);
    setInsights('');
    try {
      const res = await api.post('/ai/predictive', { language });
      setInsights(res.data.insights || 'No insights generated.');
      setData(res.data.data);
    } catch (err) {
      Alert.alert(t('error', language), 'Analysis failed. Check your API key and connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6a1b9a" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🤖 {t('predictivePolicing', language)}</Text>
      </View>

      <ScrollView style={styles.scroll}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📊 AI-Powered Crime Analysis</Text>
          <Text style={styles.infoText}>
            Analyzes last 90 days of case and complaint data to identify crime patterns,
            hotspots, and provide preventive recommendations using Google Gemini AI.
          </Text>
          {!isOnline && (
            <View style={styles.offlineWarn}>
              <Text style={styles.offlineWarnText}>📴 Offline — This feature requires internet</Text>
            </View>
          )}
        </View>

        {/* Run Button */}
        <TouchableOpacity
          style={[styles.runBtn, (loading || !isOnline) && styles.runBtnDisabled]}
          onPress={runAnalysis}
          disabled={loading || !isOnline}
        >
          {loading ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={styles.runBtnTxt}>{t('analyzing', language)}</Text>
            </>
          ) : (
            <Text style={styles.runBtnTxt}>🔍 {t('analyzeBtn', language)}</Text>
          )}
        </TouchableOpacity>

        {/* Stats Summary */}
        {data && (
          <View>
            <Text style={styles.sectionTitle}>📈 Crime Trends (Last 90 Days)</Text>
            {(data.case_trends || []).map((row, i) => (
              <View key={i} style={styles.trendCard}>
                <View style={styles.trendHeader}>
                  <Text style={styles.trendType}>{row.case_type || 'Unknown'}</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countTxt}>{row.count} cases</Text>
                  </View>
                </View>
                {row.location ? <Text style={styles.trendLoc}>📍 {row.location}</Text> : null}
              </View>
            ))}

            <Text style={styles.sectionTitle}>🚨 Recent Complaint Hotspots</Text>
            {(data.recent_complaints || []).map((row, i) => (
              <View key={i} style={styles.trendCard}>
                <View style={styles.trendHeader}>
                  <Text style={styles.trendType}>{row.complaint_type || 'Unknown'}</Text>
                  <View style={[styles.countBadge, { backgroundColor: '#f44336' }]}>
                    <Text style={styles.countTxt}>{row.count} reports</Text>
                  </View>
                </View>
                {row.location ? <Text style={styles.trendLoc}>📍 {row.location}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {/* AI Insights */}
        {insights ? (
          <View style={styles.insightsCard}>
            <Text style={styles.insightsTitle}>🧠 {t('insights', language)}</Text>
            <Text style={styles.insightsText}>{insights}</Text>
          </View>
        ) : null}

        {!insights && !loading && (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>🤖</Text>
            <Text style={styles.placeholderTxt}>
              Press "Run Analysis" to generate AI-powered{'\n'}crime predictions and recommendations
            </Text>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  header: { backgroundColor: '#6a1b9a', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  scroll: { flex: 1, padding: 16 },
  infoCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, elevation: 2 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#6a1b9a', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#616161', lineHeight: 20 },
  offlineWarn: { backgroundColor: '#fff3e0', borderRadius: 8, padding: 10, marginTop: 10 },
  offlineWarnText: { color: '#e65100', fontSize: 12, fontWeight: '600' },
  runBtn: {
    backgroundColor: '#6a1b9a', borderRadius: 14, padding: 16, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20,
  },
  runBtnDisabled: { backgroundColor: '#bdbdbd' },
  runBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#6a1b9a', marginBottom: 10, marginTop: 4 },
  trendCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, elevation: 1 },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trendType: { fontSize: 14, fontWeight: '600', color: '#212121', flex: 1 },
  countBadge: { backgroundColor: '#6a1b9a', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  countTxt: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  trendLoc: { fontSize: 12, color: '#9e9e9e', marginTop: 4 },
  insightsCard: { backgroundColor: '#f3e5f5', borderRadius: 14, padding: 16, marginTop: 8 },
  insightsTitle: { fontSize: 16, fontWeight: 'bold', color: '#6a1b9a', marginBottom: 10 },
  insightsText: { fontSize: 13, color: '#3c4043', lineHeight: 22 },
  placeholder: { alignItems: 'center', marginTop: 40 },
  placeholderIcon: { fontSize: 60, marginBottom: 16 },
  placeholderTxt: { fontSize: 14, color: '#9e9e9e', textAlign: 'center', lineHeight: 22 },
});

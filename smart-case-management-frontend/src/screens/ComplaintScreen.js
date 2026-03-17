import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, StatusBar, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { t } from '../i18n/translations';
import api from '../services/api';
import { saveComplaintLocally } from '../db/localDb';
import * as Speech from 'expo-speech';
import * as DocumentPicker from 'expo-document-picker';
import voiceService from '../services/voiceService';

const COMPLAINT_TYPES = ['theft', 'assault', 'fraud', 'missing', 'accident', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const PriorityColors = { low: '#4CAF50', medium: '#FF9800', high: '#FF5722', urgent: '#f44336' };

export default function ComplaintScreen({ navigation }) {
  const { language, isOnline } = useApp();
  const [form, setForm] = useState({
    complainant_name: '', complainant_phone: '', complainant_address: '',
    complaint_type: 'theft', description: '', location: '', priority: 'medium',
  });
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const update = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const startVoice = () => {
    if (Platform.OS !== 'web') {
      Alert.alert(t('error', language), 'Voice input is currently only supported on Web browsers.');
      return;
    }

    if (!voiceService.isSupported()) {
      Alert.alert(t('error', language), 'Speech recognition is not supported in this browser.');
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
        update('description', form.description ? `${form.description} ${text}` : text);
      },
      (error) => {
        console.error('Voice Error:', error);
        setIsListening(false);
        if (error !== 'no-speech' && error !== 'aborted') {
          Alert.alert(t('error', language), `Voice Error: ${error}`);
        }
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (!result.canceled && result.assets?.[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch {
      Alert.alert(t('error', language), 'Could not pick file');
    }
  };

  const handleSubmit = async () => {
    if (!form.complainant_name.trim() || !form.description.trim()) {
      return Alert.alert(t('error', language), 'Name and description are required');
    }

    setLoading(true);
    try {
      if (isOnline) {
        if (selectedFile) {
          const formData = new FormData();
          Object.entries(form).forEach(([k, v]) => v && formData.append(k, v));
          formData.append('language', language);
          // Web browsers need a real Blob; React Native uses the {uri,name,type} shorthand
          if (Platform.OS === 'web') {
            const response = await fetch(selectedFile.uri);
            const blob = await response.blob();
            const file = new File([blob], selectedFile.name, { type: selectedFile.mimeType || blob.type || 'application/octet-stream' });
            formData.append('file', file);
          } else {
            formData.append('file', { uri: selectedFile.uri, name: selectedFile.name, type: selectedFile.mimeType || 'application/octet-stream' });
          }
          await api.post('/complaints', formData);
        } else {
          await api.post('/complaints', { ...form, language });
        }
        Alert.alert('✅ ' + t('success', language), 'Complaint registered successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        // Save offline
        saveComplaintLocally({ ...form, language });
        Alert.alert('📴 Saved Offline', 'Complaint saved locally. Will sync when online.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      // Network error — fallback to offline save
      saveComplaintLocally({ ...form, language });
      Alert.alert('📴 Saved Offline', 'Network error. Complaint saved locally.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const TypeBtn = ({ type }) => (
    <TouchableOpacity
      style={[styles.typeBtn, form.complaint_type === type && styles.typeBtnActive]}
      onPress={() => update('complaint_type', type)}
    >
      <Text style={[styles.typeBtnText, form.complaint_type === type && styles.typeBtnTextActive]}>
        {t(`types.${type}`, language)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor="#1a237e" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('registerComplaint', language)}</Text>
        <View style={[styles.onlineBadge, { backgroundColor: isOnline ? '#4CAF50' : '#f44336' }]}>
          <Text style={styles.onlineBadgeText}>{isOnline ? '🟢' : '📴'}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Complaint Type */}
        <Text style={styles.sectionLabel}>{t('complaintType', language)}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {COMPLAINT_TYPES.map(type => <TypeBtn key={type} type={type} />)}
        </ScrollView>

        {/* Complainant Info */}
        <Text style={styles.sectionLabel}>{t('complainantName', language)} *</Text>
        <TextInput style={styles.input} value={form.complainant_name}
          onChangeText={v => update('complainant_name', v)} placeholder="Full name" placeholderTextColor="#9e9e9e" />

        <Text style={styles.sectionLabel}>{t('phone', language)}</Text>
        <TextInput style={styles.input} value={form.complainant_phone}
          onChangeText={v => update('complainant_phone', v)} placeholder="+91 XXXXX XXXXX"
          placeholderTextColor="#9e9e9e" keyboardType="phone-pad" />

        <Text style={styles.sectionLabel}>{t('address', language)}</Text>
        <TextInput style={[styles.input, styles.multiline]} value={form.complainant_address}
          onChangeText={v => update('complainant_address', v)} placeholder="Full address"
          placeholderTextColor="#9e9e9e" multiline numberOfLines={2} />

        {/* Description with Voice */}
        <View style={styles.descHeader}>
          <Text style={styles.sectionLabel}>{t('description', language)} *</Text>
          <TouchableOpacity style={styles.voiceBtn} onPress={startVoice}>
            <Text style={styles.voiceBtnText}>{isListening ? t('speaking', language) : '🎤 ' + t('voiceInput', language)}</Text>
          </TouchableOpacity>
        </View>
        <TextInput style={[styles.input, styles.multiline, { minHeight: 100 }]}
          value={form.description} onChangeText={v => update('description', v)}
          placeholder="Describe the incident in detail..." placeholderTextColor="#9e9e9e"
          multiline numberOfLines={4} />

        <Text style={styles.sectionLabel}>{t('location', language)}</Text>
        <TextInput style={styles.input} value={form.location}
          onChangeText={v => update('location', v)} placeholder="Incident location"
          placeholderTextColor="#9e9e9e" />

        {/* Priority */}
        <Text style={styles.sectionLabel}>{t('priority', language)}</Text>
        <View style={styles.priorityRow}>
          {PRIORITIES.map(p => (
            <TouchableOpacity key={p}
              style={[styles.priorityBtn, form.priority === p && { backgroundColor: PriorityColors[p] }]}
              onPress={() => update('priority', p)}>
              <Text style={[styles.priorityText, form.priority === p && { color: '#fff' }]}>
                {t(p, language)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Evidence Upload */}
        <Text style={styles.sectionLabel}>Attach Evidence (Optional)</Text>
        <TouchableOpacity style={styles.filePickerBtn} onPress={pickFile}>
          {selectedFile ? (
            <View style={styles.filePickedRow}>
              <Text style={styles.filePickedIcon}>📎</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.filePickedName} numberOfLines={1}>{selectedFile.name}</Text>
                <Text style={styles.filePickedSize}>{selectedFile.size ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFile(null)}>
                <Text style={styles.removeFile}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.filePickerEmpty}>
              <Text style={styles.filePickerEmptyIcon}>📸 / 📄</Text>
              <Text style={styles.filePickerEmptyTxt}>Tap to select photo/video/audio/document</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Submit */}
        <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.submitText}>
              {isOnline ? '📤 ' + t('submit', language) : '📴 Save Offline'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#1a237e', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  back: { color: '#fff', fontSize: 22, marginRight: 8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', flex: 1 },
  onlineBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  onlineBadgeText: { fontSize: 14 },
  scroll: { flex: 1, backgroundColor: '#f5f6fa', padding: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#1a237e', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, padding: 13, fontSize: 15, color: '#212121',
    borderWidth: 1, borderColor: '#e0e0e0', elevation: 1,
  },
  multiline: { textAlignVertical: 'top', minHeight: 60 },
  typeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e8eaf6', marginRight: 8 },
  typeBtnActive: { backgroundColor: '#1a237e' },
  typeBtnText: { color: '#1a237e', fontWeight: '600', fontSize: 13 },
  typeBtnTextActive: { color: '#fff' },
  descHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  voiceBtn: { backgroundColor: '#e8eaf6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  voiceBtnText: { color: '#1a237e', fontSize: 12, fontWeight: '600' },
  priorityRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  priorityBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f5f5f5', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0' },
  priorityText: { fontSize: 13, fontWeight: '600', color: '#424242' },
  filePickerBtn: { borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: '#bdbdbd', padding: 16, alignItems: 'center', marginTop: 4 },
  filePickerEmpty: { alignItems: 'center', gap: 6 },
  filePickerEmptyIcon: { fontSize: 24, marginBottom: 4 },
  filePickerEmptyTxt: { fontSize: 13, color: '#616161', fontWeight: '500' },
  filePickedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  filePickedIcon: { fontSize: 24 },
  filePickedName: { fontSize: 14, fontWeight: '600', color: '#212121', flex: 1 },
  filePickedSize: { fontSize: 11, color: '#9e9e9e', marginTop: 2 },
  removeFile: { color: '#f44336', fontSize: 16, fontWeight: 'bold', padding: 4 },
  submitBtn: { backgroundColor: '#1a237e', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 32 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, StatusBar, ActivityIndicator, Modal,
  ScrollView, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useApp } from '../context/AppContext';
import { t } from '../i18n/translations';
import api from '../services/api';
import { getLocalEvidence, saveEvidenceLocally } from '../db/localDb';

// ─── Fuzzy match helper ─────────────────────────────────────
const fuzzyMatch = (str = '', query = '') => {
  if (!query) return true;
  const s = str.toLowerCase();
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

const HighlightText = ({ text = '', query = '', style }) => {
  if (!query || !text.toLowerCase().includes(query.toLowerCase())) {
    return <Text style={style}>{text}</Text>;
  }
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  return (
    <Text style={style}>
      {text.slice(0, idx)}
      <Text style={styles.highlight}>{text.slice(idx, idx + query.length)}</Text>
      {text.slice(idx + query.length)}
    </Text>
  );
};

// ─── Media Type Definitions ─────────────────────────────────
const MEDIA_TYPES = [
  { key: 'audio',    label: 'Audio',    icon: '🎤', color: '#E91E63', mimeTypes: ['audio/*'],     description: 'Attach audio evidence' },
  { key: 'video',    label: 'Video',    icon: '🎬', color: '#FF5722', mimeTypes: ['video/*'],     description: 'Attach video footage' },
  { key: 'document', label: 'PDF/Doc',  icon: '📄', color: '#2196F3', mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], description: 'Attach PDF or Word document' },
  { key: 'photo',    label: 'Photo',    icon: '📷', color: '#4CAF50', mimeTypes: ['image/*'],     description: 'Attach crime scene photo' },
  { key: 'physical', label: 'Physical', icon: '📦', color: '#9C27B0', mimeTypes: ['*/*'],         description: 'Log a physical evidence item' },
];
const TYPE_INFO = Object.fromEntries(MEDIA_TYPES.map(m => [m.key, m]));

// ─── Mic pulse animation component ─────────────────────────
const PulsingMic = ({ isRecording }) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.25, duration: 500, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [isRecording]);

  return (
    <Animated.View style={[styles.micPulse, { transform: [{ scale: pulse }] }]}>
      <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎙️'}</Text>
    </Animated.View>
  );
};

export default function EvidenceScreen() {
  const { language, isOnline } = useApp();
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', case_id: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('all');

  // ─── Voice recording state ───────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingObj, setRecordingObj] = useState(null);
  const [voiceError, setVoiceError] = useState('');

  useEffect(() => { loadEvidence(); }, []);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingObj) recordingObj.stopAndUnloadAsync().catch(() => {});
    };
  }, [recordingObj]);

  const loadEvidence = async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const res = await api.get('/evidence?limit=100');
        setEvidence(res.data.evidence || []);
      } else {
        setEvidence(getLocalEvidence());
      }
    } catch {
      setEvidence(getLocalEvidence());
    } finally {
      setLoading(false);
    }
  };

  const filteredEvidence = useMemo(() => {
    let list = evidence;
    if (filterType !== 'all') list = list.filter(e => e.evidence_type === filterType);
    if (searchQuery.trim()) {
      list = list.filter(item =>
        fuzzyMatch(item.title, searchQuery) ||
        fuzzyMatch(item.description, searchQuery) ||
        fuzzyMatch(item.evidence_type, searchQuery) ||
        fuzzyMatch(item.file_name, searchQuery) ||
        fuzzyMatch(item.evidence_number, searchQuery)
      );
    }
    return list;
  }, [evidence, searchQuery, filterType]);

  const openAddModal = (type) => {
    setSelectedType(type);
    setForm({ title: '', description: '', case_id: '' });
    setSelectedFile(null);
    setVoiceError('');
    setShowModal(true);
  };

  const pickFile = async () => {
    if (!selectedType) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: selectedType.mimeTypes,
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (!result.canceled && result.assets?.[0]) {
        setSelectedFile(result.assets[0]);
        if (!form.title) {
          setForm(p => ({ ...p, title: result.assets[0].name.replace(/\.[^/.]+$/, '') }));
        }
      }
    } catch {
      Alert.alert(t('error', language), 'Could not pick file');
    }
  };

  // ─── START recording ─────────────────────────────────────
  const startRecording = async () => {
    setVoiceError('');
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') {
        setVoiceError('Microphone permission denied. Please allow in device settings.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecordingObj(recording);
      setIsRecording(true);
    } catch (err) {
      setVoiceError('Could not start recording: ' + err.message);
    }
  };

  // ─── STOP recording → transcribe via Gemini ──────────────
  const stopAndTranscribe = async () => {
    if (!recordingObj) return;
    setIsRecording(false);
    setIsTranscribing(true);
    setVoiceError('');

    try {
      await recordingObj.stopAndUnloadAsync();
      const uri = recordingObj.getURI();
      setRecordingObj(null);

      if (!uri) throw new Error('No recording URI');

      if (!isOnline) {
        setVoiceError('Transcription needs internet. Recording stopped.');
        setIsTranscribing(false);
        return;
      }

      // Read audio file as base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Send to Gemini via backend
      const res = await api.post('/ai/transcribe', {
        audioBase64: base64Audio,
        mimeType: 'audio/m4a',
        language,
      });

      const transcript = res.data.transcript || '';
      if (transcript) {
        // Append to existing description (or set)
        setForm(p => ({
          ...p,
          description: p.description ? `${p.description} ${transcript}` : transcript,
        }));
      } else {
        setVoiceError('No speech detected. Try again.');
      }

      // Cleanup temp file
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (err) {
      setVoiceError('Transcription failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsTranscribing(false);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) return Alert.alert(t('error', language), 'Title is required');
    if (!selectedType) return;
    setSaving(true);
    const evidenceData = { ...form, evidence_type: selectedType.key, file_name: selectedFile?.name, file_path: selectedFile?.uri };

    try {
      if (isOnline && selectedFile) {
        const formData = new FormData();
        Object.entries(form).forEach(([k, v]) => v && formData.append(k, v));
        formData.append('evidence_type', selectedType.key);
        // Web browsers need a real Blob; React Native uses the {uri,name,type} shorthand
        if (Platform.OS === 'web') {
          const response = await fetch(selectedFile.uri);
          const blob = await response.blob();
          const file = new File([blob], selectedFile.name, { type: selectedFile.mimeType || blob.type || 'application/octet-stream' });
          formData.append('file', file);
        } else {
          formData.append('file', { uri: selectedFile.uri, name: selectedFile.name, type: selectedFile.mimeType || 'application/octet-stream' });
        }
        await api.post('/evidence', formData);
        Alert.alert('✅ Uploaded', `${selectedType.label} evidence uploaded`);
      } else if (isOnline) {
        await api.post('/evidence', { ...form, evidence_type: selectedType.key });
        Alert.alert('✅ Saved', 'Evidence record created');
      } else {
        saveEvidenceLocally(evidenceData);
        Alert.alert('📴 Saved Offline', 'Will sync when online');
      }
      setShowModal(false);
      loadEvidence();
    } catch {
      saveEvidenceLocally(evidenceData);
      Alert.alert('📴 Saved Offline', 'Network error. Saved locally.');
      setShowModal(false);
      loadEvidence();
    } finally {
      setSaving(false);
    }
  };

  const renderCard = ({ item }) => {
    const typeInfo = TYPE_INFO[item.evidence_type] || TYPE_INFO.physical;
    return (
      <View style={[styles.card, { borderLeftColor: typeInfo.color, borderLeftWidth: 4 }]}>
        <View style={styles.cardRow}>
          <View style={[styles.typeIconBg, { backgroundColor: typeInfo.color + '20' }]}>
            <Text style={styles.typeIcon}>{typeInfo.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <HighlightText text={item.title || 'Untitled'} query={searchQuery} style={styles.cardTitle} />
            <HighlightText text={item.evidence_number || item.offline_id?.slice(0, 16) || '—'} query={searchQuery} style={styles.cardSub} />
          </View>
          <View style={[styles.typePill, { backgroundColor: typeInfo.color }]}>
            <Text style={styles.typePillText}>{typeInfo.label}</Text>
          </View>
          {!item.server_id && !item.synced && <Text style={{ marginLeft: 6, fontSize: 14 }}>📴</Text>}
        </View>
        {item.description ? <HighlightText text={item.description} query={searchQuery} style={styles.cardDesc} /> : null}
        {item.file_name ? (
          <View style={[styles.fileChip, { backgroundColor: typeInfo.color + '20' }]}>
            <Text style={[styles.fileChipTxt, { color: typeInfo.color }]}>📎 {item.file_name}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1b5e20" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('evidenceTracker', language)}</Text>
        <View style={[styles.onlineDot, { backgroundColor: isOnline ? '#69f0ae' : '#ff5252' }]} />
      </View>

      {/* Media Type Buttons */}
      <View style={styles.mediaButtonsContainer}>
        <Text style={styles.addLabel}>{t('addEvidence', language)}:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {MEDIA_TYPES.map(type => (
            <TouchableOpacity key={type.key} style={[styles.mediaBtn, { backgroundColor: type.color }]}
              onPress={() => openAddModal(type)} activeOpacity={0.8}>
              <Text style={styles.mediaBtnIcon}>{type.icon}</Text>
              <Text style={styles.mediaBtnLabel}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Fuzzy Search Bar */}
      <View style={[styles.searchContainer, searchFocused && styles.searchContainerFocused]}>
        <Text style={styles.searchIconTxt}>🔍</Text>
        <TextInput style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery}
          placeholder="Fuzzy search: title, type, file name..." placeholderTextColor="#9e9e9e"
          onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
          returnKeyType="search" clearButtonMode="while-editing" />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Text style={styles.clearBtnTxt}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {searchQuery.length > 0 && (
        <View style={styles.resultBanner}>
          <Text style={styles.resultTxt}>🔎 {filteredEvidence.length} result{filteredEvidence.length !== 1 ? 's' : ''} for "{searchQuery}"</Text>
        </View>
      )}

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <TouchableOpacity style={[styles.filterTab, filterType === 'all' && styles.filterTabActive]} onPress={() => setFilterType('all')}>
          <Text style={[styles.filterTabTxt, filterType === 'all' && styles.filterTabTxtActive]}>All</Text>
        </TouchableOpacity>
        {MEDIA_TYPES.map(type => (
          <TouchableOpacity key={type.key}
            style={[styles.filterTab, filterType === type.key && { backgroundColor: type.color }]}
            onPress={() => setFilterType(type.key)}>
            <Text style={[styles.filterTabTxt, filterType === type.key && styles.filterTabTxtActive]}>
              {type.icon} {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color="#2e7d32" size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredEvidence}
          keyExtractor={(item, i) => String(item.id || item.offline_id || i)}
          renderItem={renderCard}
          contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>{searchQuery ? '🔍' : '🗂️'}</Text>
              <Text style={styles.emptyTxt}>{searchQuery ? `No evidence matching "${searchQuery}"` : t('noEvidence', language)}</Text>
            </View>
          }
        />
      )}

      {/* ─── Add Evidence Modal ─── */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => {
        if (isRecording && recordingObj) { recordingObj.stopAndUnloadAsync().catch(() => {}); setIsRecording(false); }
        setShowModal(false);
      }}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalSheet}>
            {selectedType && (
              <View style={[styles.modalHeader, { backgroundColor: selectedType.color }]}>
                <Text style={styles.modalHeaderIcon}>{selectedType.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalHeaderTitle}>Add {selectedType.label} Evidence</Text>
                  <Text style={styles.modalHeaderSub}>{selectedType.description}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                  <Text style={styles.closeBtnTxt}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Evidence Title *</Text>
              <TextInput style={styles.modalInput} value={form.title}
                onChangeText={v => setForm(p => ({ ...p, title: v }))}
                placeholder="Enter evidence title" placeholderTextColor="#9e9e9e" />

              {/* ─── Description + Speech-to-Text ─── */}
              <View style={styles.descLabelRow}>
                <Text style={styles.fieldLabel}>Description</Text>
                <Text style={styles.voiceHint}>tap mic to dictate</Text>
              </View>

              <View style={styles.descWrapper}>
                <TextInput
                  style={styles.descInput}
                  value={form.description}
                  onChangeText={v => setForm(p => ({ ...p, description: v }))}
                  placeholder="Describe this evidence... or use voice 🎙️"
                  placeholderTextColor="#9e9e9e"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                {/* Mic button */}
                <TouchableOpacity
                  style={[
                    styles.micButton,
                    isRecording && styles.micButtonRecording,
                    isTranscribing && styles.micButtonTranscribing,
                    selectedType && { borderColor: selectedType.color },
                  ]}
                  onPress={isRecording ? stopAndTranscribe : startRecording}
                  disabled={isTranscribing}
                  activeOpacity={0.8}
                >
                  {isTranscribing ? (
                    <ActivityIndicator color={selectedType?.color || '#2e7d32'} size="small" />
                  ) : (
                    <PulsingMic isRecording={isRecording} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Status messages */}
              {isRecording && (
                <View style={styles.voiceStatusBox}>
                  <Text style={styles.voiceStatusDot}>🔴</Text>
                  <Text style={styles.voiceStatusTxt}>Recording... tap ⏹ to stop and transcribe</Text>
                </View>
              )}
              {isTranscribing && (
                <View style={[styles.voiceStatusBox, { backgroundColor: '#e3f2fd' }]}>
                  <ActivityIndicator size="small" color="#1a237e" />
                  <Text style={[styles.voiceStatusTxt, { color: '#1a237e' }]}>Transcribing with Gemini AI...</Text>
                </View>
              )}
              {voiceError ? (
                <View style={[styles.voiceStatusBox, { backgroundColor: '#ffebee' }]}>
                  <Text style={styles.voiceStatusDot}>⚠️</Text>
                  <Text style={[styles.voiceStatusTxt, { color: '#c62828' }]}>{voiceError}</Text>
                </View>
              ) : null}

              {/* Case ID */}
              <Text style={styles.fieldLabel}>Case ID (optional)</Text>
              <TextInput style={styles.modalInput} value={form.case_id}
                onChangeText={v => setForm(p => ({ ...p, case_id: v }))}
                placeholder="Link to case ID" placeholderTextColor="#9e9e9e" keyboardType="numeric" />

              {/* File picker */}
              <Text style={styles.fieldLabel}>Attach File</Text>
              <TouchableOpacity style={[styles.filePickerBtn, selectedType && { borderColor: selectedType.color }]} onPress={pickFile}>
                {selectedFile ? (
                  <View style={styles.filePickedRow}>
                    <Text style={styles.filePickedIcon}>{selectedType?.icon}</Text>
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
                    <Text style={styles.filePickerEmptyIcon}>{selectedType ? selectedType.icon : '📎'}</Text>
                    <Text style={styles.filePickerEmptyTxt}>Tap to pick {selectedType?.label || 'file'}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, selectedType && { backgroundColor: selectedType.color }, saving && { opacity: 0.6 }]}
                onPress={handleSave} disabled={saving || isRecording || isTranscribing}>
                {saving ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.saveBtnTxt}>{isOnline ? `💾 Save ${selectedType?.label}` : '📴 Save Offline'}</Text>
                )}
              </TouchableOpacity>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  header: { backgroundColor: '#1b5e20', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  onlineDot: { width: 12, height: 12, borderRadius: 6 },
  mediaButtonsContainer: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, elevation: 2 },
  addLabel: { fontSize: 11, color: '#9e9e9e', fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 },
  mediaBtn: { borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', marginRight: 10, minWidth: 72, elevation: 3 },
  mediaBtnIcon: { fontSize: 26 },
  mediaBtnLabel: { color: '#fff', fontSize: 11, fontWeight: '700', marginTop: 4 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1.5, borderColor: '#e0e0e0', elevation: 2 },
  searchContainerFocused: { borderColor: '#2e7d32' },
  searchIconTxt: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: '#212121' },
  clearBtn: { padding: 4 },
  clearBtnTxt: { color: '#9e9e9e', fontSize: 16, fontWeight: 'bold' },
  resultBanner: { marginHorizontal: 12, marginTop: 6, backgroundColor: '#e8f5e9', borderRadius: 8, padding: 8 },
  resultTxt: { color: '#2e7d32', fontSize: 12, fontWeight: '600' },
  highlight: { backgroundColor: '#fff176', color: '#212121', fontWeight: 'bold' },
  filterScroll: { paddingHorizontal: 12, paddingVertical: 8, maxHeight: 48 },
  filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e0e0e0', marginRight: 8 },
  filterTabActive: { backgroundColor: '#2e7d32' },
  filterTabTxt: { fontSize: 12, fontWeight: '600', color: '#616161' },
  filterTabTxtActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeIconBg: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  typeIcon: { fontSize: 22 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#212121' },
  cardSub: { fontSize: 11, color: '#9e9e9e', marginTop: 2 },
  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typePillText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  cardDesc: { fontSize: 12, color: '#757575', marginTop: 8 },
  fileChip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginTop: 8, alignSelf: 'flex-start' },
  fileChipTxt: { fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyTxt: { color: '#9e9e9e', fontSize: 15, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  modalHeaderIcon: { fontSize: 32 },
  modalHeaderTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  modalHeaderSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  closeBtn: { padding: 6 },
  closeBtnTxt: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalBody: { padding: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#424242', marginBottom: 6, marginTop: 12 },
  modalInput: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 13, fontSize: 14, color: '#212121', borderWidth: 1, borderColor: '#e0e0e0' },

  // Description + mic
  descLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 6 },
  voiceHint: { fontSize: 11, color: '#9e9e9e', fontStyle: 'italic' },
  descWrapper: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  descInput: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 10, padding: 13, fontSize: 14, color: '#212121', borderWidth: 1, borderColor: '#e0e0e0', minHeight: 90, textAlignVertical: 'top' },
  micButton: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#f5f5f5',
    borderWidth: 2, borderColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center',
    elevation: 3, marginTop: 2,
  },
  micButtonRecording: { backgroundColor: '#ffebee', borderColor: '#f44336' },
  micButtonTranscribing: { backgroundColor: '#e8eaf6', borderColor: '#3f51b5' },
  micPulse: { alignItems: 'center', justifyContent: 'center' },
  micIcon: { fontSize: 24 },
  voiceStatusBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ffebee', borderRadius: 10, padding: 10, marginTop: 8 },
  voiceStatusDot: { fontSize: 14 },
  voiceStatusTxt: { fontSize: 12, color: '#b71c1c', flex: 1 },
  filePickerBtn: { borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: '#bdbdbd', padding: 16, alignItems: 'center', marginTop: 4 },
  filePickerEmpty: { alignItems: 'center', gap: 6 },
  filePickerEmptyIcon: { fontSize: 36 },
  filePickerEmptyTxt: { fontSize: 14, color: '#616161', fontWeight: '600' },
  filePickedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  filePickedIcon: { fontSize: 28 },
  filePickedName: { fontSize: 14, fontWeight: '600', color: '#212121', flex: 1 },
  filePickedSize: { fontSize: 11, color: '#9e9e9e', marginTop: 2 },
  removeFile: { color: '#f44336', fontSize: 16, fontWeight: 'bold', padding: 4 },
  saveBtn: { backgroundColor: '#2e7d32', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
  saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

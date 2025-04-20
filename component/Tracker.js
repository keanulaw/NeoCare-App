// screens/Tracker.js
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import theme from '../src/theme';
import CustomHeader from './CustomHeader';
import BabySizeCard from './BabySizeCard';          // ← NEW

const SERVER_URL = 'http://192.168.1.2:3000';       // ← update to your server

export default function Tracker({ navigation }) {
  /* ─────────────── State ─────────────── */
  const [notes, setNotes] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteSummary, setNoteSummary] = useState('');
  const [noteSummaryLoading, setNoteSummaryLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ─────────────── Fetch notes + doctors ─────────────── */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // find client record
        const clientQ = query(
          collection(db, 'clients'),
          where('userId', '==', user.uid)
        );
        const clientSnap = await getDocs(clientQ);
        if (clientSnap.empty) {
          setNotes([]);
          return;
        }
        const clientId = clientSnap.docs[0].id;

        // fetch notes
        const notesQ = query(
          collection(db, 'consultationNotes'),
          where('clientId', '==', clientId)
        );
        const notesSnap = await getDocs(notesQ);
        const allNotes = notesSnap.docs
          .map((d) => ({
            id: d.id,
            consultantId: d.data().consultantId,
            consultantName: d.data().consultantName,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate() || new Date(),
          }))
          .filter((n) => n.consultantId && n.consultantName);

        setNotes(allNotes);

        // unique doctor list
        const uniq = {};
        allNotes.forEach((n) => (uniq[n.consultantId] = n.consultantName));
        setDoctors(Object.entries(uniq).map(([id, name]) => ({ id, name })));
      } catch (err) {
        console.error('Tracker error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  /* ─────────────── AI summary per note ─────────────── */
  useEffect(() => {
    if (!selectedNote) return;
    const runAI = async () => {
      setNoteSummary('');
      setNoteSummaryLoading(true);
      if (SERVER_URL.includes('YOUR_SERVER_IP')) {
        console.warn('Set SERVER_URL first');
        setNoteSummaryLoading(false);
        return;
      }
      try {
        const resp = await fetch(`${SERVER_URL}/analyzeNotes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: [selectedNote] }),
        });
        if (resp.ok) {
          const { summary } = await resp.json();
          setNoteSummary(summary || '');
        }
      } catch (e) {
        console.warn('AI error:', e.message);
      } finally {
        setNoteSummaryLoading(false);
      }
    };
    runAI();
  }, [selectedNote]);

  /* ─────────────── Loading ─────────────── */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  /* ─────────────── NOTE DETAIL ─────────────── */
  if (selectedNote) {
    const n = selectedNote;
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title="Note Details" navigation={navigation} />
        <TouchableOpacity
          onPress={() => setSelectedNote(null)}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Back to notes</Text>
        </TouchableOpacity>

        {/* AI Insights */}
        {noteSummaryLoading ? (
          <ActivityIndicator style={styles.aiLoader} color={theme.colors.primary} />
        ) : noteSummary ? (
          <View style={styles.aiCard}>
            <Text style={styles.aiHeader}>Insights by AI</Text>
            <Text style={styles.aiText}>{noteSummary}</Text>
          </View>
        ) : null}

        <ScrollView contentContainerStyle={styles.detailContainer}>
          {[
            { label: 'Recorded On', value: n.createdAt.toLocaleString() },
            { label: 'Doctor', value: n.consultantName },
            { label: 'Blood Pressure', value: n.maternalHealth.bloodPressure },
            { label: 'Weight Gain', value: `${n.maternalHealth.weightGain} kg` },
            { label: 'Hemoglobin', value: `${n.maternalHealth.hemoglobin} g/dL` },
            { label: 'Uterine Height', value: `${n.maternalHealth.uterineHeight} cm` },
            { label: 'Symptoms', value: n.maternalHealth.symptoms },
            { label: 'Fetal Heart Rate', value: `${n.fetalHealth.heartRate} bpm` },
            { label: 'Fetal Movements', value: n.fetalHealth.movementFrequency },
            { label: 'Presentation', value: n.fetalHealth.presentation },
            { label: 'Gestational Age', value: n.fetalHealth.gestationalAge },
            { label: 'Amniotic Fluid', value: n.fetalHealth.amnioticFluid },
            { label: 'Ultrasound Findings', value: n.fetalHealth.ultrasoundFindings },
            { label: 'Assessment', value: n.assessment },
            { label: 'Recommendations', value: n.recommendations },
          ].map((item) => (
            <View key={item.label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{item.label}:</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ─────────────── NOTES OF A SELECTED DOCTOR ─────────────── */
  if (selectedDoctorId) {
    const docNotes = notes.filter((n) => n.consultantId === selectedDoctorId);
    const docName = doctors.find((d) => d.id === selectedDoctorId)?.name;

    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title={`${docName}'s Notes`} navigation={navigation} />
        <TouchableOpacity
          onPress={() => setSelectedDoctorId(null)}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Back to doctors</Text>
        </TouchableOpacity>

        <FlatList
          data={docNotes}
          keyExtractor={(i) => i.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No notes recorded by {docName}.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.noteCard}
              onPress={() => setSelectedNote(item)}
            >
              <Text style={styles.noteDate}>{item.createdAt.toLocaleDateString()}</Text>
              <Text style={styles.noteSnippet}>
                {item.assessment?.slice(0, 60) || 'Tap to view details'}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
        />
      </SafeAreaView>
    );
  }

  /* ─────────────── DEFAULT: DOCTOR LIST + BABY SIZE CARD ─────────────── */
  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Your Doctors" navigation={navigation} />

      {/* NEW baby‑size card */}
      <BabySizeCard />

      <Text style={styles.hintText}>
        Select a doctor to see your past consultation notes.
      </Text>

      <FlatList
        data={doctors}
        keyExtractor={(d) => d.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No doctors have added notes yet.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.doctorCard}
            onPress={() => setSelectedDoctorId(item.id)}
          >
            <Text style={styles.doctorName}>{item.name}</Text>
            <Text style={styles.doctorSubtitle}>Tap to view notes</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
}

/* ─────────────── Styles (unchanged except spacing) ─────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background || '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Doctor list
  hintText: {
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    color: theme.colors.textSecondary,
  },
  doctorCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    elevation: 2,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  doctorSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },

  // Notes list
  listContainer: { paddingBottom: 30 },
  noteCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary,
    elevation: 1,
  },
  noteDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  noteSnippet: {
    fontSize: 15,
    color: theme.colors.textPrimary,
  },

  // Empty state
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginTop: 30,
  },

  // Back button
  backButton: { margin: 16 },
  backText: {
    color: theme.colors.primary,
    fontSize: 14,
  },

  // AI Insights card
  aiLoader: { margin: 16 },
  aiCard: {
    backgroundColor: '#eef6ff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primaryLight,
  },
  aiHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primaryDark,
    marginBottom: 6,
  },
  aiText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },

  // Detail view
  detailContainer: { padding: 16 },
  detailRow: { marginBottom: 12 },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
});

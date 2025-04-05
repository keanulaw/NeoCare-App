import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import theme from '../src/theme';
import commonStyles from '../src/commonStyles';

const Tracker = ({ navigation }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // 1. Get client document ID from clients collection
        const clientsQuery = query(
          collection(db, "clients"),
          where("userId", "==", user.uid)
        );
        const clientSnapshot = await getDocs(clientsQuery);

        if (clientSnapshot.empty) {
          console.log("No matching client document found");
          setNotes([]);
          setLoading(false);
          return;
        }

        // Get client document ID
        const clientDoc = clientSnapshot.docs[0];
        const clientId = clientDoc.id;

        // 2. Query notes using client document ID
        const notesQuery = query(
          collection(db, "consultationNotes"),
          where("clientId", "==", clientId)
        );
        const notesSnapshot = await getDocs(notesQuery);

        const notesData = notesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));

        setNotes(notesData);
      } catch (error) {
        console.error("Error fetching notes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const renderNoteItem = ({ item }) => (
    <View style={commonStyles.card}>
      {/* Maternal Health Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Maternal Health</Text>
        <View style={styles.grid}>
          <DetailItem label="Blood Pressure" value={item.maternalHealth.bloodPressure} />
          <DetailItem label="Weight Gain" value={item.maternalHealth.weightGain} unit="kg" />
          <DetailItem label="Hemoglobin" value={item.maternalHealth.hemoglobin} unit="g/dL" />
          <DetailItem label="Uterine Height" value={item.maternalHealth.uterineHeight} unit="cm" />
          <DetailItem label="Urine Analysis" value={item.maternalHealth.urineAnalysis} />
          <DetailItem label="Symptoms" value={item.maternalHealth.symptoms} />
        </View>
      </View>

      {/* Fetal Health Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fetal Health</Text>
        <View style={styles.grid}>
          <DetailItem label="Heart Rate" value={item.fetalHealth.heartRate} unit="bpm" />
          <DetailItem label="Movements" value={item.fetalHealth.movementFrequency} />
          <DetailItem label="Presentation" value={item.fetalHealth.presentation} />
          <DetailItem label="Gestational Age" value={item.fetalHealth.gestationalAge} />
          <DetailItem label="Amniotic Fluid" value={item.fetalHealth.amnioticFluid} />
          <DetailItem label="Ultrasound" value={item.fetalHealth.ultrasoundFindings} />
        </View>
      </View>

      {/* Assessment & Recommendations */}
      <View style={styles.section}>
        <DetailItem label="Assessment" value={item.assessment} fullWidth />
        <DetailItem label="Recommendations" value={item.recommendations} fullWidth />
      </View>

      <Text style={styles.dateText}>
        Recorded on {item.createdAt.toLocaleDateString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={commonStyles.screenContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={commonStyles.screenContainer}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <Text style={commonStyles.headerText}>Pregnancy Tracker</Text>
      
      {notes.length === 0 ? (
        <Text style={styles.emptyText}>No consultation notes found</Text>
      ) : (
        <FlatList
          data={notes}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </ScrollView>
  );
};

const DetailItem = ({ label, value, unit, fullWidth }) => (
  <View style={[styles.detailItem, fullWidth && styles.fullWidth]}>
    <Text style={styles.labelText}>{label}:</Text>
    <Text style={styles.valueText}>
      {value || 'N/A'} {unit && value && unit}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.text.subheading,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    marginBottom: theme.spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  labelText: {
    fontSize: theme.text.caption,
    color: theme.colors.textSecondary,
  },
  valueText: {
    fontSize: theme.text.body,
    color: theme.colors.textPrimary,
  },
  dateText: {
    fontSize: theme.text.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'right',
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.lg,
  },
  listContainer: {
    paddingBottom: theme.spacing.xl,
  },
  backButton: {
    padding: 10,
    marginBottom: 10,
  },
  backButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
  },
});

export default Tracker; 
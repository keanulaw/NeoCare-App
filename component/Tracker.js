import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView, SafeAreaView } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import theme from '../src/theme';
import CustomHeader from './CustomHeader';

const Tracker = ({ navigation }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Get the client document for the current user
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

        // Query consultation notes for the client
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

  // Render each note as a simplified summary card
  const renderNoteItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.dateText}>
        Recorded on {item.createdAt.toLocaleDateString()}
      </Text>
      <View style={styles.noteContent}>
        <Text style={styles.headerText}>Maternal Health</Text>
        <Text style={styles.metricText}>
          • Blood Pressure: {item.maternalHealth?.bloodPressure || 'N/A'}
        </Text>
        <Text style={styles.metricText}>
          • Weight Gain: {item.maternalHealth?.weightGain ? `${item.maternalHealth.weightGain} kg` : 'N/A'}
        </Text>
        <Text style={styles.headerText}>Fetal Health</Text>
        <Text style={styles.metricText}>
          • Heart Rate: {item.fetalHealth?.heartRate ? `${item.fetalHealth.heartRate} bpm` : 'N/A'}
        </Text>
        <Text style={styles.metricText}>
          • Movements: {item.fetalHealth?.movementFrequency || 'N/A'}
        </Text>
        {item.assessment && (
          <Text style={styles.assessmentText}>
            Assessment: {item.assessment}
          </Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary || '#D47FA6'} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Pregnancy Tracker" navigation={navigation} />
      <ScrollView contentContainerStyle={styles.contentContainer}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background || '#F5F5F5',
  },
  contentContainer: {
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.textSecondary || '#666',
    textAlign: 'right',
    marginBottom: 8,
  },
  noteContent: {
    marginVertical: 5,
  },
  headerText: {
    fontSize: 16,
    color: theme.colors.primary || '#D47FA6',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  metricText: {
    fontSize: 16,
    color: theme.colors.textPrimary || '#333',
    marginBottom: 3,
  },
  assessmentText: {
    fontSize: 14,
    color: theme.colors.primary || '#D47FA6',
    fontWeight: '500',
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary || '#666',
    marginTop: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
});

export default Tracker; 
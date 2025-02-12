import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MessageScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Message Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
  },
  text: {
    fontSize: 24,
    color: '#D47FA6',
  },
});
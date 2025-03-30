import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { Button } from 'react-native';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      if (!email.includes('@')) {
        alert('Please enter a valid email address.');
        return;
      }

      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      alert('Logged in successfully!');
      navigation.navigate('GetStarted');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Enter your email first');
      return;
    }
    
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Reset email sent');
    } catch (error) {
      Alert.alert(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Text style={styles.subtitle}>Please sign in to continue</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button 
        title={loading ? 'Loading...' : 'Login'} 
        disabled={loading}
        onPress={handleLogin}
      />
      <TouchableOpacity onPress={handleResetPassword}>
        <Text style={styles.link}>Forgot Password?</Text>
      </TouchableOpacity>
      <View style={styles.socialLogin}>
        <Text>or</Text>
        {/* Add social login buttons here */}
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFF4E6',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#D47FA6',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#A9A9A9',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D47FA6',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FF6F61',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    color: '#FF6F61',
    textAlign: 'center',
    marginTop: 10,
  },
  socialLogin: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
});

export default LoginScreen; 
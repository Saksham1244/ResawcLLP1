import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Lock, Mail } from 'lucide-react-native';

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    // Basic mock authentication
    if (email.trim().toUpperCase() === 'ADMIN' && password === 'Admin@123') {
      setError('');
      onLogin();
    } else {
      setError('Invalid ID or Password');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>R</Text>
          </View>
          <Text style={styles.title}>Resawc Core</Text>
          <Text style={styles.subtitle}>Sign in to your employee account</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputContainer}>
            <Mail color="#94a3b8" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="name@resawc.com"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <Lock color="#94a3b8" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.loginBtn, (!email || !password) && styles.loginBtnDisabled]} 
          onPress={handleLogin}
          disabled={!email || !password}
        >
          <Text style={styles.loginBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBox: {
    width: 60,
    height: 60,
    backgroundColor: '#6366f1',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  logoText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '600',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#0f172a',
    fontSize: 15,
  },
  forgotBtn: {
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  forgotText: {
    color: '#6366f1',
    fontWeight: '600',
    fontSize: 13,
  },
  loginBtn: {
    backgroundColor: '#6366f1',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  }
});

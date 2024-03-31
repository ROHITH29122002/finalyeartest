// AdminLoginView.js

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import AdminView from "./AdminView"

const AdminLoginView = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);


  const handleLogin = async () => {
    // Validate inputs
    if (!username.trim() || !password.trim()) {
      alert('Error', 'Username and password are required.');
      return;
    }

    try {
        const response = await fetch('http://192.168.1.32:5000/api/admin/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
          });
    
      const data = await response.json();

      if (response.ok) {
        setIsLoggedIn(true);
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Admin login error:', error.response.data);
      alert('Error', 'Invalid username or password.');
    }
  };

  const handleRegister = async () => {
    // Validate inputs
    if (!username.trim() || !password.trim()) {
      alert('Error', 'Username and password are required.');
      return;
    }

    try {
        const response = await fetch('http://192.168.1.32:5000/api/admin/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
          });
    
          const data = await response.json();

      if (response.ok) {
        // Registration successful, you can optionally log in the driver automatically
        alert('Admin registered successfully');
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Admin registration error:', error.response.data);
      alert('Error', 'Registration failed. Please try again.');
    }
  };

  const handleLogout=()=>{
    setIsLoggedIn(false);
  }

  return (
    <View style={styles.container}>
        {isLoggedIn ? (
      <AdminView onLogout={handleLogout} name={username}/>
    )
    :
    (
      <>
      <Text style={styles.title}>Admin Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Login" onPress={handleLogin} />
      <Button title="Register" onPress={handleRegister} />
      </>
    )
    }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    padding: 8,
    width: '100%',
  },
});

export default AdminLoginView;

// UserLoginView.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import UserView from "./UserView";

const UserLoginView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }

    // Make API call to driver login endpoint on the server
    try {
      const response = await fetch('http://192.168.29.154:5000/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // Handle the response accordingly, e.g., store driver data or show an error
      if (response.ok) {
        // Successful login, you can store driver data or navigate to another screen
        setIsLoggedIn(true);
      } else {
        // Display an error message
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleRegister = async () => {
    // Perform client-side validation (you can add more checks)
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }

    // Make API call to user registration endpoint on the server
    try {
      const response = await fetch('http://192.168.29.154:5000/api/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // Handle the response accordingly, e.g., show a success message or an error
      if (response.ok) {
        alert('User registered successfully');
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      alert('Registration failed. Please try again.');
    }
  };

  const handleLogout=()=>{
    setIsLoggedIn(false);
  }

  return (
    <View style={styles.container}>
      {isLoggedIn ? (
        <UserView onLogout={handleLogout}/>
      ) : (
        <>
          <Text style={styles.title}>User Login</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            onChangeText={(text) => setEmail(text)}
            value={email}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            onChangeText={(text) => setPassword(text)}
            value={password}
          />
          <Button title="Login" onPress={handleLogin} />
          <Button title="Register" onPress={handleRegister} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    width: '80%',
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    padding: 8,
  },
});

export default UserLoginView;
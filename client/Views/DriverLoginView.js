import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import DriverView from './DriverView';

const DriverLoginView = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [busNumber, setBusNumber] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = async () => {
    // Perform client-side validation (you can add more checks)
    if (!name || !busNumber) {
      alert('Please fill in all fields');
      return;
    }

    // Make API call to driver login endpoint on the server
    try {
      const response = await fetch('http://192.168.1.32:5000/api/driver/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, busNumber }),
      });

      const data = await response.json();

      // Handle the response accordingly, e.g., show a success message or an error
      if (response.ok) {
        // Call the onLogin callback to notify the parent component
        setIsLoggedIn(true);
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleRegister = async () => {
    // Perform client-side validation (you can add more checks)
    if (!name || !busNumber) {
      alert('Please fill in all fields');
      return;
    }

    // Make API call to driver registration endpoint on the server
    try {
      const response = await fetch('http://192.168.1.32:5000/api/driver/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, busNumber }),
      });

      const data = await response.json();

      // Handle the response accordingly, e.g., show a success message or an error
      if (response.ok) {
        // Registration successful, you can optionally log in the driver automatically
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
      <DriverView onLogout={handleLogout} name={name}/>
    )
    :
    (
      <>
      <Text style={styles.title}>Driver Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        onChangeText={(text) => setName(text)}
        value={name}
      />
      <TextInput
        style={styles.input}
        placeholder="Bus Number"
        onChangeText={(text) => setBusNumber(text)}
        value={busNumber}
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

export default DriverLoginView;

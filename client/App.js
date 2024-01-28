// App.js
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import UserLoginView from './Views/UserLoginView';
import DriverLoginView from './Views/DriverLoginView';

const App = () => {
  const [role, setRole] = useState('null'); // Set a default role

  const handleRoleSelection = (selectedRole) => {
    setRole(selectedRole);
  };

  const renderView = () => {
    if (role === 'user') {
      return <UserLoginView />;
    } else if (role === 'driver') {
      return <DriverLoginView />;
    } else if(role === 'null') {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Select a Role</Text>
          <View style={styles.buttonContainer}>
            <Button title="User" onPress={() => handleRoleSelection('user')} />
            <Button title="Driver" onPress={() => handleRoleSelection('driver')} />
          </View>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      {renderView()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0', // Background color for the entire screen
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%', // Adjust the width as needed
  },
});

export default App;

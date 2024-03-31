// DriverView.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';

const DriverView = ({onLogout,name}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [isLoggedIn,setIsLoggedIn]=useState(true);

  // useEffect(() => {
  //   if (isTracking) {
  //     // Start sending location updates when isTracking is true
  //     const locationUpdateInterval = setInterval(sendLocationUpdate, 5000); // Adjust the interval as per your requirements

  //     // Clean up the interval when isTracking becomes false
  //     return () => clearInterval(locationUpdateInterval);
  //   }
  // }, [isTracking]);

  const sendLocationUpdate = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Permission to access location was denied');
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Send the location update to the server along with user ID and isTracking status
      await axios.post('http://192.168.1.32:5000/api/driver/location', {
        name,
        latitude,
        longitude,
      });
      // console.log('Location update sent:', latitude, longitude);
    } catch (error) {
      console.error(error);
    }
  };

  const handleStartTracking = async () => {
    try {
      const response = await axios.post('http://192.168.1.32:5000/api/driver/start-tracking', {
        name: name, // Assuming userData contains the driver information
      });
      setIsTracking(true);
    } catch (error) {
      console.error('Error starting tracking:', error);
    }
  };
  
  const handleStopTracking = async () => {
    try {
      const response = await axios.post('http://192.168.1.32:5000/api/driver/stop-tracking', {
        name: name, // Assuming userData contains the driver information
      });
      setIsTracking(false);
    } catch (error) {
      console.error('Error stopping tracking:', error);
    }
  };
  
  const handleLogout = () => {
    // Perform logout logic if needed
    // For example, clear user data, reset state, etc.

    // Call the onLogout callback to notify the parent component
    handleStopTracking();
    setIsLoggedIn(false);
    onLogout();
  };

  const handleUpdateLocation = async () => {
    // Simulate a location change for testing purposes
    try {
      const res = await axios.post('http://192.168.1.32:5000/api/driver/start-tracking', {
        name: name, // Assuming userData contains the driver information
      });
      const response = await axios.post('http://192.168.1.32:5000/api/driver/location', {
        name,
        // latitude: 12.872959,
        // longitude: 80.226402,
        latitude: 12.876548,
        longitude: 80.226682,
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  return (
    <View style={styles.container}>
      {
        isLoggedIn 
        ?
        (
          <>
            <Text style={styles.title}>Driver View</Text>
      {/* Driver-specific components */}
      {isTracking ? (
        <>
        <Button title="Stop Tracking" onPress={handleStopTracking} />
        <Button title="Update Location" onPress={handleUpdateLocation} />
        </>
      ) : (
        <>
        <Button title="Start Tracking" onPress={handleStartTracking} />
        <Button title="Update Location" onPress={handleUpdateLocation} />
        </>
      )}
      <Button title="Logout" onPress={handleLogout} />
          </>
        ) 
        : 
        (
          <Text>You have been logged out. Redirecting to login...</Text>
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
  },
});

export default DriverView;

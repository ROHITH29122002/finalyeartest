import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView,Dimensions, TextBase } from 'react-native';

const AdminView = ({ onLogout }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [newDriverName, setNewDriverName] = useState('');
  const [selectedBusId, setSelectedBusId] = useState('');
  const [removedriver, setRemoveDriver] = useState('');
  const [newBusNumber, setNewBusNumber] = useState('');
  const [stops, setStops] = useState([]);
  const [newStop, setNewStop] = useState({
    latitude: '',
    longitude: '',
    stopName: '',
  });
  const [busToDelete,setBusToDelete]=useState('');
  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    onLogout();
  };

  const fetchData = async () => {
    try {
      const driversResponse = await fetch('http://192.168.1.32:5000/api/drivers/locations');
      const busesResponse = await fetch('http://192.168.1.32:5000/api/buses');

      const driversData = await driversResponse.json();
      const busesData = await busesResponse.json();

      setDrivers(driversData);
      setBuses(busesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAddDriver = async () => {
    try {
      if (!newDriverName || !selectedBusId) {
        Alert.alert('Please provide both driver name and select a bus');
        return;
      }

      const driverExists = drivers.find((driver) => driver.name === newDriverName);
      if (driverExists) {
        Alert.alert('Driver with the entered name already exists');
        return;
      }

      // Check if the selected bus number is already assigned to another driver
      const busAssignedToDriver = drivers.find((driver) => driver.bus && driver.bus.busNo === selectedBusId);
      if (busAssignedToDriver) {
        Alert.alert('Selected bus number is already assigned to another driver');
        return;
      }

      // Now you can proceed with adding the new driver
      const response = await fetch('http://192.168.1.32:5000/api/driver/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newDriverName, busNumber: selectedBusId }),
      });
      if (response.ok) {
        Alert.alert('Driver Added Successfully');
        fetchData();
        setNewDriverName(''); // Clear the input fields
        setSelectedBusId('');
      } else {
        console.error('Error adding driver:', response.statusText);
      }
    } catch (error) {
      console.error('Error adding driver:', error);
    }
  };

  const handleRemoveDriver = async () => {
    try {
      // Check if removeDriverName is provided
      if (!removedriver) {
        console.error('Please provide the name of the driver to remove');
        return;
      }

      const response = await fetch('http://192.168.1.32:5000/api/admin/remove-driver', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverName: removedriver,
        }),
      });

      if (response.ok) {
        Alert.alert('Driver Removed Successfully');
        fetchData();
        setRemoveDriver(''); // Clear the input field
      } else {
        console.error('Error removing driver:', response.statusText);
      }
    } catch (error) {
      console.error('Error removing driver:', error);
    }
  };

  const handleAddBus = async () => {
    try {
      const response = await fetch('http://192.168.1.32:5000/api/admin/add-bus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          busNumber: newBusNumber,
          route: stops,
        }),
      });

      if (response.ok) {
        Alert.alert('Bus Added Successfully');
        fetchData();
        setNewBusNumber(''); // Clear the input field
        setStops([]); // Clear stops
      } else {
        console.error('Error adding bus:', response.statusText);
      }
    } catch (error) {
      console.error('Error adding bus:', error);
    }
  };

  const handleAddStop = () => {
    if (!newStop.latitude || !newStop.longitude || !newStop.stopName) {
      Alert.alert('Please provide latitude, longitude, and stop name for the new stop');
      return;
    }
    setStops([...stops, { ...newStop }]);
    setNewStop({ latitude: '', longitude: '', stopName: '' });
  };

  const handleRemoveStop = (index) => {
    const updatedStops = [...stops];
    updatedStops.splice(index, 1);
    setStops(updatedStops);
  };

  const handleDeleteBus = async () => {
    try {
      if (!busToDelete) {
        Alert.alert('Please enter the bus number to delete');
        return;
      }
      const response = await fetch('http://192.168.1.32:5000/api/admin/delete-bus', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ busNumber: busToDelete }),
      });
  
      if (response.ok) {
        Alert.alert('Bus Deleted Successfully');
        fetchData(); // Fetch updated data after deletion
        setBusToDelete(''); // Clear the input field
      } else {
        console.error('Error deleting bus:', response.statusText);
      }
    } catch (error) {
      console.error('Error deleting bus:', error);
    }
  };


  return (
    <ScrollView style={styles.container}>
      {isLoggedIn ? (
        <>
          <Text style={styles.title}>Admin Dashboard</Text>
          {/* Add Driver */}
          <View style={styles.section}>
            <Text style={styles.subTitle}>ADD DRIVER:</Text>
            <Text>Driver Name:</Text>
            <TextInput
              style={styles.textInput}
              value={newDriverName}
              onChangeText={(text) => setNewDriverName(text)}
            />
            <Text>Select Bus:</Text>
            <TextInput
              style={styles.textInput}
              value={selectedBusId}
              onChangeText={(text) => setSelectedBusId(text)}
            />
            <Button title="Add Driver" onPress={handleAddDriver} />
          </View>

          {/* Remove Driver */}
          <View style={styles.section}>
            <Text style={styles.subTitle}>REMOVE DRIVER:</Text>
            <Text>Driver Name:</Text>
            <TextInput
              style={styles.textInput}
              value={removedriver}
              onChangeText={(text) => setRemoveDriver(text)}
            />
            <Button title="Remove Driver" onPress={handleRemoveDriver} />
          </View>

          {/* Add Bus */}
          <View style={styles.section}>
            <Text style={styles.subTitle}>ADD BUS:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Bus Number"
              value={newBusNumber}
              onChangeText={(text) => setNewBusNumber(text)}
            />

            {/* Stops */}
            <View style={styles.stopsContainer}>
              {stops.map((stop, index) => (
                <View key={index} style={styles.stopItem}>
                  <Text style={styles.stopText}>Stop {index + 1}</Text>
                  <Text>Latitude: {stop.latitude}</Text>
                  <Text>Longitude: {stop.longitude}</Text>
                  <Text>Stop Name: {stop.stopName}</Text>
                  <Button title="Remove Stop" onPress={() => handleRemoveStop(index)} />
                </View>
              ))}

              <Text style={styles.subTitle}>Add Stop : </Text>
              <View style={styles.stopItem}>
                <TextInput
                  style={styles.textInput}
                  placeholder="New Latitude"
                  value={newStop.latitude}
                  onChangeText={(text) => setNewStop({ ...newStop, latitude: text })}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="New Longitude"
                  value={newStop.longitude}
                  onChangeText={(text) => setNewStop({ ...newStop, longitude: text })}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="New Stop Name"
                  value={newStop.stopName}
                  onChangeText={(text) => setNewStop({ ...newStop, stopName: text })}
                />
              </View>
            </View>

            {/* Add and Remove Stop Buttons */}
            <View style={styles.buttonContainer}>
              <Button title="Add Stop" onPress={handleAddStop} />
            </View>

            {/* Add Bus Button */}
            <Button title="Add Bus" onPress={handleAddBus} />
          </View>


          <View style={styles.section}>
            <Text style={styles.subTitle}>DELETE BUS:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Bus Number to Delete"
              value={busToDelete}
              onChangeText={(text) => setBusToDelete(text)}
            />
            <Button
              title="Delete Bus"
              onPress={handleDeleteBus}
            />
          </View>
          <Button title="Logout" onPress={handleLogout}/>
        </>
      ) : (
        <Text>You have been logged out. Redirecting to login...</Text>
      )}
    </ScrollView>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    width:width,
    padding: 16,
    paddingBottom:0,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  subTitle: {
    fontSize: 20,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  textInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  stopsContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  stopItem: {
    marginBottom: 10,
  },
  stopText: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
});

export default AdminView;

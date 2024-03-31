import React, { useState, useEffect,useRef} from 'react';
import { View, Text, Button, StyleSheet, Dimensions,Alert,TouchableOpacity } from 'react-native';
import MapView, { Marker,Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';

const UserView = ({ onLogout }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [mapReady,setMapReady]=useState(false);
  const [driverLocations,setdriverLocations]=useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedBusRoute, setSelectedBusRoute] = useState([]);
  const [closestStop, setClosestStop] = useState(null);
  const [busStopsVisible, setBusStopsVisible] = useState(false);
  const [selectedBusStop,setselectedBusStop]=useState(null);
  const [refreshFlag, setRefreshFlag] = useState(false);

  const proximityCheckIntervalRef = useRef(null); 

  useEffect(() => {
    getLocationAsync();
    const handleRefresh = () => {
      fetchDriverLocations();
      // Toggle the refreshFlag to trigger a re-render
      setRefreshFlag((prevFlag) => !prevFlag);
    };
    const intervalId = setInterval(fetchDriverLocations, 5000);
    return () => {
      clearInterval(intervalId);
      clearInterval(proximityCheckIntervalRef.current);
    }
  }, [refreshFlag]);

  useEffect(() => {
    setClosestStop(findClosestStop(userLocation, selectedBusRoute));
  }, [selectedBusRoute]);

  useEffect(() => {
    if (selectedDriver && selectedBusStop) {
      const isNearBusStop = isDriverNearBusStop(selectedBusStop);
  
      if (isNearBusStop) {
        Alert.alert(
          'Driver Reached',
          'The driver has reached the selected bus stop.',
          [
            {
              text: 'OK',
              onPress: () => {
                setselectedBusStop(null);
                setRefreshFlag((prevFlag) => !prevFlag);
              },
            },
          ],
          { cancelable: false }
        );
      }
    }
  }, [selectedDriver, selectedBusStop, driverLocations]);

  // const check=()=>{
  //   if (selectedDriver && selectedBusStop) {
  //     const isNearBusStop = isDriverNearBusStop(selectedBusStop);
  
  //     if (isNearBusStop) {
  //       Alert.alert(
  //         'Driver Reached',
  //         'The driver has reached the selected bus stop.',
  //         [
  //           {
  //             text: 'OK',
  //             onPress: () => {
  //               setselectedBusStop(null);
  //             },
  //           },
  //         ],
  //         { cancelable: false }
  //       );
  //     }
  //   }
  // }
  

  const getLocationAsync = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Location permission not granted');
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;
    setUserLocation({ latitude, longitude });
  };

  const handleLogout = () => {
    clearInterval(proximityCheckIntervalRef.current);
    setIsLoggedIn(false);
    onLogout();
  };

  const fetchDriverLocations = async () => {
    try {
      const response = await axios.get('http://192.168.1.32:5000/api/drivers/locations');
      const trackingDrivers = response.data.filter((driver) => driver.isTracking);
      setdriverLocations(trackingDrivers);
      if (selectedDriver) {
        // Find the selected driver from the fetched tracking drivers
        const updatedSelectedDriver = trackingDrivers.find((driver) => driver._id === selectedDriver._id);
  
        if (updatedSelectedDriver) {
          // If the selected driver is still tracking, update the selectedDriver
          setSelectedDriver(updatedSelectedDriver);
        } else {
          // If the selected driver stops tracking, clear the selected driver
          clearSelectedDriver();
        }
      }
      setRefreshFlag((prevFlag) => !prevFlag);
    } catch (error) {
      console.error(error);
    }
  };
  
  const handleRefresh = () => {
    fetchDriverLocations();
  };

  const handleMapReady = () => {
    setMapReady(true);
  };

  const renderDriverMarkers = () => {
    return driverLocations.map((driver) => (
      <Marker
        key={driver._id}
        coordinate={{
          latitude: driver.location.latitude,
          longitude: driver.location.longitude,
        }}
        title={driver.name}
        onPress={() => handleMarkerPress(driver)}
        zIndex={selectedDriver && selectedDriver._id === driver._id ? 2 : 1}
      />
    ));
  };

  const handleMarkerPress = async (driver) => {
    try {
      const response = await axios.get(`http://192.168.1.32:5000/api/drivers/${driver._id}/bus`);
      const busDetails = response.data;
  
      // Check if the selected driver is still tracking
      if (driver.isTracking) {
        setSelectedDriver({
          ...driver,
          bus: busDetails,
        });
        setSelectedBusRoute(busDetails.route);
        setBusStopsVisible(true);
      } else {
        // If the selected driver is not tracking, clear the selected driver and bus route
        clearSelectedDriver();
      }
    } catch (error) {
      console.error(error);
      // Handle error (e.g., display an error message to the user)
    }
  };

  const findClosestStop = (userLocation, busRoute) => {
    if (!userLocation || !busRoute || busRoute.length === 0) {
      return null;
    }
    let closestop = busRoute[0];
    let minDistance = haversineDistance(userLocation, closestop);
  
    for (let i = 1; i < busRoute.length; i++) {
      const distance = haversineDistance(userLocation, busRoute[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closestop = busRoute[i];
      }
    }
    return closestop;
  };
  
  const haversineDistance = (point1, point2) => {
    const toRad = (value) => (value * Math.PI) / 180;
  
    const R = 6371; // Radius of Earth in kilometers
    const dLat = toRad(point2.latitude - point1.latitude);
    const dLon = toRad(point2.longitude - point1.longitude);
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(point1.latitude)) *
        Math.cos(toRad(point2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    const distance = R * c;
  
    return distance;
  };

  const clearSelectedDriver = () => {
    setSelectedDriver(null);
    setSelectedBusRoute([]);
    setBusStopsVisible(false);
    handleRefresh();
  };

  const handleSetProximityAlert = (busStop) => {
    console.log('Setting proximity alert for', busStop.stopName);
    Alert.alert(
      'Set Proximity Alert',
      `Do you want to set a proximity alert for ${busStop.stopName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress:async () => {
            setselectedBusStop(busStop);
            // Wait for a short delay (e.g., 1000 milliseconds) before checking proximity
            await new Promise(resolve => setTimeout(resolve, 1000));
          },
        },
      ],
      { cancelable: false }
    );
  };
  
  const isDriverNearBusStop = (busStop) => {
    const driverLatitude = selectedDriver?.location?.latitude;
    const driverLongitude = selectedDriver?.location?.longitude;
  
    if (driverLatitude && driverLongitude) {
      const proximityThreshold = 0.005;
      const distance = calculateDistance(
        driverLatitude,
        driverLongitude,
        busStop.latitude,
        busStop.longitude
      );
  
      return distance <= proximityThreshold;
    }
  
    return false;
  };
  
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
  
    return distance;
  };

  // const renderBusRouteStops = () => {
  //   return selectedBusRoute.map((stop, index) => (
  //     <View key={index} style={styles.busRouteStopContainer}>
  //       {stop.latitude === closestStop?.latitude &&
  //         stop.longitude === closestStop?.longitude && (
  //           <View style={styles.redDot}></View>
  //         )}
  //       <Text style={[
  //           styles.busRouteStop,
  //           stop.latitude === selectedDriver.location.latitude &&
  //           stop.longitude === selectedDriver.location.longitude
  //             ? styles.highlightedBusRouteStop
  //             : null,
  //         ]}>{stop.stopName}</Text>
  //       <Button title={`Set Alert for ${stop.stopName}`} onPress={() => handleSetProximityAlert(stop)} />
  //     </View>
  //   ));
  // };

  const renderBusRoutePolyline = () => {
    const polylineCoordinates = selectedBusRoute.map((stop) => ({
      latitude: stop.latitude,
      longitude: stop.longitude,
    }));

    return (
      <Polyline
        coordinates={polylineCoordinates}
        strokeWidth={4}
        strokeColor="blue"
      />
    );
  };

  const createBusStopMarkers = () => {
    return selectedBusRoute.map((stop, index) => {
      const isDriverAtBusStop =
        selectedDriver &&
        selectedDriver.bus &&
        selectedDriver.bus.currentStop &&
        selectedDriver.bus.currentStop.stopName === stop.stopName;
  
      // Determine the zIndex based on whether the driver is at the current bus stop
      const zIndex = isDriverAtBusStop ? 1 : 0;
  
      return (
        <Marker
          key={index}
          coordinate={{
            latitude: stop.latitude,
            longitude: stop.longitude,
          }}
          title={stop.stopName}
          pinColor="green"
          onPress={() => handleSetProximityAlert(stop)}
          zIndex={zIndex}
        />
      );
    });
  };


  return (
    <View style={styles.container}>
      {isLoggedIn ? (
        <>
          {userLocation && (
            <MapView
              style={styles.map}
              region={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              onMapReady={handleMapReady}
            >
              {mapReady && <Marker coordinate={userLocation} title="You are here" pinColor='blue'/>}
              {selectedDriver && busStopsVisible && createBusStopMarkers()}
              {renderDriverMarkers()}
              {selectedDriver && renderBusRoutePolyline()}
            </MapView>
          )}
          {!userLocation && <Text>Loading...</Text>}
          <Button style={styles.button} title="Refresh" onPress={handleRefresh} />
          <Button title="Logout" onPress={handleLogout} />
          {selectedDriver && (
            <View style={styles.closeButtonContainer}>
              <TouchableOpacity onPress={clearSelectedDriver}>
                <Text style={styles.closeButtonText}>Close Driver</Text>
              </TouchableOpacity>
            </View>
          )}
          {/* {selectedDriver && (
            <View style={styles.busRouteContainer}>
              <Text style={styles.busRouteTitle}>Bus Route</Text>
              <Text>Bus Number: {selectedDriver.bus.busNo}</Text>
              <Text>Route:</Text>
              <View style={styles.busRouteStopsContainer}>{renderBusRouteStops()}</View>
              <Button title="Close" onPress={clearSelectedDriver} />
            </View>
          )} */}
        </>
      ) : (
        <Text>You have been logged out. Redirecting to login...</Text>
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    width: width,
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
    position:'relative',
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    ...StyleSheet.absoluteFillObject,
  },
  button: {
    paddingBottom: 16,
    marginBottom: 16,
  },
  busRouteTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  busRouteContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    elevation: 5,
  },
  busRouteTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  busRouteStopsContainer: {
    marginTop: 8,
  },
  busRouteStopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  busRouteStop: {
    marginRight: 8,
  },
  busMarker: {
    width: 12,
    height: 12,
    backgroundColor: 'red',
    borderRadius: 6,
  },
  redDot: {
    width: 8,
    height: 8,
    backgroundColor: 'red',
    borderRadius: 4,
    marginLeft: 4, // Adjust the margin as needed
  },
  highlightedBusRouteStop: {
    color: 'red', // or any other styling you want for the highlighted bus stop
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'lightgray',
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    fontSize: 16,
    color: 'black',
  },
});

export default UserView;

// app.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
require('dotenv').config();
const cors=require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/finalYearTest', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error(err));

// User model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

// Driver model
const driverSchema = new mongoose.Schema({
  name: String,
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
  },
  location: {
    latitude: Number,
    longitude: Number,
  },
  isTracking:Boolean,
});
const Driver = mongoose.model('Driver', driverSchema);

const busSchema = new mongoose.Schema({
  busNo: String,
  route: [
    { latitude: Number, longitude: Number, stopName: String }
  ],
});
const Bus = mongoose.model('Bus', busSchema);

const insertDummyBus = async () => {
  try {
    const dummyBusData = {
      busNo: '2',
      route: [
        {
          latitude: 12.872959,
          longitude: 80.226402,
          stopName: 'Stop 1',
        },
        {
          latitude: 12.876548,
          longitude: 80.226682,
          stopName: 'Stop 2',
        },
        {
          latitude: 12.877802,
          longitude: 80.219509,
          stopName: 'Stop 3',
        },
        {
          latitude: 12.8788379,
          longitude: 80.2121756,
          stopName: 'Stop 4',
        },
        {
          latitude: 12.8795,
          longitude: 80.211008,
          stopName: 'Stop 5',
        },
      ],
    };

    const dummyBus = new Bus(dummyBusData);
    await dummyBus.save();

    console.log('Dummy bus inserted successfully');
  } catch (error) {
    console.error('Error inserting dummy bus:', error);
  }
};

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const Admin = mongoose.model('Admin', adminSchema);

// Call the function to insert the dummy bus
// insertDummyBus();

// User registration route
app.post('/api/user/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user already exist
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(200).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User login route
app.post('/api/user/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create and send a JWT token
    const token = jwt.sign({ userId: user._id, userType: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token, userType: 'user', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Driver registration route
app.post('/api/driver/register', async (req, res) => {
  try {
      const { name, busNumber } = req.body;

      // Check if driver already exists
      const existingDriver = await Driver.findOne({ name });
      if (existingDriver) {
          return res.status(400).json({ error: 'Driver already exists' });
      }

      // Query the buses collection to find the bus with the specified bus number
      const existingBus = await Bus.findOne({ busNo: busNumber });

      if (!existingBus) {
          return res.status(400).json({ error: 'Bus not found with the specified bus number' });
      }

      // Create a new driver linked to the existing bus
      const newDriver = new Driver({
          name,
          bus: existingBus._id, // Link the driver to the existing bus using the bus's _id
          location: {
              latitude: null,
              longitude: null,
          },
          isTracking: false,
      });

      await newDriver.save();

      res.status(200).json({ message: 'Driver registered successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
  }
});

// Driver login route
app.post('/api/driver/login', async (req, res) => {
  try {
    const { name, busNumber } = req.body;

    // Check if driver exists
    const driver = await Driver.findOne({ name });
    if (!driver) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Query the buses collection to find the bus with the specified bus number
    const existingBus = await Bus.findOne({ busNo: busNumber });

    if (!existingBus) {
      return res.status(401).json({ error: 'Bus not found with the specified bus number' });
    }
    res.status(200).json({ message: 'Driver logged in successfully', driver });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/driver/location', async (req, res) => {
  try {
    const { name, latitude, longitude} = req.body;

    // Assuming you have a Driver model and the field names are 'location.latitude', 'location.longitude', and 'isTracking'
    await Driver.findOneAndUpdate({name:name}, {
      'location.latitude': latitude,
      'location.longitude': longitude,
    });
    res.status(200).json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


app.get('/api/drivers/locations', async (req, res) => {
  try {
    const drivers = await Driver.find().populate('bus');
    const driverLocations = drivers.map((driver) => ({
      _id: driver._id,
      name: driver.name,
      location: driver.location,
      isTracking: driver.isTracking,
      bus: {
        busNo: driver.bus.busNo,
        route: driver.bus.route,
      },
    }));
    res.status(200).json(driverLocations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/drivers/:driverId/bus', async (req, res) => {
  try {
    const driverId = req.params.driverId;
    // Assuming there's a 'bus' field in the driver schema that holds the bus details
    const driver = await Driver.findById(driverId).populate('bus');
    
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const busDetails = driver.bus;
    res.status(200).json(busDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update driver tracking status
app.post('/api/driver/start-tracking', async (req, res) => {
  try {
    const { name } = req.body;
    const updatedDriver = await Driver.findOneAndUpdate({name:name}, { isTracking: true }, { new: true });
    res.status(200).json(updatedDriver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/driver/stop-tracking', async (req, res) => {
  try {
    const { name } = req.body;
    const updatedDriver = await Driver.findOneAndUpdate({name:name}, { isTracking: false }, { new: true });
    res.status(200).json(updatedDriver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/buses', async (req, res) => {
  try {
    const buses = await Bus.find();
    res.status(200).json(buses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin registration route
app.post('/api/admin/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new admin
    const newAdmin = new Admin({ username, password: hashedPassword });
    await newAdmin.save();

    res.status(200).json({ message: 'Admin registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin login route
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create and send a JWT token
    const token = jwt.sign({ adminId: admin._id, userType: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token, userType: 'admin', admin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/remove-driver', async (req, res) => {
  try {
    const { driverName } = req.body;

    // Find and remove the driver by name
    const removedDriver = await Driver.findOneAndRemove({ name: driverName });

    if (!removedDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.status(200).json({ message: 'Driver removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/add-bus', async (req, res) => {
  try {
    const { busNumber, route } = req.body;

    // Validate inputs
    if (!busNumber || !route || !Array.isArray(route) || route.length === 0) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    // Check if the bus with the given bus number already exists
    const existingBus = await Bus.findOne({ busNo: busNumber });
    if (existingBus) {
      return res.status(409).json({ error: 'Bus with the same bus number already exists' });
    }

    // Create a new Bus instance
    const newBus = new Bus({
      busNo: busNumber,
      route: route,
    });

    // Save the new bus to the database
    await newBus.save();

    res.status(201).json({ message: 'Bus added successfully' });
  } catch (error) {
    console.error('Error adding bus:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.delete('/api/admin/delete-bus', async (req, res) => {
  try {
    const { busNumber } = req.body;

    // Check if the bus with the given bus number exists
    const existingBus = await Bus.findOne({ busNo: busNumber });

    if (!existingBus) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    // Use deleteOne to remove the document
    await Bus.deleteOne({ busNo: busNumber });

    res.status(200).json({ message: 'Bus deleted successfully' });
  } catch (error) {
    console.error('Error deleting bus:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Other routes...

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

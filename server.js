// const express = require('express');
// const multer = require('multer');
// const mongoose = require('mongoose');
// const ExifParser = require('exif-parser');
// const fs = require('fs').promises;
// const path = require('path');

// // ==================== Configuration ====================
// const app = express();
// const PORT = process.env.PORT || 3000;
// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sanjuvashistwork22_db_user:ER7de5BPctIAh4SZ@geotags.oy5jcsq.mongodb.net/?appName=geotags';
// const UPLOAD_DIR = './uploads';
// const NEARBY_RADIUS_METERS = 5;

// // ==================== MongoDB Schema ====================
// const mediaSchema = new mongoose.Schema({
//   filename: { type: String, required: true },
//   originalName: { type: String, required: true },
//   mimeType: { type: String, required: true },
//   size: { type: Number, required: true },
//   uploadDate: { type: Date, default: Date.now },
//   location: {
//     type: {
//       type: String,
//       enum: ['Point'],
//       default: 'Point'
//     },
//     coordinates: {
//       type: [Number], // [longitude, latitude]
//       required: true
//     }
//   },
//   latitude: { type: Number, required: true },
//   longitude: { type: Number, required: true },
//   altitude: Number,
//   metadata: {
//     captureDate: Date,
//     deviceMake: String,
//     deviceModel: String
//   }
// });

// // Create geospatial index for MongoDB
// mediaSchema.index({ location: '2dsphere' });
// mediaSchema.index({ latitude: 1, longitude: 1 });

// const Media = mongoose.model('Media', mediaSchema);

// // ==================== Multer Configuration ====================
// const storage = multer.diskStorage({
//   destination: async (req, file, cb) => {
//     try {
//       await fs.mkdir(UPLOAD_DIR, { recursive: true });
//       cb(null, UPLOAD_DIR);
//     } catch (error) {
//       cb(error);
//     }
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
//   fileFilter: (req, file, cb) => {
//     const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'video/quicktime'];
//     if (allowedMimes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Invalid file type. Only JPEG, PNG, MP4, and MOV files are allowed.'));
//     }
//   }
// });

// // ==================== Helper Functions ====================

// // Haversine formula to calculate distance between two coordinates
// function calculateDistance(lat1, lon1, lat2, lon2) {
//   const R = 6371e3; // Earth's radius in meters
//   const φ1 = lat1 * Math.PI / 180;
//   const φ2 = lat2 * Math.PI / 180;
//   const Δφ = (lat2 - lat1) * Math.PI / 180;
//   const Δλ = (lon2 - lon1) * Math.PI / 180;

//   const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//             Math.cos(φ1) * Math.cos(φ2) *
//             Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//   return R * c; // Distance in meters
// }

// // Extract GPS data from image EXIF
// async function extractGPSData(filePath) {
//   try {
//     const buffer = await fs.readFile(filePath);
//     const parser = ExifParser.create(buffer);
//     const result = parser.parse();

//     if (!result.tags.GPSLatitude || !result.tags.GPSLongitude) {
//       throw new Error('No GPS data found in the file');
//     }

//     const latitude = result.tags.GPSLatitude;
//     const longitude = result.tags.GPSLongitude;
//     const altitude = result.tags.GPSAltitude || null;

//     return {
//       latitude,
//       longitude,
//       altitude,
//       captureDate: result.tags.DateTimeOriginal ? new Date(result.tags.DateTimeOriginal * 1000) : null,
//       deviceMake: result.tags.Make || null,
//       deviceModel: result.tags.Model || null
//     };
//   } catch (error) {
//     throw new Error(`Failed to extract GPS data: ${error.message}`);
//   }
// }

// // Find nearby captures within specified radius
// async function findNearbyCaptures(latitude, longitude, radiusMeters, excludeId = null) {
//   // Method 1: Using MongoDB geospatial query (more efficient for large datasets)
//   const nearbyGeo = await Media.find({
//     location: {
//       $near: {
//         $geometry: {
//           type: 'Point',
//           coordinates: [longitude, latitude]
//         },
//         $maxDistance: radiusMeters
//       }
//     },
//     ...(excludeId && { _id: { $ne: excludeId } })
//   }).limit(20);

//   // Method 2: Using Haversine formula for precise distance calculation
//   const nearby = nearbyGeo.map(media => ({
//     ...media.toObject(),
//     distance: calculateDistance(latitude, longitude, media.latitude, media.longitude)
//   })).filter(media => media.distance <= radiusMeters);

//   return nearby;
// }

// // ==================== API Routes ====================

// app.use(express.json());

// // Health check endpoint
// app.get('/health', (req, res) => {
//   res.json({ status: 'OK', message: 'Server is running' });
// });

// // Upload media endpoint
// app.post('/api/media/upload', upload.single('media'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }

//     // Extract GPS data from uploaded file
//     const gpsData = await extractGPSData(req.file.path);

//     // Create media document
//     const media = new Media({
//       filename: req.file.filename,
//       originalName: req.file.originalname,
//       mimeType: req.file.mimetype,
//       size: req.file.size,
//       location: {
//         type: 'Point',
//         coordinates: [gpsData.longitude, gpsData.latitude]
//       },
//       latitude: gpsData.latitude,
//       longitude: gpsData.longitude,
//       altitude: gpsData.altitude,
//       metadata: {
//         captureDate: gpsData.captureDate,
//         deviceMake: gpsData.deviceMake,
//         deviceModel: gpsData.deviceModel
//       }
//     });

//     await media.save();

//     // Find nearby captures
//     const nearbyCaptures = await findNearbyCaptures(
//       gpsData.latitude,
//       gpsData.longitude,
//       NEARBY_RADIUS_METERS,
//       media._id
//     );

//     // Prepare response
//     res.status(201).json({
//       success: true,
//       message: 'Media uploaded successfully',
//       data: {
//         id: media._id,
//         filename: media.filename,
//         originalName: media.originalName,
//         size: media.size,
//         uploadDate: media.uploadDate,
//         location: {
//           latitude: media.latitude,
//           longitude: media.longitude,
//           altitude: media.altitude
//         },
//         metadata: media.metadata
//       },
//       nearbyCaptures: {
//         count: nearbyCaptures.length,
//         radiusMeters: NEARBY_RADIUS_METERS,
//         captures: nearbyCaptures.map(capture => ({
//           id: capture._id,
//           filename: capture.filename,
//           originalName: capture.originalName,
//           uploadDate: capture.uploadDate,
//           location: {
//             latitude: capture.latitude,
//             longitude: capture.longitude
//           },
//           distance: Math.round(capture.distance * 100) / 100, // Round to 2 decimals
//           distanceText: `${Math.round(capture.distance * 100) / 100}m away`
//         }))
//       },
//       warning: nearbyCaptures.length > 0 ? 'Potential duplicate detected. Please verify manually.' : null
//     });

//   } catch (error) {
//     // Clean up uploaded file on error
//     if (req.file) {
//       await fs.unlink(req.file.path).catch(() => {});
//     }
    
//     res.status(400).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// // Get all media (sorted by latitude, longitude)
// app.get('/api/media', async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 20;
//     const skip = (page - 1) * limit;

//     const media = await Media.find()
//       .sort({ latitude: 1, longitude: 1 })
//       .skip(skip)
//       .limit(limit);

//     const total = await Media.countDocuments();

//     res.json({
//       success: true,
//       data: media,
//       pagination: {
//         page,
//         limit,
//         total,
//         totalPages: Math.ceil(total / limit)
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // Get media by ID
// app.get('/api/media/:id', async (req, res) => {
//   try {
//     const media = await Media.findById(req.params.id);
    
//     if (!media) {
//       return res.status(404).json({ success: false, error: 'Media not found' });
//     }

//     res.json({ success: true, data: media });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // Find nearby media for a specific location
// app.get('/api/media/nearby/:id', async (req, res) => {
//   try {
//     const media = await Media.findById(req.params.id);
    
//     if (!media) {
//       return res.status(404).json({ success: false, error: 'Media not found' });
//     }

//     const radius = parseInt(req.query.radius) || NEARBY_RADIUS_METERS;
//     const nearbyCaptures = await findNearbyCaptures(
//       media.latitude,
//       media.longitude,
//       radius,
//       media._id
//     );

//     res.json({
//       success: true,
//       referenceMedia: {
//         id: media._id,
//         filename: media.filename,
//         location: {
//           latitude: media.latitude,
//           longitude: media.longitude
//         }
//       },
//       nearbyCaptures: {
//         count: nearbyCaptures.length,
//         radiusMeters: radius,
//         captures: nearbyCaptures.map(capture => ({
//           id: capture._id,
//           filename: capture.filename,
//           originalName: capture.originalName,
//           uploadDate: capture.uploadDate,
//           distance: Math.round(capture.distance * 100) / 100
//         }))
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // Delete media
// app.delete('/api/media/:id', async (req, res) => {
//   try {
//     const media = await Media.findById(req.params.id);
    
//     if (!media) {
//       return res.status(404).json({ success: false, error: 'Media not found' });
//     }

//     // Delete file from filesystem
//     await fs.unlink(path.join(UPLOAD_DIR, media.filename)).catch(() => {});
    
//     // Delete from database
//     await Media.findByIdAndDelete(req.params.id);

//     res.json({ success: true, message: 'Media deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({
//     success: false,
//     error: err.message || 'Internal server error'
//   });
// });

// // ==================== Server Initialization ====================
// async function startServer() {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect(MONGODB_URI);
//     console.log('SUCCESSFULLYYYY Connected to MongoDB');

//     // Create uploads directory
//     await fs.mkdir(UPLOAD_DIR, { recursive: true });
//     console.log('Uploads directory readyyy');

//     // Start server
//     app.listen(PORT, () => {
//       console.log(`Server running on http://localhost:${PORT}`);
//       console.log(`Nearby radius: ${NEARBY_RADIUS_METERS} meters`);
//     });
//   } catch (error) {
//     console.error('FAILEDD to start server:', error);
//     process.exit(1);
//   }
// }

// startServer();






// server.js - Entry point
require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');
const fs = require('fs').promises;

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = './uploads';

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✓ Successfully connected to MongoDB');

    // Create uploads directory
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    console.log('✓ Uploads directory ready');

    const userRoutes = require('./src/routes/userRoutes');
    const taskRoutes = require('./src/routes/taskRoutes');    
    const itemRoutes = require('./src/routes/itemRoutes');
    const orderRoutes = require('./src/routes/orderRoutes');
    
    app.use('/api/users', userRoutes);
    app.use('/api/tasks', taskRoutes);
    app.use('/api/items', itemRoutes);
    app.use('/api/orders', orderRoutes);



    // Start server
    app.listen(PORT, () => {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Nearby radius: ${process.env.NEARBY_RADIUS_METERS || 5} meters`);
      console.log(`${'='.repeat(50)}\n`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();









// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();

// app.use(cors());
// app.use(express.json());
// app.use('/uploads', express.static('uploads'));

// // Connect to MongoDB
// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => console.log('MongoDB connected'))
//   .catch(err => console.error('MongoDB connection error:', err));

// // Routes
// // const apiRoutes = require('./routes/api');
// // app.use('/api', apiRoutes);

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
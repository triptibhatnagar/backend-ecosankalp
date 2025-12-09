const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  filename: { 
    type: String, 
    required: true 
  },
  originalName: { 
    type: String, 
    required: true 
  },
  mimeType: { 
    type: String, 
    required: true 
  },
  size: { 
    type: Number, 
    required: true 
  },
  uploadDate: { 
    type: Date, 
    default: Date.now 
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  latitude: { 
    type: Number, 
    required: true 
  },
  longitude: { 
    type: Number, 
    required: true 
  },
  altitude: Number,
  metadata: {
    captureDate: Date,
    deviceMake: String,
    deviceModel: String
  }
}, {
  timestamps: true
});

// Create geospatial index for MongoDB
mediaSchema.index({ location: '2dsphere' });
mediaSchema.index({ latitude: 1, longitude: 1 });

const Media = mongoose.model('Media', mediaSchema);

module.exports = Media;

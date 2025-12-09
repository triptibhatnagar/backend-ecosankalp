const Media = require('../models/Media');
const { extractGPSData } = require('../utils/gpsExtractor');
const { findNearbyCaptures } = require('../utils/distanceCalculator');
const fs = require('fs').promises;
const path = require('path');

const NEARBY_RADIUS_METERS = parseInt(process.env.NEARBY_RADIUS_METERS) || 5;
const UPLOAD_DIR = './uploads';

/**
 * Upload new media with GPS data
 */
exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    console.log('Processing file:', req.file.originalname);

    // Extract GPS data from uploaded file
    const gpsData = await extractGPSData(req.file.path);
    console.log('GPS data extracted:', gpsData);

    // Create media document
    const media = new Media({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      location: {
        type: 'Point',
        coordinates: [gpsData.longitude, gpsData.latitude]
      },
      latitude: gpsData.latitude,
      longitude: gpsData.longitude,
      altitude: gpsData.altitude,
      metadata: {
        captureDate: gpsData.captureDate,
        deviceMake: gpsData.deviceMake,
        deviceModel: gpsData.deviceModel
      }
    });

    await media.save();
    console.log('Media saved to database:', media._id);

    // Find nearby captures
    const nearbyCaptures = await findNearbyCaptures(
      gpsData.latitude,
      gpsData.longitude,
      NEARBY_RADIUS_METERS,
      media._id
    );

    console.log(`Found ${nearbyCaptures.length} nearby captures`);

    // Prepare response
    res.status(201).json({
      success: true,
      message: 'Media uploaded successfully',
      data: {
        id: media._id,
        filename: media.filename,
        originalName: media.originalName,
        size: media.size,
        uploadDate: media.uploadDate,
        location: {
          latitude: media.latitude,
          longitude: media.longitude,
          altitude: media.altitude
        },
        metadata: media.metadata
      },
      nearbyCaptures: {
        count: nearbyCaptures.length,
        radiusMeters: NEARBY_RADIUS_METERS,
        captures: nearbyCaptures.map(capture => ({
          id: capture._id,
          filename: capture.filename,
          originalName: capture.originalName,
          uploadDate: capture.uploadDate,
          location: {
            latitude: capture.latitude,
            longitude: capture.longitude
          },
          distance: Math.round(capture.distance * 100) / 100,
          distanceText: `${Math.round(capture.distance * 100) / 100}m away`
        }))
      },
      warning: nearbyCaptures.length > 0 
        ? 'Potential duplicate detected. Please verify manually.' 
        : null
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(err => {
        console.error('Error deleting file:', err);
      });
    }
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all media with pagination
 */
exports.getAllMedia = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const media = await Media.find()
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Media.countDocuments();

    res.json({
      success: true,
      data: media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all media error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

/**
 * Get media by ID
 */
exports.getMediaById = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    
    if (!media) {
      return res.status(404).json({ 
        success: false, 
        error: 'Media not found' 
      });
    }

    res.json({ 
      success: true, 
      data: media 
    });
  } catch (error) {
    console.error('Get media by ID error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

/**
 * Find nearby media for a specific location
 */
exports.getNearbyMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    
    if (!media) {
      return res.status(404).json({ 
        success: false, 
        error: 'Media not found' 
      });
    }

    const radius = parseInt(req.query.radius) || NEARBY_RADIUS_METERS;
    const nearbyCaptures = await findNearbyCaptures(
      media.latitude,
      media.longitude,
      radius,
      media._id
    );

    res.json({
      success: true,
      referenceMedia: {
        id: media._id,
        filename: media.filename,
        location: {
          latitude: media.latitude,
          longitude: media.longitude
        }
      },
      nearbyCaptures: {
        count: nearbyCaptures.length,
        radiusMeters: radius,
        captures: nearbyCaptures.map(capture => ({
          id: capture._id,
          filename: capture.filename,
          originalName: capture.originalName,
          uploadDate: capture.uploadDate,
          distance: Math.round(capture.distance * 100) / 100
        }))
      }
    });
  } catch (error) {
    console.error('Get nearby media error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

/**
 * Delete media
 */
exports.deleteMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    
    if (!media) {
      return res.status(404).json({ 
        success: false, 
        error: 'Media not found' 
      });
    }

    // Delete file from filesystem
    await fs.unlink(path.join(UPLOAD_DIR, media.filename)).catch(err => {
      console.error('Error deleting file from disk:', err);
    });
    
    // Delete from database
    await Media.findByIdAndDelete(req.params.id);

    res.json({ 
      success: true, 
      message: 'Media deleted successfully' 
    });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

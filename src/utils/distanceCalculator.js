const Media = require('../models/Media');

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Find nearby captures within specified radius
 * @param {number} latitude - Reference latitude
 * @param {number} longitude - Reference longitude
 * @param {number} radiusMeters - Search radius in meters
 * @param {string} excludeId - ID to exclude from results (optional)
 * @returns {Array} Array of nearby media with distance
 */
async function findNearbyCaptures(latitude, longitude, radiusMeters, excludeId = null) {
  try {
    // Using MongoDB geospatial query
    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radiusMeters
        }
      }
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const nearbyGeo = await Media.find(query).limit(20);

    // Calculate precise distance using Haversine formula
    const nearby = nearbyGeo.map(media => ({
      ...media.toObject(),
      distance: calculateDistance(latitude, longitude, media.latitude, media.longitude)
    })).filter(media => media.distance <= radiusMeters);

    return nearby;
  } catch (error) {
    console.error('Error finding nearby captures:', error);
    return [];
  }
}

module.exports = {
  calculateDistance,
  findNearbyCaptures
};

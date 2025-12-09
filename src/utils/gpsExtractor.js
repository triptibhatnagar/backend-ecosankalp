const ExifParser = require('exif-parser');
const fs = require('fs').promises;

/**
 * Extract GPS data from image EXIF metadata
 * @param {string} filePath - Path to the image file
 * @returns {Object} GPS and metadata information
 */
async function extractGPSData(filePath) {
  try {
    const buffer = await fs.readFile(filePath);
    const parser = ExifParser.create(buffer);
    const result = parser.parse();

    if (!result.tags.GPSLatitude || !result.tags.GPSLongitude) {
      throw new Error('No GPS data found in the file');
    }

    const latitude = result.tags.GPSLatitude;
    const longitude = result.tags.GPSLongitude;
    const altitude = result.tags.GPSAltitude || null;

    return {
      latitude,
      longitude,
      altitude,
      captureDate: result.tags.DateTimeOriginal 
        ? new Date(result.tags.DateTimeOriginal * 1000) 
        : null,
      deviceMake: result.tags.Make || null,
      deviceModel: result.tags.Model || null
    };
  } catch (error) {
    throw new Error(`Failed to extract GPS data: ${error.message}`);
  }
}

module.exports = { extractGPSData };

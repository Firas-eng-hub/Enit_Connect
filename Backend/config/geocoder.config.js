const NodeGeocoder = require('node-geocoder');

const options = {
  provider: 'here',

  // Optional depending on the providers
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY, // for Mapquest, OpenCage, Google Premier
  formatter: null // 'gpx', 'string', ...
};

function latlng(req, res, callback) {
  // If no API key is configured, skip geocoding
  if (!process.env.GEOCODER_API_KEY) {
    console.log('Geocoder API key not configured. Skipping geocoding.');
    callback(null);
    return;
  }

  const geocoder = NodeGeocoder(options);
  const add = req.body.address + ' ' + req.body.city;
  geocoder.geocode({
    address: add,
    country: req.body.country,
    language: 'FR'
  }).then(result => {
    callback(result[0]);
  })
    .catch(err => {
      // Don't fail the request if geocoding fails
      console.error('Geocoding failed:', err.message);
      callback(null);
    });
};

function reverse(req, res, callback) {
  if (!process.env.GEOCODER_API_KEY) {
    console.log('Geocoder API key not configured. Skipping reverse geocoding.');
    callback(null);
    return;
  }

  const geocoder = NodeGeocoder(options);
  geocoder.reverse(req.query)
    .then(result => {
      callback(result);
    })
    .catch(err => {
      console.error('Reverse geocoding failed:', err.message);
      callback(null);
    });
};

module.exports = { options, latlng, reverse };

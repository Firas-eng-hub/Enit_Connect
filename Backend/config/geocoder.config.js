const NodeGeocoder = require('node-geocoder');

// OpenStreetMap/Nominatim - FREE, no API key required
const options = {
  provider: 'openstreetmap',
  httpAdapter: 'https',
  formatter: null
};

function latlng(req, res, callback) {
  const geocoder = NodeGeocoder(options);
  const add = (req.body.address || '') + ' ' + (req.body.city || '');

  if (!add.trim()) {
    console.log('No address provided for geocoding');
    callback(null);
    return;
  }

  geocoder.geocode({
    address: add,
    country: req.body.country || '',
    language: 'en'
  }).then(result => {
    if (result && result[0]) {
      callback(result[0]);
    } else {
      console.log('No geocoding results found for:', add);
      callback(null);
    }
  }).catch(err => {
    console.error('Geocoding failed:', err.message);
    callback(null);
  });
}

function reverse(req, res, callback) {
  const geocoder = NodeGeocoder(options);
  geocoder.reverse(req.query)
    .then(result => {
      callback(result);
    })
    .catch(err => {
      console.error('Reverse geocoding failed:', err.message);
      callback(null);
    });
}

module.exports = { options, latlng, reverse };

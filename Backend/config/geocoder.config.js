const NodeGeocoder = require('node-geocoder');

const geoapifyKey = process.env.GEOAPIFY_API_KEY;
const openStreetOptions = {
  provider: 'openstreetmap',
  httpAdapter: 'https',
  formatter: null
};

const getOpenStreetGeocoder = () => NodeGeocoder(openStreetOptions);

const normalizeGeoapifyFeature = (feature) => {
  const props = feature?.properties || {};
  const city = props.city || props.county || props.state || '';
  if (props.lat == null || props.lon == null) {
    return null;
  }
  return {
    latitude: props.lat,
    longitude: props.lon,
    city: city || undefined,
    country: props.country || undefined,
    formattedAddress: props.formatted || undefined,
    administrativeLevels: {
      level1long: props.state || undefined,
      level2long: city || undefined
    }
  };
};

const geoapifySearch = async (text) => {
  if (!geoapifyKey) {
    return null;
  }
  const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(text)}&lang=en&apiKey=${geoapifyKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geoapify request failed with status ${response.status}`);
  }
  const data = await response.json();
  const results = (data.features || []).map(normalizeGeoapifyFeature).filter(Boolean);
  return results;
};

const geoapifyReverse = async (lat, lon) => {
  if (!geoapifyKey) {
    return null;
  }
  const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&lang=en&apiKey=${geoapifyKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geoapify reverse request failed with status ${response.status}`);
  }
  const data = await response.json();
  const results = (data.features || []).map(normalizeGeoapifyFeature).filter(Boolean);
  return results;
};

const geocodeWithFallback = async (address, country, language) => {
  if (geoapifyKey) {
    try {
      const results = await geoapifySearch(address);
      if (results && results.length > 0) {
        return results;
      }
    } catch (err) {
      console.error('Geoapify geocoding failed:', err.message);
    }
  }
  const geocoder = getOpenStreetGeocoder();
  return geocoder.geocode({
    address,
    country,
    language
  });
};

function latlng(req, res, callback) {
  const clean = (value) => (value || '')
    .toString()
    .trim()
    .replace(/[',]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const address = clean(req.body.address);
  const city = clean(req.body.city);
  const country = (req.body.country || 'Tunisia').trim();
  if (!address && !city) {
    console.log('No address or city provided for geocoding');
    callback(null);
    return;
  }
  const fullAddress = [address, city, country].filter(Boolean).join(', ');

  if (!fullAddress.trim()) {
    console.log('No address provided for geocoding');
    callback(null);
    return;
  }

  const pickBestMatch = (results) => {
    if (!results || results.length === 0) {
      return null;
    }
    if (!city) {
      return results[0];
    }
    const cityLower = city.toLowerCase();
    const byCity = results.find((item) => {
      const itemCity = (item.city || item.administrativeLevels?.level2long || '').toLowerCase();
      return itemCity && itemCity.includes(cityLower);
    });
    return byCity || results[0];
  };

  geocodeWithFallback(fullAddress, country, 'en').then(result => {
    const match = pickBestMatch(result);
    if (match) {
      callback(match);
      return;
    }
    const fallbackAddress = city ? [city, country].filter(Boolean).join(', ') : '';
    if (!fallbackAddress) {
      console.log('No geocoding results found for:', fullAddress);
      callback(null);
      return;
    }
    geocodeWithFallback(fallbackAddress, country, 'en').then(fallback => {
      const fallbackMatch = pickBestMatch(fallback);
      if (fallbackMatch) {
        callback(fallbackMatch);
      } else {
        console.log('No geocoding results found for:', fullAddress);
        callback(null);
      }
    }).catch(err => {
      console.error('Geocoding failed:', err.message);
      callback(null);
    });
  }).catch(err => {
    console.error('Geocoding failed:', err.message);
    callback(null);
  });
}

function reverse(req, res, callback) {
  const { lat, lon, latitude, longitude } = req.query || {};
  const latValue = lat ?? latitude;
  const lonValue = lon ?? longitude;
  if (geoapifyKey && latValue != null && lonValue != null) {
    geoapifyReverse(latValue, lonValue)
      .then(result => {
        if (result && result.length > 0) {
          callback(result);
          return;
        }
        const geocoder = getOpenStreetGeocoder();
        return geocoder.reverse(req.query).then(callback);
      })
      .catch(err => {
        console.error('Geoapify reverse failed:', err.message);
        const geocoder = getOpenStreetGeocoder();
        return geocoder.reverse(req.query).then(callback);
      })
      .catch(err => {
        console.error('Reverse geocoding failed:', err.message);
        callback(null);
      });
    return;
  }
  const geocoder = getOpenStreetGeocoder();
  geocoder.reverse(req.query)
    .then(result => {
      callback(result);
    })
    .catch(err => {
      console.error('Reverse geocoding failed:', err.message);
      callback(null);
    });
}

const geocodeText = (query, country, language) => {
  return geocodeWithFallback(query, country, language);
};

module.exports = { options: openStreetOptions, latlng, reverse, geocodeText };

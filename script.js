// ============================================
// C-METRICS DASHBOARD - MAIN SCRIPT
// ============================================

// ============================================
// PART 1: CONFIGURATION & GLOBAL STATE
// ============================================

// Import API_CONFIG and CITIES from config.js
// Note: These are imported via script tag in HTML, so they're available globally

// Current selected city (default: Bangalore)
let currentCity = {
  name: 'Bangalore',
  lat: 12.9716,
  lon: 77.5946
};

// Last update timestamp
let lastUpdateTime = null;

// Metric data cache for all 13 metrics
const metricData = {
  airQuality: {
    value: null,
    timestamp: null,
    history: [],
    subMetrics: {}
  },
  weather: {
    value: null,
    timestamp: null,
    history: [],
    subMetrics: {}
  },
  traffic: {
    value: null,
    timestamp: null,
    subMetrics: {}
  },
  uv: {
    value: null,
    timestamp: null,
    forecast: [],
    subMetrics: {}
  },
  wind: {
    value: null,
    timestamp: null,
    subMetrics: {}
  },
  daylight: {
    value: null,
    timestamp: null,
    subMetrics: {}
  },
  energy: {
    value: null,
    timestamp: null,
    subMetrics: {}
  },
  waste: {
    value: null,
    timestamp: null,
    subMetrics: {}
  },
  water: {
    value: null,
    timestamp: null,
    subMetrics: {}
  },
  population: {
    value: null,
    timestamp: null,
    subMetrics: {}
  },
  soil: {
    value: null,
    timestamp: null,
    subMetrics: {}
  },
  groundwater: {
    value: null,
    timestamp: null,
    subMetrics: {}
  },
  pressure: {
    value: null,
    timestamp: null,
    history: [],
    subMetrics: {}
  }
};


// ============================================
// PART 2: THEME MANAGEMENT
// ============================================

/**
 * Toggle between dark and light themes
 * Saves preference to localStorage and updates all charts
 */
function toggleTheme() {
  // Get current theme from data-theme attribute
  const currentTheme = document.documentElement.getAttribute('data-theme');
  
  // Toggle between 'dark' and 'light'
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  // Update HTML data-theme attribute
  document.documentElement.setAttribute('data-theme', newTheme);
  
  // Save preference to localStorage
  localStorage.setItem('theme', newTheme);
  
  // Update theme toggle icon
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const icon = themeToggle.querySelector('i');
    if (icon) {
      icon.className = newTheme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }
  }
  
  // Update all Plotly charts with new theme colors
  updateChartsTheme();
}

/**
 * Apply saved theme preference or default to dark mode
 * Called on page load
 */
function applyTheme() {
  // Check localStorage for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  
  // Apply saved theme or default to 'dark'
  const theme = savedTheme || 'dark';
  
  // Set data-theme attribute on document element
  document.documentElement.setAttribute('data-theme', theme);
  
  // Update theme toggle icon
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const icon = themeToggle.querySelector('i');
    if (icon) {
      icon.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }
  }
}

/**
 * Update all Plotly charts with current theme colors
 * Uses Plotly.react() for efficient updates
 */
function updateChartsTheme() {
  // Get current theme
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const isDark = currentTheme === 'dark';
  
  // Define theme colors
  const themeColors = {
    plot_bgcolor: isDark ? '#1a1a2e' : '#ffffff',
    paper_bgcolor: isDark ? '#1a1a2e' : '#ffffff',
    fontColor: isDark ? '#ffffff' : '#1a1a2e',
    gridColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
  };
  
  // List of all chart element IDs (13 charts total)
  const chartIds = [
    'air-quality-chart',
    'weather-chart',
    'traffic-chart',
    'uv-chart',
    'wind-chart',
    'daylight-chart',
    'energy-chart',
    'waste-chart',
    'water-chart',
    'population-chart',
    'soil-chart',
    'groundwater-chart',
    'pressure-chart'
  ];
  
  // Update each chart if it exists and has been rendered
  chartIds.forEach(chartId => {
    const chartElement = document.getElementById(chartId);
    
    // Check if chart element exists and has Plotly data
    if (chartElement && chartElement.data && chartElement.data.length > 0) {
      // Create layout update object
      const layoutUpdate = {
        plot_bgcolor: themeColors.plot_bgcolor,
        paper_bgcolor: themeColors.paper_bgcolor,
        font: {
          color: themeColors.fontColor
        },
        xaxis: {
          gridcolor: themeColors.gridColor,
          color: themeColors.fontColor
        },
        yaxis: {
          gridcolor: themeColors.gridColor,
          color: themeColors.fontColor
        }
      };
      
      // Use Plotly.react() for efficient updates
      Plotly.react(chartElement, chartElement.data, Object.assign({}, chartElement.layout, layoutUpdate));
    }
  });
}


// ============================================
// PART 3: CITY MANAGEMENT
// ============================================

/**
 * Populate city selector dropdown with cities from CITIES array
 * Creates option elements dynamically for each city
 */
function populateCitySelector() {
  // Get the city selector dropdown element
  const citySelector = document.getElementById('city-selector');
  
  // Find the default cities optgroup
  const defaultGroup = citySelector.querySelector('optgroup[label="Default Cities"]');
  if (!defaultGroup) return;
  
  // Clear existing options in default group
  defaultGroup.innerHTML = '';
  
  // Loop through CITIES array
  CITIES.forEach(city => {
    // Create option element for each city
    const option = document.createElement('option');
    
    // Set value to lowercase city name (matches cityStaticData keys)
    option.value = city.name.toLowerCase();
    
    // Set text content to display city name
    option.textContent = city.name;
    
    // Append option to default cities group
    defaultGroup.appendChild(option);
  });
  
  // Set default selection to current city
  citySelector.value = currentCity.name.toLowerCase();
}

/**
 * Change the selected city and update all data
 * Called when user selects a different city from dropdown
 */
function changeCity() {
  // Get selected city value from dropdown
  const citySelector = document.getElementById('city-selector');
  const selectedCityName = citySelector.value;
  
  let selectedCity = null;
  
  // Check if it's a saved city
  if (selectedCityName.startsWith('saved-')) {
    const idx = parseInt(selectedCityName.split('-')[1]);
    const savedCities = JSON.parse(localStorage.getItem('savedCities') || '[]');
    if (savedCities[idx]) {
      selectedCity = savedCities[idx];
    }
  } else {
    // Find city data in CITIES array
    selectedCity = CITIES.find(city => city.name.toLowerCase() === selectedCityName);
  }
  
  // If city not found, return early
  if (!selectedCity) {
    console.error('City not found:', selectedCityName);
    return;
  }
  
  // Update currentCity object with name, lat, lon
  currentCity.name = selectedCity.name;
  currentCity.lat = selectedCity.lat;
  currentCity.lon = selectedCity.lon;
  
  // Update page title to include city name
  document.title = `C-Metrics - ${selectedCity.name} Real-time Metrics`;
  
  // Update header title to show selected city
  const headerTitle = document.querySelector('.dashboard-header h1');
  if (headerTitle) {
    headerTitle.textContent = `Real-time City Metrics - ${selectedCity.name}`;
  }
  
  // Show/hide remove button based on whether it's a saved city
  // Bangalore (default city) is not removable
  const removeBtn = document.getElementById('remove-city-btn');
  if (removeBtn) {
    if (selectedCityName.startsWith('saved-')) {
      removeBtn.style.display = 'flex';
      removeBtn.setAttribute('data-city-index', selectedCityName.split('-')[1]);
    } else {
      // Default cities (Bangalore) cannot be removed
      removeBtn.style.display = 'none';
    }
  }
  
  // Call updateAllData to fetch new data for selected city
  if (typeof updateAllData === 'function') {
    updateAllData();
  } else {
    console.log('updateAllData function not yet implemented. City changed to:', selectedCity.name);
  }
  
  // Update map when city changes
  if (typeof updateMapLocation === 'function') {
    updateMapLocation();
  }
  
  // Show/hide infrastructure and environmental sections based on city
  toggleInfrastructureEnvironmentalSections(selectedCity.name);
}

/**
 * Toggle visibility of Infrastructure and Environmental metrics sections
 * Only show these sections for Bangalore
 * @param {string} cityName - Name of the current city
 */
function toggleInfrastructureEnvironmentalSections(cityName) {
  const infrastructureSection = document.getElementById('infrastructure-section');
  const environmentalSection = document.getElementById('environmental-section');
  
  // List of cities with static data (8 default Indian cities)
  const citiesWithData = ['bangalore', 'delhi', 'mumbai', 'chennai', 'hyderabad', 'kolkata', 'pune', 'ahmedabad'];
  
  // Check if city has static data (case-insensitive)
  const hasData = citiesWithData.includes(cityName.toLowerCase());
  
  if (infrastructureSection) {
    infrastructureSection.style.display = hasData ? 'block' : 'none';
  }
  
  if (environmentalSection) {
    environmentalSection.style.display = hasData ? 'block' : 'none';
  }
  
  console.log(`🏙️ ${cityName}: Infrastructure & Environmental sections ${hasData ? 'visible' : 'hidden'}`);
}


// ============================================
// PART 3B: CITY SEARCH FUNCTIONALITY
// ============================================

/**
 * Search for cities using OpenWeather Geocoding API
 * @param {string} cityName - Name of city to search
 * @returns {Promise<Array>} Array of matching cities
 */
async function searchCity(cityName) {
  if (cityName.length < 2) return [];
  
  try {
    const response = await fetch(
      `${API_CONFIG.geocoding.endpoint}?q=${encodeURIComponent(cityName)}&limit=5&appid=${API_CONFIG.openweather.apiKey}`
    );
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const cities = await response.json();
    
    return cities.map(city => ({
      name: city.name,
      lat: city.lat,
      lon: city.lon,
      country: city.country,
      state: city.state || '',
      displayName: `${city.name}${city.state ? ', ' + city.state : ''}, ${city.country}`
    }));
  } catch (error) {
    console.error('City search error:', error);
    return [];
  }
}

/**
 * Display search results in dropdown
 * @param {Array} results - Search results
 */
function displaySearchResults(results) {
  const resultsDiv = document.getElementById('search-results');
  
  if (results.length === 0) {
    resultsDiv.innerHTML = '<div class="search-result-item no-results">No cities found</div>';
    resultsDiv.style.display = 'block';
    return;
  }
  
  resultsDiv.innerHTML = results.map((city, idx) => `
    <div class="search-result-item" data-index="${idx}" role="option">
      <i class="fa-solid fa-location-dot"></i>
      <span>${city.displayName}</span>
    </div>
  `).join('');
  
  resultsDiv.style.display = 'block';
  
  // Add click listeners to each result
  document.querySelectorAll('.search-result-item').forEach((item, idx) => {
    item.addEventListener('click', () => selectSearchCity(results[idx]));
  });
}

/**
 * Select city from search results
 * @param {Object} city - City object {name, lat, lon, displayName}
 */
function selectSearchCity(city) {
  // Add to saved cities in localStorage
  let savedCities = JSON.parse(localStorage.getItem('savedCities') || '[]');
  
  // Check if city already exists
  const exists = savedCities.find(c => c.lat === city.lat && c.lon === city.lon);
  
  if (!exists) {
    savedCities.push(city);
    // Limit to 20 saved cities
    if (savedCities.length > 20) savedCities.shift();
    localStorage.setItem('savedCities', JSON.stringify(savedCities));
    updateSavedCitiesDropdown();
  }
  
  // Update current city and refresh data
  currentCity = {
    name: city.name,
    lat: city.lat,
    lon: city.lon
  };
  
  // Update page title and header
  document.title = `C-Metrics - ${city.name} Real-time Metrics`;
  const headerTitle = document.querySelector('.dashboard-header h1');
  if (headerTitle) {
    headerTitle.textContent = `Real-time City Metrics - ${city.name}`;
  }
  
  // Update dropdown to show the selected saved city
  const citySelector = document.getElementById('city-selector');
  if (citySelector) {
    const savedCities = JSON.parse(localStorage.getItem('savedCities') || '[]');
    const cityIndex = savedCities.findIndex(c => c.lat === city.lat && c.lon === city.lon);
    if (cityIndex !== -1) {
      citySelector.value = `saved-${cityIndex}`;
      // Show remove button
      const removeBtn = document.getElementById('remove-city-btn');
      if (removeBtn) {
        removeBtn.style.display = 'flex';
        removeBtn.setAttribute('data-city-index', cityIndex.toString());
      }
    }
  }
  
  // Update data
  if (typeof updateAllData === 'function') {
    updateAllData();
  }
  
  // Update map
  if (typeof updateMapLocation === 'function') {
    updateMapLocation();
  }
  
  // Show/hide infrastructure and environmental sections based on city
  toggleInfrastructureEnvironmentalSections(city.name);
  
  // Clear search input and hide results
  document.getElementById('city-search').value = '';
  document.getElementById('search-results').style.display = 'none';
}

/**
 * Update dropdown with saved cities from localStorage
 */
function updateSavedCitiesDropdown() {
  const savedCities = JSON.parse(localStorage.getItem('savedCities') || '[]');
  const group = document.getElementById('saved-cities-group');
  
  if (!group) return;
  
  if (savedCities.length === 0) {
    // Clear and hide the group
    group.innerHTML = '';
    group.style.display = 'none';
    // Hide remove button if no saved cities
    const removeBtn = document.getElementById('remove-city-btn');
    if (removeBtn) {
      removeBtn.style.display = 'none';
    }
    return;
  }
  
  // Force clear first to ensure re-render
  group.innerHTML = '';
  
  // Add cities
  savedCities.forEach((city, idx) => {
    const option = document.createElement('option');
    option.value = `saved-${idx}`;
    option.textContent = city.displayName;
    group.appendChild(option);
  });
  
  group.style.display = 'block';
  
  console.log(`📋 Dropdown updated: ${savedCities.length} saved cities`);
}

/**
 * Remove a saved city from localStorage
 * @param {number} cityIndex - Index of the city to remove
 */
function removeSavedCity(cityIndex) {
  const savedCities = JSON.parse(localStorage.getItem('savedCities') || '[]');
  
  if (cityIndex >= 0 && cityIndex < savedCities.length) {
    // Get the city being removed for logging
    const removedCity = savedCities[cityIndex];
    
    // Remove the city
    savedCities.splice(cityIndex, 1);
    
    // Update localStorage
    localStorage.setItem('savedCities', JSON.stringify(savedCities));
    
    // Get current selection
    const citySelector = document.getElementById('city-selector');
    const currentValue = citySelector ? citySelector.value : '';
    const removeBtn = document.getElementById('remove-city-btn');
    
    // Check if the removed city was currently selected
    const wasSelected = currentValue === `saved-${cityIndex}`;
    
    // Update dropdown first
    updateSavedCitiesDropdown();
    
    if (wasSelected) {
      // The removed city was selected, switch to default city (Bangalore)
      console.log(`✅ Removed and switched from ${removedCity.displayName} to Bangalore`);
      
      // Update currentCity object
      currentCity = {
        name: 'Bangalore',
        lat: 12.9716,
        lon: 77.5946
      };
      
      // Update selector
      if (citySelector) {
        citySelector.value = 'bangalore';
      }
      
      // Hide remove button
      if (removeBtn) {
        removeBtn.style.display = 'none';
      }
      
      // Update all UI elements (map, metrics, etc.)
      changeCity();
    } else {
      // A different city was removed, just update the dropdown
      console.log(`✅ Removed ${removedCity.displayName} from saved cities`);
      
      // If current selection is a saved city with higher index, update the button
      if (currentValue.startsWith('saved-')) {
        const currentIdx = parseInt(currentValue.split('-')[1]);
        if (currentIdx > cityIndex) {
          // Index shifted down by 1
          const newIdx = currentIdx - 1;
          if (removeBtn) {
            removeBtn.setAttribute('data-city-index', newIdx.toString());
          }
          // Update selector value to reflect new index
          if (citySelector) {
            citySelector.value = `saved-${newIdx}`;
          }
        }
      }
    }
  }
}

/**
 * Handle city dropdown selection
 */
function initializeCitySearch() {
  const searchInput = document.getElementById('city-search');
  const selector = document.getElementById('city-selector');
  
  if (!searchInput) return;
  
  // Improved city search with better debouncing
  let searchTimeout;
  searchInput.addEventListener('input', async (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
      document.getElementById('search-results').style.display = 'none';
      return;
    }
    
    // Debounce: wait 400ms after user stops typing
    searchTimeout = setTimeout(async () => {
      try {
        const results = await searchCity(query);
        displaySearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        document.getElementById('search-results').innerHTML = '<div class="search-result-item no-results">Search failed. Try again.</div>';
        document.getElementById('search-results').style.display = 'block';
      }
    }, 400);
  });
  
  // Close results on blur
  searchInput.addEventListener('blur', () => {
    setTimeout(() => {
      document.getElementById('search-results').style.display = 'none';
    }, 200);
  });
  
  // Close results on escape
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.getElementById('search-results').style.display = 'none';
    }
  });
  
  // Close search results when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      document.getElementById('search-results').style.display = 'none';
    }
  });
  
  // Handle dropdown selection
  if (selector) {
    selector.addEventListener('change', (e) => {
      changeCity();
    });
  }
  
  // Handle remove city button
  const removeBtn = document.getElementById('remove-city-btn');
  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const cityIndex = parseInt(removeBtn.getAttribute('data-city-index'));
      if (!isNaN(cityIndex)) {
        if (confirm('Are you sure you want to remove this city from your saved cities?')) {
          removeSavedCity(cityIndex);
        }
      }
    });
  }
  
  // Load saved cities on page load
  updateSavedCitiesDropdown();
  
  // Check if current selection is a saved city and show remove button
  if (selector && selector.value.startsWith('saved-')) {
    const idx = parseInt(selector.value.split('-')[1]);
    if (removeBtn) {
      removeBtn.style.display = 'flex';
      removeBtn.setAttribute('data-city-index', idx.toString());
    }
  }
  
  // Set initial visibility of infrastructure and environmental sections
  toggleInfrastructureEnvironmentalSections(currentCity.name);
}


// ============================================
// PART 3C: LEAFLET MAP FUNCTIONALITY
// ============================================

let cityMap = null;
let cityMarker = null;

/**
 * Initialize Leaflet map on first load
 */
function initializeMap() {
  if (typeof L === 'undefined') {
    console.warn('Leaflet not loaded, skipping map initialization');
    return;
  }
  
  // Create map centered on current city
  cityMap = L.map('map', {
    zoom: 11,
    zoomControl: true,
    dragging: true,
    touchZoom: true,
    scrollWheelZoom: true
  }).setView([currentCity.lat, currentCity.lon], 11);
  
  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
    minZoom: 3
  }).addTo(cityMap);
  
  // Add marker for current city
  cityMarker = L.marker([currentCity.lat, currentCity.lon], {
    title: currentCity.name
  }).addTo(cityMap);
  
  // Add popup
  cityMarker.bindPopup(`<b>${currentCity.name}</b><br>Smart City Metrics`);
  cityMarker.openPopup();
  
  // Update overlay info
  updateMapOverlay();
}

/**
 * Update map when city changes
 */
function updateMapLocation() {
  if (!cityMap) {
    initializeMap();
    return;
  }
  
  // Smooth animation to new city
  cityMap.flyTo([currentCity.lat, currentCity.lon], 11, {
    duration: 1.5,
    easeLinearity: 0.25
  });
  
  // Update marker
  if (cityMarker) {
    cityMarker.setLatLng([currentCity.lat, currentCity.lon]);
    cityMarker.setPopupContent(`<b>${currentCity.name}</b><br>Smart City Metrics`);
    cityMarker.openPopup();
  }
  
  // Update overlay
  updateMapOverlay();
}

/**
 * Update map overlay display info
 */
function updateMapOverlay() {
  const cityNameEl = document.getElementById('map-city-name');
  const coordsEl = document.getElementById('map-coordinates');
  
  if (cityNameEl) {
    cityNameEl.textContent = currentCity.name;
  }
  
  if (coordsEl) {
    // Format coordinates
    const latDir = currentCity.lat >= 0 ? 'N' : 'S';
    const lonDir = currentCity.lon >= 0 ? 'E' : 'W';
    const latAbs = Math.abs(currentCity.lat).toFixed(2);
    const lonAbs = Math.abs(currentCity.lon).toFixed(2);
    
    coordsEl.textContent = `${latAbs}°${latDir}, ${lonAbs}°${lonDir}`;
  }
}


// ============================================
// PART 5: STATIC DATA MANAGEMENT
// ============================================

// Static data for all 8 cities (Infrastructure & Environmental metrics)
const cityStaticData = {
  bangalore: {
    energy: {
      currentLoad: 3500,
      peakLoad: 4200,
      averageLoad: 3200,
      loadFactor: 0.83,
      hourlyData: [2800, 2600, 2400, 2300, 2200, 2400, 2800, 3200, 3600, 3800, 3900, 4000, 4100, 4200, 4000, 3800, 3600, 3400, 3200, 3000, 2900, 2800, 2700, 2600]
    },
    waste: {
      totalDaily: 5000,
      organic: 60,
      plastic: 15,
      paper: 10,
      metal: 5,
      other: 10,
      recyclingRate: 25
    },
    water: {
      pH: 7.2,
      tds: 180,
      turbidity: 0.8,
      chlorine: 0.5,
      status: 'good'
    },
    population: {
      density: 11000,
      total: 12500000,
      area: 1137
    },
    soil: {
      moisture: 55,
      temperature: 28,
      type: 'Red Soil',
      weeklyData: [52, 54, 56, 55, 53, 55, 55]
    },
    groundwater: {
      depth: 12.5,
      tds: 450,
      status: 'moderate',
      monthlyData: [10.5, 11.0, 11.5, 12.0, 12.5, 13.0, 13.5, 13.0, 12.5, 12.0, 11.5, 11.0]
    }
  },
  delhi: {
    energy: {
      currentLoad: 5200,
      peakLoad: 6800,
      averageLoad: 5000,
      loadFactor: 0.76,
      hourlyData: [4200, 4000, 3800, 3600, 3500, 3800, 4400, 5000, 5600, 6000, 6200, 6400, 6600, 6800, 6400, 6000, 5600, 5200, 4800, 4600, 4400, 4300, 4200, 4100]
    },
    waste: {
      totalDaily: 10500,
      organic: 55,
      plastic: 18,
      paper: 12,
      metal: 6,
      other: 9,
      recyclingRate: 20
    },
    water: {
      pH: 7.5,
      tds: 220,
      turbidity: 1.2,
      chlorine: 0.6,
      status: 'good'
    },
    population: {
      density: 11320,
      total: 16800000,
      area: 1484
    },
    soil: {
      moisture: 45,
      temperature: 32,
      type: 'Alluvial Soil',
      weeklyData: [42, 44, 46, 45, 43, 45, 45]
    },
    groundwater: {
      depth: 18.5,
      tds: 520,
      status: 'poor',
      monthlyData: [15.0, 15.5, 16.0, 16.5, 17.0, 17.5, 18.0, 18.5, 18.0, 17.5, 17.0, 16.5]
    }
  },
  mumbai: {
    energy: {
      currentLoad: 4800,
      peakLoad: 5600,
      averageLoad: 4500,
      loadFactor: 0.86,
      hourlyData: [3800, 3600, 3400, 3300, 3200, 3500, 4000, 4500, 5000, 5200, 5300, 5400, 5500, 5600, 5400, 5200, 5000, 4800, 4600, 4400, 4200, 4000, 3900, 3800]
    },
    waste: {
      totalDaily: 9000,
      organic: 58,
      plastic: 20,
      paper: 10,
      metal: 5,
      other: 7,
      recyclingRate: 22
    },
    water: {
      pH: 7.0,
      tds: 160,
      turbidity: 0.6,
      chlorine: 0.4,
      status: 'good'
    },
    population: {
      density: 20700,
      total: 12400000,
      area: 603
    },
    soil: {
      moisture: 62,
      temperature: 30,
      type: 'Laterite Soil',
      weeklyData: [60, 61, 63, 62, 61, 62, 62]
    },
    groundwater: {
      depth: 8.5,
      tds: 380,
      status: 'good',
      monthlyData: [7.0, 7.2, 7.5, 7.8, 8.0, 8.2, 8.5, 8.3, 8.0, 7.8, 7.5, 7.2]
    }
  },
  chennai: {
    energy: {
      currentLoad: 3200,
      peakLoad: 4000,
      averageLoad: 3000,
      loadFactor: 0.80,
      hourlyData: [2600, 2400, 2200, 2100, 2000, 2300, 2700, 3100, 3500, 3700, 3800, 3900, 4000, 4000, 3800, 3600, 3400, 3200, 3000, 2800, 2700, 2600, 2500, 2400]
    },
    waste: {
      totalDaily: 5500,
      organic: 62,
      plastic: 16,
      paper: 9,
      metal: 5,
      other: 8,
      recyclingRate: 18
    },
    water: {
      pH: 7.3,
      tds: 200,
      turbidity: 1.0,
      chlorine: 0.5,
      status: 'good'
    },
    population: {
      density: 26903,
      total: 7100000,
      area: 426
    },
    soil: {
      moisture: 48,
      temperature: 31,
      type: 'Red Soil',
      weeklyData: [45, 47, 49, 48, 46, 48, 48]
    },
    groundwater: {
      depth: 15.0,
      tds: 480,
      status: 'moderate',
      monthlyData: [12.5, 13.0, 13.5, 14.0, 14.5, 15.0, 15.5, 15.0, 14.5, 14.0, 13.5, 13.0]
    }
  },
  hyderabad: {
    energy: {
      currentLoad: 3800,
      peakLoad: 4600,
      averageLoad: 3600,
      loadFactor: 0.83,
      hourlyData: [3000, 2800, 2600, 2500, 2400, 2700, 3200, 3600, 4000, 4200, 4300, 4400, 4500, 4600, 4400, 4200, 4000, 3800, 3600, 3400, 3200, 3100, 3000, 2900]
    },
    waste: {
      totalDaily: 6000,
      organic: 59,
      plastic: 17,
      paper: 11,
      metal: 5,
      other: 8,
      recyclingRate: 23
    },
    water: {
      pH: 7.4,
      tds: 190,
      turbidity: 0.9,
      chlorine: 0.5,
      status: 'good'
    },
    population: {
      density: 18480,
      total: 10500000,
      area: 650
    },
    soil: {
      moisture: 50,
      temperature: 29,
      type: 'Black Soil',
      weeklyData: [48, 49, 51, 50, 49, 50, 50]
    },
    groundwater: {
      depth: 14.0,
      tds: 460,
      status: 'moderate',
      monthlyData: [11.5, 12.0, 12.5, 13.0, 13.5, 14.0, 14.5, 14.0, 13.5, 13.0, 12.5, 12.0]
    }
  },
  kolkata: {
    energy: {
      currentLoad: 2800,
      peakLoad: 3400,
      averageLoad: 2600,
      loadFactor: 0.82,
      hourlyData: [2200, 2000, 1900, 1800, 1700, 2000, 2400, 2700, 3000, 3100, 3200, 3300, 3400, 3400, 3200, 3000, 2800, 2600, 2500, 2400, 2300, 2200, 2100, 2000]
    },
    waste: {
      totalDaily: 4500,
      organic: 63,
      plastic: 14,
      paper: 10,
      metal: 5,
      other: 8,
      recyclingRate: 19
    },
    water: {
      pH: 7.1,
      tds: 210,
      turbidity: 1.1,
      chlorine: 0.6,
      status: 'good'
    },
    population: {
      density: 24252,
      total: 14700000,
      area: 1886
    },
    soil: {
      moisture: 58,
      temperature: 28,
      type: 'Alluvial Soil',
      weeklyData: [56, 57, 59, 58, 57, 58, 58]
    },
    groundwater: {
      depth: 10.0,
      tds: 420,
      status: 'good',
      monthlyData: [8.5, 9.0, 9.5, 10.0, 10.5, 11.0, 11.5, 11.0, 10.5, 10.0, 9.5, 9.0]
    }
  },
  pune: {
    energy: {
      currentLoad: 2600,
      peakLoad: 3200,
      averageLoad: 2400,
      loadFactor: 0.81,
      hourlyData: [2000, 1900, 1800, 1700, 1600, 1900, 2200, 2500, 2800, 2900, 3000, 3100, 3200, 3200, 3000, 2800, 2600, 2400, 2300, 2200, 2100, 2000, 1900, 1800]
    },
    waste: {
      totalDaily: 3500,
      organic: 61,
      plastic: 16,
      paper: 11,
      metal: 5,
      other: 7,
      recyclingRate: 26
    },
    water: {
      pH: 7.2,
      tds: 170,
      turbidity: 0.7,
      chlorine: 0.4,
      status: 'good'
    },
    population: {
      density: 6800,
      total: 3100000,
      area: 729
    },
    soil: {
      moisture: 52,
      temperature: 27,
      type: 'Black Soil',
      weeklyData: [50, 51, 53, 52, 51, 52, 52]
    },
    groundwater: {
      depth: 11.5,
      tds: 440,
      status: 'moderate',
      monthlyData: [9.5, 10.0, 10.5, 11.0, 11.5, 12.0, 12.5, 12.0, 11.5, 11.0, 10.5, 10.0]
    }
  },
  ahmedabad: {
    energy: {
      currentLoad: 3000,
      peakLoad: 3800,
      averageLoad: 2800,
      loadFactor: 0.79,
      hourlyData: [2400, 2200, 2000, 1900, 1800, 2100, 2500, 2900, 3200, 3400, 3500, 3600, 3700, 3800, 3600, 3400, 3200, 3000, 2800, 2700, 2600, 2500, 2400, 2300]
    },
    waste: {
      totalDaily: 4200,
      organic: 57,
      plastic: 19,
      paper: 11,
      metal: 6,
      other: 7,
      recyclingRate: 21
    },
    water: {
      pH: 7.6,
      tds: 240,
      turbidity: 1.3,
      chlorine: 0.7,
      status: 'moderate'
    },
    population: {
      density: 11800,
      total: 5600000,
      area: 505
    },
    soil: {
      moisture: 42,
      temperature: 33,
      type: 'Alluvial Soil',
      weeklyData: [40, 41, 43, 42, 41, 42, 42]
    },
    groundwater: {
      depth: 20.0,
      tds: 550,
      status: 'poor',
      monthlyData: [17.0, 17.5, 18.0, 18.5, 19.0, 19.5, 20.0, 19.5, 19.0, 18.5, 18.0, 17.5]
    }
  }
};


/**
 * Get static data for a specific parameter and city
 * @param {string} parameterName - The parameter to retrieve (e.g., 'energy', 'waste', 'water', 'population', 'soil', 'groundwater')
 * @param {string} cityName - The city name (e.g., 'Bangalore', 'Delhi')
 * @returns {object} The parameter data for the specified city
 */
function getStaticData(parameterName, cityName) {
  // Convert city name to lowercase to match cityStaticData keys
  const cityKey = cityName.toLowerCase();
  
  // Look up city in cityStaticData object
  const cityData = cityStaticData[cityKey];
  
  // Fallback to Bangalore if city not found
  if (!cityData) {
    console.warn(`City "${cityName}" not found in static data. Falling back to Bangalore.`);
    return cityStaticData.bangalore[parameterName];
  }
  
  // Return specific parameter data for that city
  return cityData[parameterName];
}

/**
 * Display static metrics for infrastructure and environmental parameters
 * Updates metric cards for energy, waste, water, population, soil, and groundwater
 */
function displayStaticMetrics() {
  // Get current city name
  const cityName = currentCity.name;
  
  // ===== ENERGY METRIC =====
  try {
    const energyData = getStaticData('energy', cityName);
    const metricName = 'energy';
    
    // Update metric value with current load
    const valueElement = document.getElementById(`${metricName}-value`);
    const statusElement = document.getElementById(`${metricName}-status`);
    
    if (valueElement) {
      valueElement.textContent = energyData.currentLoad;
      // Apply color coding based on load factor
      if (energyData.loadFactor > 0.85) {
        valueElement.style.color = 'var(--accent-red)'; // High load
      } else if (energyData.loadFactor > 0.75) {
        valueElement.style.color = 'var(--accent-yellow)'; // Moderate load
      } else {
        valueElement.style.color = 'var(--accent-green)'; // Normal load
      }
    }
    
    if (statusElement) {
      statusElement.textContent = `Load Factor: ${(energyData.loadFactor * 100).toFixed(0)}%`;
    }
    
    // Update sub-metrics
    const subdataElement = document.getElementById(`${metricName}-subdata`);
    if (subdataElement) {
      subdataElement.innerHTML = `
        <div class="sub-metric">Peak Load: <strong>${energyData.peakLoad} MWh</strong></div>
        <div class="sub-metric">Average Load: <strong>${energyData.averageLoad} MWh</strong></div>
        <div class="sub-metric">Load Factor: <strong>${(energyData.loadFactor * 100).toFixed(0)}%</strong></div>
      `;
    }
    
    // Store data in cache
    metricData.energy.value = energyData.currentLoad;
    metricData.energy.timestamp = Date.now();
    metricData.energy.subMetrics = energyData;
    
    // Call chart update function
    updateChartEnergy(energyData);
    
  } catch (error) {
    console.error('Error displaying energy metric:', error);
  }
  
  // ===== WASTE METRIC =====
  try {
    const wasteData = getStaticData('waste', cityName);
    const metricName = 'waste';
    
    // Update metric value with total daily waste
    const valueElement = document.getElementById(`${metricName}-value`);
    const statusElement = document.getElementById(`${metricName}-status`);
    
    if (valueElement) {
      valueElement.textContent = wasteData.totalDaily;
      // Apply color coding based on recycling rate
      if (wasteData.recyclingRate > 30) {
        valueElement.style.color = 'var(--accent-green)'; // Good recycling
      } else if (wasteData.recyclingRate > 20) {
        valueElement.style.color = 'var(--accent-yellow)'; // Moderate recycling
      } else {
        valueElement.style.color = 'var(--accent-orange)'; // Low recycling
      }
    }
    
    if (statusElement) {
      statusElement.textContent = `Recycling Rate: ${wasteData.recyclingRate}%`;
    }
    
    // Update sub-metrics
    const subdataElement = document.getElementById(`${metricName}-subdata`);
    if (subdataElement) {
      subdataElement.innerHTML = `
        <div class="sub-metric">Organic: <strong>${wasteData.organic}%</strong></div>
        <div class="sub-metric">Plastic: <strong>${wasteData.plastic}%</strong></div>
        <div class="sub-metric">Paper: <strong>${wasteData.paper}%</strong></div>
        <div class="sub-metric">Recycling: <strong>${wasteData.recyclingRate}%</strong></div>
      `;
    }
    
    // Store data in cache
    metricData.waste.value = wasteData.totalDaily;
    metricData.waste.timestamp = Date.now();
    metricData.waste.subMetrics = wasteData;
    
    // Call chart update function
    updateChartWaste(wasteData);
    
  } catch (error) {
    console.error('Error displaying waste metric:', error);
  }
  
  // ===== WATER QUALITY METRIC =====
  try {
    const waterData = getStaticData('water', cityName);
    const metricName = 'water';
    
    // Update metric value with pH
    const valueElement = document.getElementById(`${metricName}-value`);
    const statusElement = document.getElementById(`${metricName}-status`);
    
    if (valueElement) {
      valueElement.textContent = waterData.pH.toFixed(1);
      // Apply color coding based on status
      if (waterData.status === 'good') {
        valueElement.style.color = 'var(--accent-green)';
      } else if (waterData.status === 'moderate') {
        valueElement.style.color = 'var(--accent-yellow)';
      } else {
        valueElement.style.color = 'var(--accent-red)';
      }
    }
    
    if (statusElement) {
      statusElement.textContent = waterData.status.charAt(0).toUpperCase() + waterData.status.slice(1) + ' Quality';
    }
    
    // Update sub-metrics
    const subdataElement = document.getElementById(`${metricName}-subdata`);
    if (subdataElement) {
      subdataElement.innerHTML = `
        <div class="sub-metric">TDS: <strong>${waterData.tds} mg/L</strong></div>
        <div class="sub-metric">Turbidity: <strong>${waterData.turbidity} NTU</strong></div>
        <div class="sub-metric">Chlorine: <strong>${waterData.chlorine} mg/L</strong></div>
      `;
    }
    
    // Store data in cache
    metricData.water.value = waterData.pH;
    metricData.water.timestamp = Date.now();
    metricData.water.subMetrics = waterData;
    
    // Call chart update function
    updateChartWater(waterData);
    
  } catch (error) {
    console.error('Error displaying water metric:', error);
  }
  
  // ===== SOIL QUALITY METRIC =====
  try {
    const soilData = getStaticData('soil', cityName);
    const metricName = 'soil';
    
    // Update metric value with moisture
    const valueElement = document.getElementById(`${metricName}-value`);
    const statusElement = document.getElementById(`${metricName}-status`);
    
    if (valueElement) {
      valueElement.textContent = soilData.moisture;
      // Apply color coding: green (40-60%), yellow (<40%), red (>60%)
      if (soilData.moisture >= 40 && soilData.moisture <= 60) {
        valueElement.style.color = 'var(--accent-green)'; // Optimal
      } else if (soilData.moisture < 40) {
        valueElement.style.color = 'var(--accent-yellow)'; // Low moisture
      } else {
        valueElement.style.color = 'var(--accent-red)'; // Waterlogged
      }
    }
    
    if (statusElement) {
      if (soilData.moisture >= 40 && soilData.moisture <= 60) {
        statusElement.textContent = 'Optimal Moisture';
      } else if (soilData.moisture < 40) {
        statusElement.textContent = 'Low Moisture';
      } else {
        statusElement.textContent = 'High Moisture';
      }
    }
    
    // Update sub-metrics
    const subdataElement = document.getElementById(`${metricName}-subdata`);
    if (subdataElement) {
      subdataElement.innerHTML = `
        <div class="sub-metric">Temperature: <strong>${soilData.temperature}°C</strong></div>
        <div class="sub-metric">Type: <strong>${soilData.type}</strong></div>
      `;
    }
    
    // Store data in cache
    metricData.soil.value = soilData.moisture;
    metricData.soil.timestamp = Date.now();
    metricData.soil.subMetrics = soilData;
    
    // Call chart update function
    updateChartSoil(soilData);
    
  } catch (error) {
    console.error('Error displaying soil metric:', error);
  }
  
  // ===== GROUNDWATER METRIC =====
  try {
    const groundwaterData = getStaticData('groundwater', cityName);
    const metricName = 'groundwater';
    
    // Update metric value with depth
    const valueElement = document.getElementById(`${metricName}-value`);
    const statusElement = document.getElementById(`${metricName}-status`);
    
    if (valueElement) {
      valueElement.textContent = groundwaterData.depth.toFixed(1);
      // Apply color coding based on status
      if (groundwaterData.status === 'good') {
        valueElement.style.color = 'var(--accent-green)';
      } else if (groundwaterData.status === 'moderate') {
        valueElement.style.color = 'var(--accent-yellow)';
      } else {
        valueElement.style.color = 'var(--accent-red)'; // Poor/declining
      }
    }
    
    if (statusElement) {
      statusElement.textContent = groundwaterData.status.charAt(0).toUpperCase() + groundwaterData.status.slice(1) + ' Level';
    }
    
    // Update sub-metrics
    const subdataElement = document.getElementById(`${metricName}-subdata`);
    if (subdataElement) {
      subdataElement.innerHTML = `
        <div class="sub-metric">TDS: <strong>${groundwaterData.tds} mg/L</strong></div>
        <div class="sub-metric">Status: <strong>${groundwaterData.status.charAt(0).toUpperCase() + groundwaterData.status.slice(1)}</strong></div>
      `;
    }
    
    // Store data in cache
    metricData.groundwater.value = groundwaterData.depth;
    metricData.groundwater.timestamp = Date.now();
    metricData.groundwater.subMetrics = groundwaterData;
    
    // Call chart update function
    updateChartGroundwater(groundwaterData);
    
  } catch (error) {
    console.error('Error displaying groundwater metric:', error);
  }
}


// ============================================
// PART 4: API FETCH FUNCTIONS
// ============================================

// Store weather data globally for extraction functions
let weatherDataCache = null;

// Flag to control loading overlay display during refresh
let isAutoRefreshing = false;

/**
 * Fetch air quality data from AQICN API
 * Updates AQI metric card with current air quality information
 */
async function fetchAirQuality() {
  const metricName = 'air-quality';
  
  try {
    // Show loading state
    showLoading(metricName);
    
    // Build AQICN API URL with current city coordinates and token
    const url = `${API_CONFIG.aqicn.endpoint}${currentCity.lat};${currentCity.lon}/?token=${API_CONFIG.aqicn.token}`;
    
    // Fetch data with error handling
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if API returned valid data
    if (data.status !== 'ok' || !data.data) {
      throw new Error('Invalid API response');
    }
    
    // Extract AQI and pollutant values from response
    const aqi = data.data.aqi;
    const pm25 = data.data.iaqi?.pm25?.v || 'N/A';
    const pm10 = data.data.iaqi?.pm10?.v || 'N/A';
    const o3 = data.data.iaqi?.o3?.v || 'N/A';
    const no2 = data.data.iaqi?.no2?.v || 'N/A';
    
    // Determine color coding based on AQI value
    // green <50, yellow 50-100, orange 100-150, red >150
    let color, status;
    if (aqi < 50) {
      color = 'var(--accent-green)';
      status = 'Good';
    } else if (aqi < 100) {
      color = 'var(--accent-yellow)';
      status = 'Moderate';
    } else if (aqi < 150) {
      color = 'var(--accent-orange)';
      status = 'Unhealthy for Sensitive';
    } else {
      color = 'var(--accent-red)';
      status = 'Unhealthy';
    }
    
    // Update metric value display
    const valueElement = document.getElementById(`${metricName}-value`);
    const statusElement = document.getElementById(`${metricName}-status`);
    
    if (valueElement) {
      valueElement.textContent = aqi;
      valueElement.style.color = color;
    }
    
    if (statusElement) {
      statusElement.textContent = status;
      statusElement.style.color = color;
    }
    
    // Update sub-metrics display
    const subdataElement = document.getElementById(`${metricName}-subdata`);
    if (subdataElement) {
      subdataElement.innerHTML = `
        <div class="sub-metric">PM2.5: <strong>${pm25}</strong></div>
        <div class="sub-metric">PM10: <strong>${pm10}</strong></div>
        <div class="sub-metric">O₃: <strong>${o3}</strong></div>
        <div class="sub-metric">NO₂: <strong>${no2}</strong></div>
      `;
    }
    
    // Store data in cache
    metricData.airQuality.value = aqi;
    metricData.airQuality.timestamp = Date.now();
    metricData.airQuality.subMetrics = { pm25, pm10, o3, no2, status };
    
    // Generate mock 24-hour history for chart (in production, this would be real historical data)
    const history = [];
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(Date.now() - i * 3600000);
      history.push({
        time: hour.getHours() + ':00',
        aqi: Math.max(20, aqi + Math.random() * 20 - 10),
        pm25: Math.max(10, pm25 + Math.random() * 10 - 5),
        pm10: Math.max(15, pm10 + Math.random() * 15 - 7)
      });
    }
    metricData.airQuality.history = history;
    
    // Call updateChartAirQuality with data
    updateChartAirQuality(history);
    
    // Hide loading state
    hideLoading(metricName);
    
  } catch (error) {
    // Handle errors with handleAPIError function
    handleAPIError(metricName, error);
  }
}

/**
 * Fetch weather data from OpenWeatherMap API
 * Updates weather metric card and stores data for wind, sun, and pressure extraction
 */
async function fetchWeather() {
  const metricName = 'weather';
  
  try {
    // Show loading state
    showLoading(metricName);
    
    // Build OpenWeatherMap API URL with coordinates and API key
    const url = `${API_CONFIG.openweather.endpoint}?lat=${currentCity.lat}&lon=${currentCity.lon}&appid=${API_CONFIG.openweather.apiKey}&units=metric`;
    
    // Fetch data with error handling
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Store data for extractWindData, extractSunData, extractPressureData
    weatherDataCache = data;
    
    // Extract temperature, humidity, pressure, wind speed, weather description
    const temperature = Math.round(data.main.temp);
    const humidity = data.main.humidity;
    const pressure = data.main.pressure;
    const windSpeed = data.wind.speed;
    const weatherDescription = data.weather[0].description;
    const weatherMain = data.weather[0].main;
    
    // Determine color coding (blue for cold, red for hot)
    let color;
    if (temperature < 15) {
      color = 'var(--accent-blue)';
    } else if (temperature < 25) {
      color = 'var(--accent-green)';
    } else if (temperature < 35) {
      color = 'var(--accent-orange)';
    } else {
      color = 'var(--accent-red)';
    }
    
    // Update metric value with temperature
    const valueElement = document.getElementById(`${metricName}-value`);
    const statusElement = document.getElementById(`${metricName}-status`);
    
    if (valueElement) {
      valueElement.textContent = temperature;
      valueElement.style.color = color;
    }
    
    if (statusElement) {
      statusElement.textContent = weatherDescription.charAt(0).toUpperCase() + weatherDescription.slice(1);
    }
    
    // Get weather emoji icon based on weather condition
    const weatherEmoji = getWeatherEmoji(weatherMain);
    
    // Update sub-metrics display
    const subdataElement = document.getElementById(`${metricName}-subdata`);
    if (subdataElement) {
      subdataElement.innerHTML = `
        <div class="sub-metric">${weatherEmoji} ${weatherDescription}</div>
        <div class="sub-metric">Humidity: <strong>${humidity}%</strong></div>
        <div class="sub-metric">Pressure: <strong>${pressure} hPa</strong></div>
        <div class="sub-metric">Wind: <strong>${windSpeed} m/s</strong></div>
      `;
    }
    
    // Store data in cache
    metricData.weather.value = temperature;
    metricData.weather.timestamp = Date.now();
    metricData.weather.subMetrics = { humidity, pressure, windSpeed, weatherDescription };
    
    // Generate mock 24-hour history for chart
    const history = [];
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(Date.now() - i * 3600000);
      history.push({
        time: hour.getHours() + ':00',
        temperature: temperature + Math.random() * 6 - 3,
        humidity: Math.max(0, Math.min(100, humidity + Math.random() * 20 - 10))
      });
    }
    metricData.weather.history = history;
    
    // Call updateChartWeather with data
    updateChartWeather(history);
    
    // Hide loading state
    hideLoading(metricName);
    
    // Extract additional metrics from weather data
    extractWindData();
    extractSunData();
    extractPressureData();
    
  } catch (error) {
    // Handle errors
    handleAPIError(metricName, error);
  }
}

/**
 * Fetch traffic congestion with improved error handling
 */
async function fetchTraffic() {
  const card = document.getElementById('traffic-card');
  if (!card) return;
  
  try {
    const valueElement = card.querySelector('.metric-value');
    const statusElement = card.querySelector('.metric-status');
    const unitElement = card.querySelector('.metric-unit');
    
    if (valueElement) valueElement.textContent = '--';
    if (statusElement) statusElement.textContent = 'Loading...';

    const url = `${API_CONFIG.tomtom.endpoint}?key=${API_CONFIG.tomtom.apiKey}&point=${currentCity.lat},${currentCity.lon}`;
    const response = await fetch(url);

    if (response.status === 404) throw new Error('NO_COVERAGE');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const currentSpeed = data.flowSegmentData?.currentSpeed || 0;
    const freeFlowSpeed = data.flowSegmentData?.freeFlowSpeed || 60;

    let congestion = 0;
    if (freeFlowSpeed > 0) congestion = ((freeFlowSpeed - currentSpeed) / freeFlowSpeed) * 100;
    const congestionPercent = Math.max(0, Math.min(100, Math.round(congestion)));

    metricData.traffic = metricData.traffic || {};
    metricData.traffic.value = congestionPercent;
    metricData.traffic.timestamp = new Date();
    metricData.traffic.subMetrics = {
      currentSpeed: Math.round(currentSpeed),
      freeFlowSpeed: Math.round(freeFlowSpeed),
      status: getCongestionStatus(congestionPercent)
    };

    const status = getCongestionStatus(congestionPercent);
    const color = getCongestionColor(congestionPercent);

    if (valueElement) {
      valueElement.textContent = congestionPercent;
      valueElement.style.color = color;
    }
    if (unitElement) unitElement.textContent = '%';
    if (statusElement) {
      statusElement.textContent = status;
      statusElement.style.color = color;
    }

    // Update sub-metrics with speeds
    const subdataElement = document.getElementById('traffic-subdata');
    if (subdataElement) {
      subdataElement.innerHTML = `
        <div class="sub-metric">Current Speed: <strong>${Math.round(currentSpeed)} km/h</strong></div>
        <div class="sub-metric">Free Flow: <strong>${Math.round(freeFlowSpeed)} km/h</strong></div>
      `;
    }

    // Update chart
    if (typeof updateChartTraffic === 'function') {
      updateChartTraffic(congestionPercent, status);
    }

    // Hide loading state
    hideLoading('traffic');

    console.log(`✅ Traffic: ${congestionPercent}% congestion`);
  } catch (error) {
    if (error.message === 'NO_COVERAGE') {
      const valueElement = card.querySelector('.metric-value');
      const unitElement = card.querySelector('.metric-unit');
      const statusElement = card.querySelector('.metric-status');
      
      if (valueElement) valueElement.textContent = '--';
      if (unitElement) unitElement.textContent = '%';
      if (statusElement) {
        statusElement.textContent = 'Not available in this city';
        statusElement.style.color = 'var(--text-secondary)';
      }
      
      const chartDiv = card.querySelector('.metric-chart');
      if (chartDiv) {
        chartDiv.innerHTML = `
          <div style="padding:20px;text-align:center;opacity:0.7;">
            <i class="fa-solid fa-circle-info" style="font-size:24px;color:var(--accent-yellow);margin-bottom:8px;"></i>
            <p style="font-size:13px;margin:0;">Traffic data is available in major cities only.<br>Coverage: 80+ countries, major metros.</p>
          </div>
        `;
      }
      
      metricData.traffic = metricData.traffic || {};
      metricData.traffic.value = null;
      hideLoading('traffic');
    } else {
      const valueElement = card.querySelector('.metric-value');
      const unitElement = card.querySelector('.metric-unit');
      const statusElement = card.querySelector('.metric-status');
      
      if (valueElement) valueElement.textContent = '--';
      if (unitElement) unitElement.textContent = '%';
      if (statusElement) {
        statusElement.textContent = 'Unable to load';
        statusElement.style.color = 'var(--accent-red)';
      }
      
      metricData.traffic = metricData.traffic || {};
      metricData.traffic.value = null;
      hideLoading('traffic');
    }
  }
}

function getCongestionStatus(congestion) {
  if (congestion === null || congestion === undefined) return 'Unknown';
  if (congestion <= 20) return 'Free Flow';
  if (congestion <= 40) return 'Light Traffic';
  if (congestion <= 60) return 'Moderate Traffic';
  if (congestion <= 80) return 'Heavy Traffic';
  return 'Severe Congestion';
}

function getCongestionColor(congestion) {
  if (congestion === null || congestion === undefined) return 'var(--text-secondary)';
  if (congestion <= 20) return 'var(--accent-green)';
  if (congestion <= 40) return 'var(--accent-blue)';
  if (congestion <= 60) return 'var(--accent-yellow)';
  if (congestion <= 80) return 'var(--accent-orange)';
  return 'var(--accent-red)';
}

/**
 * Fetch UV Index from OpenWeatherMap One Call API
 * More reliable, works globally
 */
async function fetchUVIndex() {
  const card = document.getElementById('uv-card');
  if (!card) return;

  try {
    const valueElement = card.querySelector('.metric-value');
    const statusElement = card.querySelector('.metric-status');
    const unitElement = card.querySelector('.metric-unit');
    
    if (valueElement) valueElement.textContent = '--';
    if (statusElement) statusElement.textContent = 'Loading...';

    const url = `${API_CONFIG.openweather.oneCallEndpoint}?lat=${currentCity.lat}&lon=${currentCity.lon}&appid=${API_CONFIG.openweather.apiKey}&units=metric&exclude=minutely,hourly,daily,alerts`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const uvIndex = data.current?.uvi !== undefined ? data.current.uvi : 0;

    metricData.uv = metricData.uv || {};
    metricData.uv.value = uvIndex;
    metricData.uv.timestamp = new Date();

    let riskLevel = '';
    let statusColor = '';
    if (uvIndex <= 2)      { riskLevel = 'Low Risk'; statusColor = 'var(--accent-green)'; }
    else if (uvIndex <= 5) { riskLevel = 'Moderate Risk'; statusColor = 'var(--accent-blue)'; }
    else if (uvIndex <= 7) { riskLevel = 'High Risk'; statusColor = 'var(--accent-yellow)'; }
    else if (uvIndex <= 10){ riskLevel = 'Very High Risk'; statusColor = 'var(--accent-orange)'; }
    else                  { riskLevel = 'Extreme Risk'; statusColor = 'var(--accent-red)'; }

    metricData.uv.subMetrics = {
      riskLevel,
      recommendation: getUVRecommendation(uvIndex)
    };

    if (valueElement) {
      valueElement.textContent = uvIndex.toFixed(1);
      valueElement.style.color = statusColor;
    }
    if (unitElement) unitElement.textContent = 'UVI';
    if (statusElement) {
      statusElement.textContent = riskLevel;
      statusElement.style.color = statusColor;
    }

    // Update sub-metrics display
    const subdataElement = document.getElementById('uv-subdata');
    if (subdataElement) {
      subdataElement.innerHTML = `
        <div class="sub-metric"><i class="fa-solid fa-circle-info"></i> ${getUVRecommendation(uvIndex)}</div>
      `;
    }

    // Update chart
    if (typeof updateChartUV === 'function') {
      updateChartUV(uvIndex, []);
    }

    // Hide loading state
    hideLoading('uv');

    console.log(`✅ UV Index: ${uvIndex.toFixed(1)} (${riskLevel})`);
  } catch (error) {
    // Fallback: Try currentuvindex.com if needed
    try {
      const fallbackUrl = `https://currentuvindex.com/api/v1/uvi?latitude=${currentCity.lat}&longitude=${currentCity.lon}`;
      const fallbackResponse = await fetch(fallbackUrl);
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        const uvIndex = fallbackData.now?.uvi || 0;
        metricData.uv = metricData.uv || {};
        metricData.uv.value = uvIndex;
        
        const valueElement = card.querySelector('.metric-value');
        const unitElement = card.querySelector('.metric-unit');
        if (valueElement) valueElement.textContent = uvIndex.toFixed(1);
        if (unitElement) unitElement.textContent = 'UVI';
        
        const statusElement = card.querySelector('.metric-status');
        if (statusElement) {
          statusElement.textContent = 'Available (fallback)';
          statusElement.style.color = 'var(--accent-blue)';
        }
        
        hideLoading('uv');
        return;
      }
    } catch (fallbackError) {
      console.error('Fallback UV API also failed:', fallbackError);
    }
    
    // Show error state
    const valueElement = card.querySelector('.metric-value');
    const unitElement = card.querySelector('.metric-unit');
    const statusElement = card.querySelector('.metric-status');
    
    if (valueElement) valueElement.textContent = '--';
    if (unitElement) unitElement.textContent = 'UVI';
    if (statusElement) {
      statusElement.textContent = 'Data unavailable';
      statusElement.style.color = 'var(--text-secondary)';
    }
    
    metricData.uv = metricData.uv || {};
    metricData.uv.value = null;
    hideLoading('uv');
  }
}

function getUVRecommendation(uvi) {
  if (uvi <= 2) return 'Minimal protection needed. Safe for outdoor activities.';
  if (uvi <= 5) return 'Wear sunscreen SPF 30+. Sunglasses recommended.';
  if (uvi <= 7) return 'Wear sunscreen SPF 50+, hat, and sunglasses. Seek shade during midday.';
  if (uvi <= 10) return 'Extra protection required. Minimize sun exposure 10 AM - 4 PM.';
  return 'Extreme risk. Avoid sun exposure. Stay indoors. Use maximum protection if outside.';
}

/**
 * Fetch population data from Open-Meteo Geocoding API
 * Updates population metric card with comprehensive city demographics
 */
async function fetchPopulation() {
  const metricName = 'population';
  
  try {
    // Show loading state
    showLoading(metricName);
    
    // Build Open-Meteo Geocoding API URL - get multiple results for comparison
    const url = `${API_CONFIG.openMeteo.geocodingEndpoint}?name=${encodeURIComponent(currentCity.name)}&count=5&language=en&format=json`;
    
    // Fetch data with error handling
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if results exist
    if (!data.results || data.results.length === 0) {
      throw new Error('No population data found for this city');
    }
    
    // Find the best match (first result is usually the main city)
    const cityData = data.results[0];
    const population = cityData.population || 0;
    
    // Get comparison cities for chart
    const comparisonCities = data.results.slice(0, 5).map(city => ({
      name: city.name,
      country: city.country_code || city.country,
      population: city.population || 0,
      admin1: city.admin1 || ''
    }));
    
    // Store in metricData cache
    metricData.population = metricData.population || {};
    metricData.population.value = population;
    metricData.population.timestamp = new Date();
    
    // Format population with commas
    const formattedPopulation = population.toLocaleString('en-US');
    
    // Determine status based on population size
    let status = '';
    let statusColor = '';
    if (population < 100000) {
      status = 'Small City';
      statusColor = 'var(--accent-green)';
    } else if (population < 500000) {
      status = 'Medium City';
      statusColor = 'var(--accent-blue)';
    } else if (population < 1000000) {
      status = 'Large City';
      statusColor = 'var(--accent-yellow)';
    } else if (population < 5000000) {
      status = 'Major City';
      statusColor = 'var(--accent-orange)';
    } else {
      status = 'Megacity';
      statusColor = 'var(--accent-red)';
    }
    
    // Calculate population density if we have coordinates
    let density = 0;
    if (cityData.population && currentCity.lat && currentCity.lon) {
      // Rough estimate: assume city covers ~50km radius for major cities
      const estimatedArea = population > 1000000 ? 7854 : population > 500000 ? 3142 : 1257; // km²
      density = Math.round(population / estimatedArea);
    }
    
    // Store comprehensive sub-metrics
    metricData.population.subMetrics = {
      country: cityData.country || 'Unknown',
      countryCode: cityData.country_code || '',
      admin1: cityData.admin1 || '',
      admin2: cityData.admin2 || '',
      admin3: cityData.admin3 || '',
      admin4: cityData.admin4 || '',
      timezone: cityData.timezone || '',
      elevation: cityData.elevation || 0,
      latitude: cityData.latitude || currentCity.lat,
      longitude: cityData.longitude || currentCity.lon,
      featureCode: cityData.feature_code || '',
      density: density,
      comparisonCities: comparisonCities
    };
    
    // Update UI elements
    const valueElement = document.getElementById(`${metricName}-value`);
    const statusElement = document.getElementById(`${metricName}-status`);
    const unitElement = document.querySelector(`#${metricName}-card .metric-unit`);
    
    if (valueElement) {
      valueElement.textContent = formattedPopulation;
      valueElement.style.color = statusColor;
    }
    
    if (statusElement) {
      statusElement.textContent = status;
      statusElement.style.color = statusColor;
    }
    
    if (unitElement) {
      unitElement.textContent = 'people';
    }
    
    // Update sub-metrics display with comprehensive data
    const subdataElement = document.getElementById(`${metricName}-subdata`);
    if (subdataElement) {
      const parts = [];
      
      // Location info
      if (cityData.country) {
        parts.push(`<i class="fa-solid fa-flag"></i> <strong>${cityData.country}</strong>`);
      }
      if (cityData.admin1) {
        parts.push(`<i class="fa-solid fa-map-pin"></i> ${cityData.admin1}`);
      }
      
      // Coordinates
      const lat = (cityData.latitude || currentCity.lat).toFixed(4);
      const lon = (cityData.longitude || currentCity.lon).toFixed(4);
      parts.push(`<i class="fa-solid fa-location-dot"></i> ${lat}°, ${lon}°`);
      
      // Timezone
      if (cityData.timezone) {
        parts.push(`<i class="fa-solid fa-clock"></i> ${cityData.timezone}`);
      }
      
      // Elevation
      if (cityData.elevation) {
        parts.push(`<i class="fa-solid fa-mountain"></i> ${cityData.elevation}m elevation`);
      }
      
      // Estimated density
      if (density > 0) {
        parts.push(`<i class="fa-solid fa-users"></i> ~${density.toLocaleString()} per km²`);
      }
      
      subdataElement.innerHTML = parts.map(p => `<div class="sub-metric">${p}</div>`).join('');
    }
    
    // Update chart with comparison data
    if (typeof updateChartPopulation === 'function') {
      updateChartPopulation(metricData.population.subMetrics);
    }
    
    // Hide loading state
    hideLoading(metricName);
    
    console.log(`✅ Population: ${formattedPopulation} (${status})`);
    
  } catch (error) {
    console.error('Error fetching population data:', error);
    
    // Show error state
    const valueElement = document.getElementById(`${metricName}-value`);
    const statusElement = document.getElementById(`${metricName}-status`);
    
    if (valueElement) {
      valueElement.textContent = '--';
      valueElement.style.color = 'var(--text-secondary)';
    }
    
    if (statusElement) {
      statusElement.textContent = 'Data unavailable';
      statusElement.style.color = 'var(--text-secondary)';
    }
    
    // Store null value
    metricData.population = metricData.population || {};
    metricData.population.value = null;
    
    // Hide loading state
    hideLoading(metricName);
  }
}

/**
 * Extract wind data from stored weather API response
 * Updates wind metric card with wind speed and direction
 */
function extractWindData() {
  const metricName = 'wind';
  
  if (!weatherDataCache) {
    console.error('No weather data available for wind extraction');
    return;
  }
  
  try {
    // Extract wind data from stored weather API response
    const windSpeed = weatherDataCache.wind.speed; // m/s
    const windDirection = weatherDataCache.wind.deg; // degrees
    const windGust = weatherDataCache.wind.gust || windSpeed; // m/s
    
    // Convert wind speed to km/h
    const windSpeedKmh = Math.round(windSpeed * 3.6);
    const windGustKmh = Math.round(windGust * 3.6);
    
    // Convert direction degrees to compass notation
    const compassDirection = getWindDirection(windDirection);
    
    // Apply color coding: green (<10), yellow (10-20), red (>20)
    let color;
    if (windSpeedKmh < 10) {
      color = 'var(--accent-green)';
    } else if (windSpeedKmh < 20) {
      color = 'var(--accent-yellow)';
    } else {
      color = 'var(--accent-red)';
    }
    
    // Update wind metric card display
    const valueElement = document.getElementById(`${metricName}-value`);
    const statusElement = document.getElementById(`${metricName}-status`);
    
    if (valueElement) {
      valueElement.textContent = windSpeedKmh;
      valueElement.style.color = color;
    }
    
    if (statusElement) {
      statusElement.textContent = `From ${compassDirection}`;
    }
    
    // Update sub-metrics
    const subdataElement = document.getElementById(`${metricName}-subdata`);
    if (subdataElement) {
      subdataElement.innerHTML = `
        <div class="sub-metric">Direction: <strong>${compassDirection} (${windDirection}°)</strong></div>
        <div class="sub-metric">Gust: <strong>${windGustKmh} km/h</strong></div>
      `;
    }
    
    // Store data in cache
    metricData.wind.value = windSpeedKmh;
    metricData.wind.timestamp = Date.now();
    metricData.wind.subMetrics = { windDirection, compassDirection, windGust: windGustKmh };
    
    // Call updateChartWind with data
    updateChartWind(windSpeedKmh, windDirection, compassDirection);
    
  } catch (error) {
    console.error('Error extracting wind data:', error);
  }
}

/**
 * Extract sunrise and sunset data from stored weather API response
 * Updates daylight metric card with sun times and day length
 */
function extractSunData() {
  const metricName = 'daylight';
  
  if (!weatherDataCache) {
    console.error('No weather data available for sun data extraction');
    return;
  }
  
  try {
    // Extract sunrise and sunset timestamps from stored weather API response
    const sunriseTimestamp = weatherDataCache.sys.sunrise; // Unix timestamp
    const sunsetTimestamp = weatherDataCache.sys.sunset; // Unix timestamp
    
    // Convert Unix timestamps to readable time format
    const sunriseTime = new Date(sunriseTimestamp * 1000).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    const sunsetTime = new Date(sunsetTimestamp * 1000).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    // Calculate day length in hours: (sunset - sunrise) / 3600
    const dayLengthHours = ((sunsetTimestamp - sunriseTimestamp) / 3600).toFixed(1);
    
    // Apply color coding based on day length
    let color;
    if (dayLengthHours < 11) {
      color = 'var(--accent-blue)';
    } else if (dayLengthHours < 13) {
      color = 'var(--accent-green)';
    } else {
      color = 'var(--accent-orange)';
    }
    
    // Update daylight metric card
    const valueElement = document.getElementById(`${metricName}-value`);
    const statusElement = document.getElementById(`${metricName}-status`);
    
    if (valueElement) {
      valueElement.textContent = dayLengthHours;
      valueElement.style.color = color;
    }
    
    if (statusElement) {
      statusElement.textContent = 'Hours of Daylight';
    }
    
    // Update sub-metrics
    const subdataElement = document.getElementById(`${metricName}-subdata`);
    if (subdataElement) {
      subdataElement.innerHTML = `
        <div class="sub-metric">Sunrise: <strong>${sunriseTime}</strong></div>
        <div class="sub-metric">Sunset: <strong>${sunsetTime}</strong></div>
      `;
    }
    
    // Store data in cache
    metricData.daylight.value = parseFloat(dayLengthHours);
    metricData.daylight.timestamp = Date.now();
    metricData.daylight.subMetrics = { sunriseTime, sunsetTime, sunriseTimestamp, sunsetTimestamp };
    
    // Call updateChartDaylight with data
    updateChartDaylight(dayLengthHours, sunriseTime, sunsetTime);
    
  } catch (error) {
    console.error('Error extracting sun data:', error);
  }
}

/**
 * Extract atmospheric pressure data from stored weather API response
 * Updates pressure metric card with pressure trends
 */
function extractPressureData() {
  const metricName = 'pressure';
  
  if (!weatherDataCache) {
    console.error('No weather data available for pressure extraction');
    return;
  }
  
  try {
    // Extract atmospheric pressure from stored weather API response
    const pressure = weatherDataCache.main.pressure; // hPa
    const seaLevelPressure = weatherDataCache.main.sea_level || pressure;
    const groundLevelPressure = weatherDataCache.main.grnd_level || pressure;
    
    // Determine trend (rising/falling) by comparing with previous value
    let trend = '→';
    let trendText = 'Stable';
    const previousPressure = metricData.pressure.value;
    
    if (previousPressure) {
      if (pressure > previousPressure + 2) {
        trend = '↑';
        trendText = 'Rising';
      } else if (pressure < previousPressure - 2) {
        trend = '↓';
        trendText = 'Falling';
      }
    }
    
    // Apply color coding based on pressure value
    let color;
    if (pressure < 1000) {
      color = 'var(--accent-blue)'; // Low pressure
    } else if (pressure < 1020) {
      color = 'var(--accent-green)'; // Normal pressure
    } else {
      color = 'var(--accent-orange)'; // High pressure
    }
    
    // Update pressure metric card display
    const valueElement = document.getElementById(`${metricName}-value`);
    const statusElement = document.getElementById(`${metricName}-status`);
    
    if (valueElement) {
      valueElement.textContent = pressure;
      valueElement.style.color = color;
    }
    
    if (statusElement) {
      statusElement.textContent = `${trendText} ${trend}`;
    }
    
    // Update sub-metrics
    const subdataElement = document.getElementById(`${metricName}-subdata`);
    if (subdataElement) {
      subdataElement.innerHTML = `
        <div class="sub-metric">Sea Level: <strong>${seaLevelPressure} hPa</strong></div>
        <div class="sub-metric">Ground Level: <strong>${groundLevelPressure} hPa</strong></div>
      `;
    }
    
    // Store data in cache
    metricData.pressure.value = pressure;
    metricData.pressure.timestamp = Date.now();
    metricData.pressure.subMetrics = { seaLevelPressure, groundLevelPressure, trend, trendText };
    
    // Generate mock 24-hour history for chart
    const history = [];
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(Date.now() - i * 3600000);
      history.push({
        time: hour.getHours() + ':00',
        pressure: pressure + Math.random() * 10 - 5
      });
    }
    metricData.pressure.history = history;
    
    // Call updateChartPressure with data
    updateChartPressure(history, trend);
    
  } catch (error) {
    console.error('Error extracting pressure data:', error);
  }
}


// ============================================
// PART 9: UTILITY FUNCTIONS
// ============================================

/**
 * Convert wind direction in degrees to compass notation
 * @param {number} degrees - Wind direction in degrees (0-360)
 * @returns {string} Compass notation (N, NE, E, SE, S, SW, W, NW)
 */
function getWindDirection(degrees) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

/**
 * Get weather emoji icon based on weather condition
 * @param {string} weatherMain - Main weather condition from API
 * @returns {string} Emoji representing the weather
 */
function getWeatherEmoji(weatherMain) {
  const emojiMap = {
    'Clear': '☀️',
    'Clouds': '☁️',
    'Rain': '🌧️',
    'Drizzle': '🌦️',
    'Thunderstorm': '⛈️',
    'Snow': '❄️',
    'Mist': '🌫️',
    'Smoke': '🌫️',
    'Haze': '🌫️',
    'Dust': '🌫️',
    'Fog': '🌫️',
    'Sand': '🌫️',
    'Ash': '🌫️',
    'Squall': '💨',
    'Tornado': '🌪️'
  };
  
  return emojiMap[weatherMain] || '🌡️';
}


// ============================================
// PART 6: DATA UPDATE & DISPLAY
// ============================================

/**
 * Update all real-time and static metrics
 * Fetches data from APIs and updates all metric cards
 */
async function updateAllData() {
  try {
    // Update lastUpdateTime timestamp
    lastUpdateTime = Date.now();
    
    // Show loading indicators for all real-time metrics
    showLoading('air-quality');
    showLoading('weather');
    showLoading('traffic');
    showLoading('uv');
    showLoading('population');
    
    // Fetch real-time metrics (handle errors gracefully without stopping other updates)
    // Use Promise.allSettled to continue even if some APIs fail
    const apiCalls = [
      fetchAirQuality().catch(err => console.error('Air quality fetch failed:', err)),
      fetchWeather().catch(err => console.error('Weather fetch failed:', err)),
      fetchTraffic().catch(err => console.error('Traffic fetch failed:', err)),
      fetchUVIndex().catch(err => console.error('UV index fetch failed:', err)),
      fetchPopulation().catch(err => console.error('Population fetch failed:', err))
    ];
    
    // Wait for all API calls to complete (or fail)
    await Promise.allSettled(apiCalls);
    
    // Note: extractWindData, extractSunData, extractPressureData are called within fetchWeather
    
    // Display static metrics for infrastructure and environmental metrics
    displayStaticMetrics();
    
    // Display living score
    displayLivingScore();
    
    // Update timestamp display
    updateTimestamp();
    
    console.log('All data updated successfully at', new Date(lastUpdateTime).toLocaleTimeString());
    
  } catch (error) {
    console.error('Error in updateAllData:', error);
  }
}

/**
 * Display a metric value with formatting and color coding
 * @param {string} elementId - The base ID of the metric (e.g., 'air-quality')
 * @param {number|string} value - The metric value to display
 * @param {string} unit - The unit of measurement
 * @param {string} status - Status text (e.g., 'good', 'moderate', 'poor')
 */
function displayMetricValue(elementId, value, unit, status) {
  // Update HTML element with formatted value and unit
  const valueElement = document.getElementById(`${elementId}-value`);
  if (valueElement) {
    valueElement.textContent = value;
  }
  
  // Update unit display if there's a separate unit element
  const unitElement = document.querySelector(`#${elementId}-card .metric-unit`);
  if (unitElement) {
    unitElement.textContent = unit;
  }
  
  // Apply color based on status (good/moderate/poor)
  const color = getColorForValue(status);
  if (valueElement) {
    valueElement.style.color = color;
  }
  
  // Update status text element
  const statusElement = document.getElementById(`${elementId}-status`);
  if (statusElement) {
    const statusText = getStatusText(status);
    statusElement.textContent = statusText;
    statusElement.style.color = color;
  }
}

/**
 * Update timestamp displays showing time since last update
 * Formats as "Updated X minutes ago" or "Updated X seconds ago"
 */
function updateTimestamp() {
  if (!lastUpdateTime) {
    return;
  }
  
  // Calculate time elapsed since lastUpdateTime
  const now = Date.now();
  const elapsedMs = now - lastUpdateTime;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  
  // Format as "Updated X minutes ago" or "Updated X seconds ago"
  let timestampText;
  if (elapsedMinutes > 0) {
    timestampText = `Updated ${elapsedMinutes} minute${elapsedMinutes !== 1 ? 's' : ''} ago`;
  } else {
    timestampText = `Updated ${elapsedSeconds} second${elapsedSeconds !== 1 ? 's' : ''} ago`;
  }
  
  // Update timestamp display elements
  const timestampElements = document.querySelectorAll('.last-updated, .timestamp-display');
  timestampElements.forEach(element => {
    element.textContent = timestampText;
  });
}

/**
 * Get color based on metric type and value/status
 * @param {string} status - Status indicator (e.g., 'good', 'moderate', 'poor', 'low', 'high')
 * @returns {string} CSS color variable
 */
function getColorForValue(status) {
  const statusLower = String(status).toLowerCase();
  
  if (statusLower.includes('good') || statusLower.includes('low') || statusLower.includes('light')) {
    return 'var(--accent-green)';
  } else if (statusLower.includes('moderate') || statusLower.includes('medium')) {
    return 'var(--accent-yellow)';
  } else if (statusLower.includes('poor') || statusLower.includes('high') || statusLower.includes('heavy') || statusLower.includes('unhealthy')) {
    return 'var(--accent-red)';
  } else if (statusLower.includes('extreme') || statusLower.includes('severe')) {
    return 'var(--accent-red)';
  } else if (statusLower.includes('cold')) {
    return 'var(--accent-blue)';
  } else if (statusLower.includes('hot')) {
    return 'var(--accent-orange)';
  }
  
  // Default color
  return 'var(--text-primary)';
}

/**
 * Get status text based on status code
 * @param {string} status - Status code or text
 * @returns {string} Human-readable status text
 */
function getStatusText(status) {
  const statusLower = String(status).toLowerCase();
  
  // Map status codes to readable text
  const statusMap = {
    'good': 'Good',
    'moderate': 'Moderate',
    'poor': 'Poor',
    'low': 'Low',
    'high': 'High',
    'light': 'Light',
    'heavy': 'Heavy',
    'extreme': 'Extreme',
    'unhealthy': 'Unhealthy',
    'cold': 'Cold',
    'hot': 'Hot'
  };
  
  // Return mapped text or capitalize first letter of input
  return statusMap[statusLower] || status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Format timestamp for readable time display
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted time string
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Calculate traffic congestion percentage
 * @param {number} currentSpeed - Current traffic speed
 * @param {number} freeFlowSpeed - Free flow speed
 * @returns {number} Congestion percentage
 */
function calculateCongestion(currentSpeed, freeFlowSpeed) {
  if (freeFlowSpeed === 0) return 0;
  return Math.round(((freeFlowSpeed - currentSpeed) / freeFlowSpeed) * 100);
}

/**
 * Get UV risk level classification
 * @param {number} uvi - UV index value
 * @returns {object} Object with riskLevel, color, and recommendation
 */
function getUVRiskLevel(uvi) {
  if (uvi < 2) {
    return {
      riskLevel: 'Low',
      color: 'var(--accent-green)',
      recommendation: 'No protection required'
    };
  } else if (uvi < 5) {
    return {
      riskLevel: 'Moderate',
      color: 'var(--accent-yellow)',
      recommendation: 'Wear sunscreen and hat'
    };
  } else if (uvi < 7) {
    return {
      riskLevel: 'High',
      color: 'var(--accent-orange)',
      recommendation: 'Seek shade, wear protective clothing'
    };
  } else if (uvi < 10) {
    return {
      riskLevel: 'Very High',
      color: 'var(--accent-red)',
      recommendation: 'Avoid sun exposure during midday'
    };
  } else {
    return {
      riskLevel: 'Extreme',
      color: 'var(--accent-red)',
      recommendation: 'Take all precautions, avoid sun'
    };
  }
}


// ============================================
// PART 8: ERROR HANDLING & UI FEEDBACK
// ============================================

/**
 * Show loading overlay for a metric card
 * @param {string} metricName - The metric identifier (e.g., 'air-quality')
 */
function showLoading(metricName) {
  // Don't show loading overlay during auto-refresh to prevent blank cards
  if (isAutoRefreshing) return;
  
  const loadingElement = document.getElementById(`${metricName}-loading`);
  if (loadingElement) {
    loadingElement.style.display = 'flex';
  }
}

/**
 * Hide loading overlay for a metric card
 * @param {string} metricName - The metric identifier (e.g., 'air-quality')
 */
function hideLoading(metricName) {
  const loadingElement = document.getElementById(`${metricName}-loading`);
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
}

/**
 * Handle API errors and display user-friendly messages
 * @param {string} metricName - The metric identifier
 * @param {Error} error - The error object
 */
function handleAPIError(metricName, error) {
  console.error(`Error fetching ${metricName}:`, error);
  
  // Update status element with error message
  const statusElement = document.getElementById(`${metricName}-status`);
  if (statusElement) {
    statusElement.textContent = 'Unable to load data';
    statusElement.style.color = 'var(--accent-red)';
  }
  
  // Set value element to "--"
  const valueElement = document.getElementById(`${metricName}-value`);
  if (valueElement) {
    valueElement.textContent = '--';
    valueElement.style.color = 'var(--text-secondary)';
  }
  
  // Display error message in chart area
  const chartElement = document.getElementById(`${metricName}-chart`);
  if (chartElement) {
    chartElement.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Data temporarily unavailable</p>';
  }
  
  // Hide loading state
  hideLoading(metricName);
}

/**
 * Display user-friendly error messages
 * Keeps loading state until retry and logs technical details
 * @param {string} metricName - The metric identifier
 * @param {string} userMessage - User-friendly error message to display
 * @param {Error} error - The error object with technical details
 */
function showError(metricName, userMessage, error) {
  // Log technical details to console
  console.error(`Error in ${metricName}:`, error);
  console.error('Error details:', {
    message: error.message,
    stack: error.stack,
    name: error.name
  });
  
  // Display user-friendly error message
  const statusElement = document.getElementById(`${metricName}-status`);
  if (statusElement) {
    statusElement.textContent = userMessage || 'Unable to load data';
    statusElement.style.color = 'var(--accent-red)';
  }
  
  // Set value element to indicate error
  const valueElement = document.getElementById(`${metricName}-value`);
  if (valueElement) {
    valueElement.textContent = '--';
    valueElement.style.color = 'var(--text-secondary)';
  }
  
  // Display error message in chart area
  const chartElement = document.getElementById(`${metricName}-chart`);
  if (chartElement) {
    chartElement.innerHTML = `
      <div style="text-align: center; color: var(--text-secondary); padding: 20px;">
        <p style="margin-bottom: 10px;">${userMessage || 'Data temporarily unavailable'}</p>
        <p style="font-size: 0.9em; opacity: 0.7;">Please try refreshing the page</p>
      </div>
    `;
  }
  
  // Keep loading state until retry (don't hide loading overlay)
  // This allows the user to see that the system is aware of the error
  // and may retry automatically
}


// ============================================
// PART 7: CHART CREATION (Plotly.js)
// ============================================

/**
 * Get Plotly theme configuration based on current theme
 * Returns configuration object with theme-appropriate colors
 * @returns {object} Plotly layout configuration
 */
function getPlotlyThemeConfig() {
  // Check current theme (dark or light)
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  
  // Return configuration object with theme-appropriate colors and improved margins
  return {
    plot_bgcolor: isDark ? '#0f0f1a' : '#f5f5f5',
    paper_bgcolor: isDark ? '#0f0f1a' : '#ffffff',
    font: {
      color: isDark ? '#ffffff' : '#1a1a2e',
      family: 'Inter, system-ui, sans-serif',
      size: 12
    },
    margin: {
      l: 50,    // Left margin
      r: 30,    // Right margin
      b: 40,    // Bottom margin
      t: 20,    // Top margin
      pad: 5
    },
    xaxis: {
      automargin: true,
      showgrid: false,  // Hide grid for cleaner look
      color: isDark ? '#ffffff' : '#1a1a2e',
      tickangle: 0,  // Horizontal labels
      tickfont: { size: 10 },
      titlefont: { size: 11 },
      nticks: 6  // Limit number of ticks
    },
    yaxis: {
      automargin: true,
      showgrid: true,
      gridwidth: 1,
      gridcolor: isDark ? 'rgba(0, 255, 136, 0.05)' : 'rgba(0, 0, 0, 0.05)',  // Subtle grid
      color: isDark ? '#ffffff' : '#1a1a2e',
      tickfont: { size: 10 },
      titlefont: { size: 11 }
    },
    responsive: true,
    displayModeBar: false,
    hovermode: 'x unified'  // Show all values on hover
  };
}

/**
 * Create multi-line chart for air quality metrics
 * Plots AQI, PM2.5, PM10 over 24 hours
 * @param {Array} history - Array of historical air quality data
 */
function updateChartAirQuality(history) {
  const chartElement = document.getElementById('air-quality-chart');
  if (!chartElement || !history || history.length === 0) return;
  
  try {
    // Extract time labels and data arrays
    const times = history.map(h => h.time || h.hour || '');
    const aqiValues = history.map(h => h.aqi || 0);
    const pm25Values = history.map(h => h.pm25 || 0);
    const pm10Values = history.map(h => h.pm10 || 0);
    
    // Create traces for each pollutant
    const traces = [
      {
        x: times,
        y: aqiValues,
        type: 'scatter',
        mode: 'lines',  // Lines only, no markers
        name: 'AQI',
        line: { color: '#00ff88', width: 2.5, shape: 'spline' },  // Smooth curves
        hovertemplate: '%{y:.0f}<extra></extra>'
      },
      {
        x: times,
        y: pm25Values,
        type: 'scatter',
        mode: 'lines',
        name: 'PM2.5',
        line: { color: '#ffc107', width: 2.5, shape: 'spline' },
        hovertemplate: '%{y:.0f}<extra></extra>'
      },
      {
        x: times,
        y: pm10Values,
        type: 'scatter',
        mode: 'lines',
        name: 'PM10',
        line: { color: '#ff9800', width: 2.5, shape: 'spline' },
        hovertemplate: '%{y:.0f}<extra></extra>'
      }
    ];
    
    // Apply theme configuration
    const layout = {
      ...getPlotlyThemeConfig(),
      showlegend: true,
      legend: { 
        orientation: 'h', 
        y: 1.15,  // Position above chart
        x: 0.5,
        xanchor: 'center',
        yanchor: 'bottom',
        font: { size: 10 },
        bgcolor: 'transparent',
        bordercolor: 'transparent'
      },
      xaxis: { 
        ...getPlotlyThemeConfig().xaxis,
        title: '',
        nticks: 6,  // Show only 6 time labels
        tickmode: 'auto'
      },
      yaxis: { 
        ...getPlotlyThemeConfig().yaxis,
        title: '',
        nticks: 5
      }
    };
    
    const config = { responsive: true, displayModeBar: false };
    
    // Create chart with Plotly.newPlot
    Plotly.newPlot(chartElement, traces, layout, config);
  } catch (error) {
    console.error('Error creating air quality chart:', error);
  }
}

/**
 * Create multi-line chart for weather metrics with dual y-axes
 * Plots temperature (left axis) and humidity (right axis) over 24 hours
 * @param {Array} history - Array of historical weather data
 */
function updateChartWeather(history) {
  const chartElement = document.getElementById('weather-chart');
  if (!chartElement || !history || history.length === 0) return;
  
  try {
    // Extract time labels and data arrays
    const times = history.map(h => h.time || '');
    const temperatures = history.map(h => h.temperature || 0);
    const humidities = history.map(h => h.humidity || 0);
    
    // Create traces with dual y-axes
    const traces = [
      {
        x: times,
        y: temperatures,
        type: 'scatter',
        mode: 'lines',
        name: 'Temp',
        line: { color: '#ff4444', width: 2.5, shape: 'spline' },
        yaxis: 'y',
        hovertemplate: '%{y:.1f}°C<extra></extra>'
      },
      {
        x: times,
        y: humidities,
        type: 'scatter',
        mode: 'lines',
        name: 'Humidity',
        line: { color: '#4a9eff', width: 2.5, shape: 'spline' },
        yaxis: 'y2',
        hovertemplate: '%{y:.0f}%<extra></extra>'
      }
    ];
    
    // Apply theme configuration with dual y-axes
    const layout = {
      ...getPlotlyThemeConfig(),
      margin: { l: 45, r: 45, b: 40, t: 30, pad: 5 },
      showlegend: true,
      legend: { 
        orientation: 'h', 
        y: 1.15,
        x: 0.5,
        xanchor: 'center',
        yanchor: 'bottom',
        font: { size: 10 },
        bgcolor: 'transparent',
        bordercolor: 'transparent'
      },
      xaxis: { 
        ...getPlotlyThemeConfig().xaxis,
        title: '',
        nticks: 6,
        tickmode: 'auto'
      },
      yaxis: { 
        ...getPlotlyThemeConfig().yaxis,
        title: '',
        titlefont: { color: '#ff4444', size: 10 },
        tickfont: { color: '#ff4444', size: 9 },
        nticks: 5,
        side: 'left'
      },
      yaxis2: {
        ...getPlotlyThemeConfig().yaxis,
        title: '',
        showgrid: false,  // Hide secondary grid
        titlefont: { color: '#4a9eff', size: 10 },
        tickfont: { color: '#4a9eff', size: 9 },
        nticks: 5,
        overlaying: 'y',
        side: 'right'
      }
    };
    
    const config = { responsive: true, displayModeBar: false };
    
    // Create chart
    Plotly.newPlot(chartElement, traces, layout, config);
  } catch (error) {
    console.error('Error creating weather chart:', error);
  }
}

/**
 * Create gauge chart for traffic congestion
 * Shows congestion percentage from 0-100%
 * @param {number} congestionPercentage - Congestion percentage value
 * @param {string} status - Status text (Light, Moderate, Heavy)
 */
function updateChartTraffic(congestionPercentage, status) {
  const chartElement = document.getElementById('traffic-chart');
  if (!chartElement) return;
  
  try {
    // Create gauge chart with Plotly indicator type
    const trace = {
      type: 'indicator',
      mode: 'gauge+number',
      value: congestionPercentage,
      number: { suffix: '%' },
      gauge: {
        axis: { range: [0, 100] },
        bar: { color: congestionPercentage < 30 ? '#00ff88' : congestionPercentage < 60 ? '#ffc107' : '#ff4444' },
        steps: [
          { range: [0, 30], color: 'rgba(0, 255, 136, 0.2)' },
          { range: [30, 60], color: 'rgba(255, 193, 7, 0.2)' },
          { range: [60, 100], color: 'rgba(255, 68, 68, 0.2)' }
        ],
        threshold: {
          line: { color: 'red', width: 4 },
          thickness: 0.75,
          value: 90
        }
      }
    };
    
    // Apply theme configuration
    const layout = {
      ...getPlotlyThemeConfig(),
      height: 200
    };
    
    const config = { responsive: true, displayModeBar: false };
    
    // Create chart
    Plotly.newPlot(chartElement, [trace], layout, config);
  } catch (error) {
    console.error('Error creating traffic chart:', error);
  }
}

/**
 * Create line chart with color zones for UV index forecast
 * Plots UV forecast for next 48 hours with risk level zones
 * @param {number} currentUVI - Current UV index value
 * @param {Array} forecast - Array of UV forecast data
 */
function updateChartUV(currentUVI, forecast) {
  const chartElement = document.getElementById('uv-chart');
  if (!chartElement) return;
  
  try {
    // Generate mock forecast if not provided
    let forecastData = forecast;
    if (!forecast || forecast.length === 0) {
      forecastData = [];
      for (let i = 0; i < 48; i++) {
        forecastData.push({
          time: `${i}h`,
          uvi: Math.max(0, currentUVI + Math.sin(i / 6) * 3 + Math.random() * 2 - 1)
        });
      }
    }
    
    // Extract time and UVI values
    const times = forecastData.map((f, i) => f.time || `${i}h`);
    const uviValues = forecastData.map(f => f.uvi || 0);
    
    // Create line chart with fill
    const trace = {
      x: times,
      y: uviValues,
      type: 'scatter',
      mode: 'lines',
      fill: 'tozeroy',
      line: { color: '#ff9800', width: 2.5, shape: 'spline' },
      fillcolor: 'rgba(255, 152, 0, 0.2)',
      hovertemplate: '%{y:.1f}<extra></extra>'
    };
    
    // Apply theme configuration - removed background shapes for cleaner look
    const layout = {
      ...getPlotlyThemeConfig(),
      xaxis: { 
        ...getPlotlyThemeConfig().xaxis,
        title: '',
        nticks: 6,
        tickmode: 'auto'
      },
      yaxis: { 
        ...getPlotlyThemeConfig().yaxis,
        title: '',
        range: [0, 12],
        nticks: 5
      }
    };
    
    const config = { responsive: true, displayModeBar: false };
    
    // Create chart
    Plotly.newPlot(chartElement, [trace], layout, config);
  } catch (error) {
    console.error('Error creating UV chart:', error);
  }
}

/**
 * Create directional indicator chart for wind
 * Displays wind speed by direction in compass rose style
 * @param {number} windSpeedKmh - Wind speed in km/h
 * @param {number} windDirection - Wind direction in degrees
 * @param {string} compassDirection - Compass notation (N, NE, E, etc.)
 */
function updateChartWind(windSpeedKmh, windDirection, compassDirection) {
  const chartElement = document.getElementById('wind-chart');
  if (!chartElement) return;
  
  try {
    // Create polar bar chart (compass rose style)
    const trace = {
      type: 'barpolar',
      r: [windSpeedKmh],
      theta: [windDirection],
      marker: {
        color: windSpeedKmh < 10 ? '#00ff88' : windSpeedKmh < 20 ? '#ffc107' : '#ff4444',
        line: { width: 0 }
      },
      width: [30]
    };
    
    // Apply theme configuration
    const layout = {
      ...getPlotlyThemeConfig(),
      polar: {
        radialaxis: {
          visible: true,
          range: [0, Math.max(30, windSpeedKmh * 1.5)],
          gridcolor: getPlotlyThemeConfig().xaxis.gridcolor
        },
        angularaxis: {
          direction: 'clockwise',
          rotation: 90,
          gridcolor: getPlotlyThemeConfig().xaxis.gridcolor
        },
        bgcolor: getPlotlyThemeConfig().plot_bgcolor
      },
      height: 250
    };
    
    const config = { responsive: true, displayModeBar: false };
    
    // Create chart
    Plotly.newPlot(chartElement, [trace], layout, config);
  } catch (error) {
    console.error('Error creating wind chart:', error);
  }
}

/**
 * Create gauge chart showing day length
 * Displays current day length relative to 24 hours
 * @param {number} dayLengthHours - Day length in hours
 * @param {string} sunriseTime - Sunrise time string
 * @param {string} sunsetTime - Sunset time string
 */
function updateChartDaylight(dayLengthHours, sunriseTime, sunsetTime) {
  const chartElement = document.getElementById('daylight-chart');
  if (!chartElement) return;
  
  try {
    // Create gauge chart
    const trace = {
      type: 'indicator',
      mode: 'gauge+number',
      value: parseFloat(dayLengthHours),
      number: { suffix: ' hrs' },
      gauge: {
        axis: { range: [0, 24] },
        bar: { color: '#ffc107' },
        steps: [
          { range: [0, 10], color: 'rgba(74, 158, 255, 0.2)' },
          { range: [10, 14], color: 'rgba(0, 255, 136, 0.2)' },
          { range: [14, 24], color: 'rgba(255, 152, 0, 0.2)' }
        ]
      }
    };
    
    // Apply theme configuration
    const layout = {
      ...getPlotlyThemeConfig(),
      height: 200
    };
    
    const config = { responsive: true, displayModeBar: false };
    
    // Create chart
    Plotly.newPlot(chartElement, [trace], layout, config);
  } catch (error) {
    console.error('Error creating daylight chart:', error);
  }
}

/**
 * Create bar chart for hourly energy consumption
 * Plots 24 hours of energy data with conditional colors
 * @param {object} energyData - Energy data object with hourlyData array
 */
function updateChartEnergy(energyData) {
  const chartElement = document.getElementById('energy-chart');
  if (!chartElement || !energyData || !energyData.hourlyData) return;
  
  try {
    // Generate hour labels
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const values = energyData.hourlyData;
    const average = energyData.averageLoad;
    
    // Apply conditional colors based on average
    const colors = values.map(v => {
      if (v < average * 0.9) return '#00ff88'; // Green (<average)
      if (v < average * 1.1) return '#ffc107'; // Yellow (average)
      return '#ff4444'; // Red (>average)
    });
    
    // Create bar chart
    const trace = {
      x: hours,
      y: values,
      type: 'bar',
      marker: { color: colors }
    };
    
    // Apply theme configuration
    const layout = {
      ...getPlotlyThemeConfig(),
      xaxis: { 
        ...getPlotlyThemeConfig().xaxis,
        title: '',
        nticks: 6,
        tickmode: 'auto'
      },
      yaxis: { 
        ...getPlotlyThemeConfig().yaxis,
        title: '',
        nticks: 5
      }
    };
    
    const config = { responsive: true, displayModeBar: false };
    
    // Create chart
    Plotly.newPlot(chartElement, [trace], layout, config);
  } catch (error) {
    console.error('Error creating energy chart:', error);
  }
}

/**
 * Create pie chart for waste composition
 * Shows percentages for different waste categories
 * @param {object} wasteData - Waste data object with category percentages
 */
function updateChartWaste(wasteData) {
  const chartElement = document.getElementById('waste-chart');
  if (!chartElement || !wasteData) return;
  
  try {
    // Create pie chart
    const trace = {
      type: 'pie',
      labels: ['Organic', 'Plastic', 'Paper', 'Metal', 'Other'],
      values: [
        wasteData.organic,
        wasteData.plastic,
        wasteData.paper,
        wasteData.metal,
        wasteData.other
      ],
      marker: {
        colors: ['#00ff88', '#ff4444', '#4a9eff', '#ffc107', '#ff9800']
      },
      textinfo: 'label+percent',
      textposition: 'inside'
    };
    
    // Apply theme configuration
    const layout = {
      ...getPlotlyThemeConfig(),
      showlegend: false,
      height: 250
    };
    
    const config = { responsive: true, displayModeBar: false };
    
    // Create chart
    Plotly.newPlot(chartElement, [trace], layout, config);
  } catch (error) {
    console.error('Error creating waste chart:', error);
  }
}

/**
 * Create polar/radar chart for water quality metrics
 * Plots pH, TDS, Turbidity, Chlorine relative to WHO safe zones
 * @param {object} waterData - Water quality data object
 */
function updateChartWater(waterData) {
  const chartElement = document.getElementById('water-chart');
  if (!chartElement || !waterData) return;
  
  try {
    // Normalize values to 0-100 scale for radar chart
    const pHNorm = (waterData.pH / 14) * 100; // pH scale 0-14
    const tdsNorm = Math.min((waterData.tds / 500) * 100, 100); // TDS safe <500
    const turbidityNorm = Math.min((waterData.turbidity / 5) * 100, 100); // Turbidity safe <5
    const chlorineNorm = (waterData.chlorine / 5) * 100; // Chlorine scale 0-5
    
    // Determine color based on status
    const color = waterData.status === 'good' ? '#00ff88' : waterData.status === 'moderate' ? '#ffc107' : '#ff4444';
    
    // Create radar chart
    const trace = {
      type: 'scatterpolar',
      r: [pHNorm, tdsNorm, turbidityNorm, chlorineNorm, pHNorm],
      theta: ['pH', 'TDS', 'Turbidity', 'Chlorine', 'pH'],
      fill: 'toself',
      fillcolor: color.replace(')', ', 0.3)').replace('var(--accent-', 'rgba('),
      line: { color: color, width: 2 }
    };
    
    // Apply theme configuration
    const layout = {
      ...getPlotlyThemeConfig(),
      polar: {
        radialaxis: {
          visible: true,
          range: [0, 100],
          gridcolor: getPlotlyThemeConfig().xaxis.gridcolor
        },
        angularaxis: {
          gridcolor: getPlotlyThemeConfig().xaxis.gridcolor
        },
        bgcolor: getPlotlyThemeConfig().plot_bgcolor
      },
      showlegend: false,
      height: 250
    };
    
    const config = { responsive: true, displayModeBar: false };
    
    // Create chart
    Plotly.newPlot(chartElement, [trace], layout, config);
  } catch (error) {
    console.error('Error creating water chart:', error);
  }
}

/**
 * Create horizontal bar chart for population density comparison
 * Compares density across all 8 cities
 * @param {object} populationData - Population data for current city
 */
function updateChartPopulation(populationData) {
  const chartElement = document.getElementById('population-chart');
  if (!chartElement || !populationData) return;
  
  try {
    // Get current population
    const currentPopulation = metricData.population.value || 0;
    
    if (currentPopulation === 0) {
      chartElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);">No population data available</div>';
      return;
    }
    
    // Generate 7-day population trend data
    // Shows estimated daily active population including residents, commuters, and visitors
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Calculate daily population variance based on city size and type
    // Larger cities have more commuters, smaller cities have less variance
    const isLargeCity = currentPopulation > 1000000;
    const commuteFactor = isLargeCity ? 0.20 : 0.10; // 20% or 10% variance
    
    // Weekday pattern: higher during work days, lower on weekends
    const dailyVariance = [
      1.0 + (commuteFactor * 0.75),  // Monday - commuters return
      1.0 + (commuteFactor * 0.90),  // Tuesday - peak workweek
      1.0 + (commuteFactor * 0.85),  // Wednesday - high
      1.0 + (commuteFactor * 0.80),  // Thursday - high
      1.0 + (commuteFactor * 0.70),  // Friday - some leave early
      1.0 - (commuteFactor * 0.25),  // Saturday - fewer commuters
      1.0 - (commuteFactor * 0.50)   // Sunday - minimal commuters
    ];
    
    const dailyPopulations = dailyVariance.map(variance => 
      Math.round(currentPopulation * variance)
    );
    
    // Calculate percentage change from base
    const percentChanges = dailyVariance.map(v => ((v - 1) * 100).toFixed(1));
    
    // Create area chart showing daily population trend
    const trace = {
      x: days,
      y: dailyPopulations,
      type: 'scatter',
      mode: 'lines+markers',
      fill: 'tozeroy',
      line: { 
        color: '#00ff88', 
        width: 2.5,
        shape: 'spline'
      },
      marker: {
        size: 6,
        color: '#00ff88',
        line: {
          color: '#0f0f1a',
          width: 2
        }
      },
      fillcolor: 'rgba(0, 255, 136, 0.12)',
      hovertemplate: '<b>%{x}</b><br>Active Population: %{y:,.0f}<br><extra></extra>'
    };
    
    // Apply theme configuration
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const layout = {
      ...getPlotlyThemeConfig(),
      margin: { l: 70, r: 30, b: 40, t: 40, pad: 5 },
      xaxis: {
        ...getPlotlyThemeConfig().xaxis,
        title: '',
        showgrid: false,
        tickfont: { size: 10 },
        tickangle: -20
      },
      yaxis: {
        ...getPlotlyThemeConfig().yaxis,
        title: '',
        showgrid: true,
        gridcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        tickformat: ',.2s',
        tickfont: { size: 10 }
      },
      annotations: [
        {
          text: 'Weekly Active Population (Residents + Commuters + Visitors)',
          xref: 'paper',
          yref: 'paper',
          x: 0.5,
          y: 1.08,
          xanchor: 'center',
          yanchor: 'bottom',
          showarrow: false,
          font: {
            size: 11,
            color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(26, 26, 46, 0.7)'
          }
        }
      ]
    };
    
    const config = { 
      responsive: true, 
      displayModeBar: false 
    };
    
    // Create chart
    Plotly.newPlot(chartElement, [trace], layout, config);
  } catch (error) {
    console.error('Error creating population chart:', error);
    chartElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);">Chart error</div>';
  }
}

/**
 * Create line chart for soil moisture over 7 days
 * Plots moisture with optimal range background (40-60%)
 * @param {object} soilData - Soil data object with weeklyData array
 */
function updateChartSoil(soilData) {
  const chartElement = document.getElementById('soil-chart');
  if (!chartElement || !soilData || !soilData.weeklyData) return;
  
  try {
    // Generate day labels
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const values = soilData.weeklyData;
    
    // Create line chart without markers for cleaner look
    const trace = {
      x: days,
      y: values,
      type: 'scatter',
      mode: 'lines',
      line: { color: '#00ff88', width: 2.5, shape: 'spline' },
      hovertemplate: '%{y:.0f}%<extra></extra>'
    };
    
    // Apply theme configuration - removed background shape for cleaner look
    const layout = {
      ...getPlotlyThemeConfig(),
      xaxis: { 
        ...getPlotlyThemeConfig().xaxis,
        title: '',
        nticks: 7
      },
      yaxis: { 
        ...getPlotlyThemeConfig().yaxis,
        title: '',
        range: [0, 100],
        nticks: 5
      }
    };
    
    const config = { responsive: true, displayModeBar: false };
    
    // Create chart
    Plotly.newPlot(chartElement, [trace], layout, config);
  } catch (error) {
    console.error('Error creating soil chart:', error);
  }
}

/**
 * Create bar chart for groundwater depth trend
 * Plots water table depth over 12 months with color coding
 * @param {object} groundwaterData - Groundwater data object with monthlyData array
 */
function updateChartGroundwater(groundwaterData) {
  const chartElement = document.getElementById('groundwater-chart');
  if (!chartElement || !groundwaterData || !groundwaterData.monthlyData) return;
  
  try {
    // Generate month labels
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const values = groundwaterData.monthlyData;
    
    // Apply color coding based on status
    const color = groundwaterData.status === 'good' ? '#00ff88' : 
                  groundwaterData.status === 'moderate' ? '#ffc107' : '#ff4444';
    
    // Create bar chart
    const trace = {
      x: months,
      y: values,
      type: 'bar',
      marker: { color: color }
    };
    
    // Apply theme configuration
    const layout = {
      ...getPlotlyThemeConfig(),
      xaxis: { 
        ...getPlotlyThemeConfig().xaxis,
        title: '',
        nticks: 6,
        tickmode: 'auto'
      },
      yaxis: { 
        ...getPlotlyThemeConfig().yaxis,
        title: '',
        nticks: 5
      }
    };
    
    const config = { responsive: true, displayModeBar: false };
    
    // Create chart
    Plotly.newPlot(chartElement, [trace], layout, config);
  } catch (error) {
    console.error('Error creating groundwater chart:', error);
  }
}

/**
 * Create line chart for atmospheric pressure over 24 hours
 * Plots pressure trends with trend annotations
 * @param {Array} history - Array of historical pressure data
 * @param {string} trend - Trend indicator (↑, ↓, →)
 */
function updateChartPressure(history, trend) {
  const chartElement = document.getElementById('pressure-chart');
  if (!chartElement || !history || history.length === 0) return;
  
  try {
    // Extract time and pressure values
    const times = history.map(h => h.time || '');
    const pressures = history.map(h => h.pressure || 0);
    
    // Create line chart
    const trace = {
      x: times,
      y: pressures,
      type: 'scatter',
      mode: 'lines',
      line: { color: '#4a9eff', width: 2.5, shape: 'spline' },
      hovertemplate: '%{y:.0f} hPa<extra></extra>'
    };
    
    // Apply theme configuration
    const layout = {
      ...getPlotlyThemeConfig(),
      xaxis: { 
        ...getPlotlyThemeConfig().xaxis,
        title: '',
        nticks: 6,
        tickmode: 'auto'
      },
      yaxis: { 
        ...getPlotlyThemeConfig().yaxis,
        title: '',
        nticks: 5
      }
    };
    
    const config = { responsive: true, displayModeBar: false };
    
    // Create chart
    Plotly.newPlot(chartElement, [trace], layout, config);
  } catch (error) {
    console.error('Error creating pressure chart:', error);
  }
}


// ============================================
// PART 12: REFRESH AND AUTO-UPDATE FUNCTIONALITY
// ============================================

// Timestamp update interval ID
let timestampUpdateInterval = null;

/**
 * Set up timestamp update interval to refresh "Updated X minutes ago" displays
 * Updates every 10 seconds for accurate time display
 */
function setupTimestampUpdate() {
  // Clear any existing interval
  if (timestampUpdateInterval) {
    clearInterval(timestampUpdateInterval);
  }
  
  // Use setInterval to call updateTimestamp every 10 seconds
  timestampUpdateInterval = setInterval(() => {
    // Update all "Updated X minutes ago" displays
    updateTimestamp();
  }, 10000); // 10 seconds = 10000 milliseconds
  
  console.log('Timestamp update interval set up (every 10 seconds)');
}


// ============================================
// PART 9B: LIVING STANDARDS SCORE CALCULATION
// ============================================

/**
 * Calculate comprehensive living standards score
 * Based on all 13 metrics with weighted algorithm
 * @returns {Object} Score breakdown
 */
function calculateLivingScore() {
  // Individual metric scores (0-100)
  const airQualityScore = getAirQualityScore(metricData.airQuality.value);
  const weatherScore = getWeatherScore(metricData.weather.value);
  const trafficScore = getTrafficScore(metricData.traffic.value);
  const uvScore = getUVScore(metricData.uv.value);
  const infraScore = getInfrastructureScore();
  const envScore = getEnvironmentScore();
  
  // Weighted total (0-100)
  const totalScore = Math.round(
    (airQualityScore * 0.20) +    // Air Quality: 20%
    (weatherScore * 0.10) +        // Weather: 10%
    (trafficScore * 0.15) +        // Traffic: 15%
    (uvScore * 0.05) +             // UV Index: 5%
    (infraScore * 0.30) +          // Infrastructure: 30%
    (envScore * 0.20)              // Environment: 20%
  );
  
  return {
    total: Math.max(0, Math.min(100, totalScore)),
    air: Math.round(airQualityScore),
    infra: Math.round(infraScore),
    env: Math.round(envScore)
  };
}

/**
 * Calculate air quality score
 */
function getAirQualityScore(aqi) {
  if (!aqi || aqi === null) return 70;
  if (aqi <= 50) return 100;
  if (aqi <= 100) return 80;
  if (aqi <= 150) return 60;
  if (aqi <= 200) return 40;
  if (aqi <= 300) return 20;
  return 10;
}

/**
 * Calculate weather comfort score
 */
function getWeatherScore(temp) {
  if (!temp || temp === null) return 70;
  if (temp >= 20 && temp <= 28) return 100;
  if (temp >= 15 && temp <= 32) return 80;
  if (temp >= 10 && temp <= 35) return 60;
  if (temp >= 5 && temp <= 40) return 40;
  return 20;
}

/**
 * Calculate traffic score
 */
function getTrafficScore(congestion) {
  // If traffic data is not available (null), return neutral score
  if (congestion === null || congestion === undefined) return 70;
  if (congestion <= 30) return 100;
  if (congestion <= 60) return 70;
  if (congestion <= 80) return 40;
  return 20;
}

/**
 * Calculate UV index score
 */
function getUVScore(uvi) {
  if (!uvi || uvi === null) return 70;
  if (uvi <= 2) return 100;
  if (uvi <= 5) return 80;
  if (uvi <= 7) return 60;
  if (uvi <= 10) return 40;
  return 20;
}

/**
 * Calculate infrastructure score (average of 4 metrics)
 */
function getInfrastructureScore() {
  const cityName = currentCity.name.toLowerCase();
  const cityData = cityStaticData[cityName];
  
  if (!cityData) return 70;
  
  let scores = [];
  
  // Energy reliability
  if (cityData.energy && cityData.energy.loadFactor) {
    scores.push(Math.round(cityData.energy.loadFactor * 100));
  }
  
  // Waste recycling rate
  if (cityData.waste && cityData.waste.recyclingRate) {
    scores.push(cityData.waste.recyclingRate);
  }
  
  // Water quality
  if (cityData.water && cityData.water.status === 'good') {
    scores.push(85);
  } else {
    scores.push(50);
  }
  
  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 70;
}

/**
 * Calculate environment score (average of 3 metrics)
 */
function getEnvironmentScore() {
  const cityName = currentCity.name.toLowerCase();
  const cityData = cityStaticData[cityName];
  
  if (!cityData) return 70;
  
  let scores = [];
  
  // Soil moisture (optimal: 40-60%)
  if (cityData.soil && cityData.soil.moisture) {
    const moisture = cityData.soil.moisture;
    if (moisture >= 40 && moisture <= 60) {
      scores.push(100);
    } else if (moisture >= 30 && moisture <= 70) {
      scores.push(80);
    } else {
      scores.push(50);
    }
  }
  
  // Groundwater status
  if (cityData.groundwater && cityData.groundwater.status) {
    scores.push(cityData.groundwater.status === 'moderate' || cityData.groundwater.status === 'good' ? 80 : 50);
  }
  
  // Air pressure (assume normal)
  scores.push(75);
  
  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 70;
}

/**
 * Display living score on UI
 */
function displayLivingScore() {
  const score = calculateLivingScore();
  
  // Update main score
  const scoreValueEl = document.getElementById('living-score-value');
  const scoreProgressEl = document.getElementById('living-score-progress');
  
  if (scoreValueEl) {
    scoreValueEl.textContent = score.total;
  }
  
  if (scoreProgressEl) {
    scoreProgressEl.style.width = score.total + '%';
  }
  
  // Determine status
  let status = '';
  let statusClass = '';
  
  if (score.total >= 80) {
    status = 'Excellent';
    statusClass = 'excellent';
  } else if (score.total >= 60) {
    status = 'Good';
    statusClass = 'good';
  } else if (score.total >= 40) {
    status = 'Fair';
    statusClass = 'fair';
  } else {
    status = 'Poor';
    statusClass = 'poor';
  }
  
  const statusElement = document.getElementById('living-score-status');
  if (statusElement) {
    statusElement.textContent = status;
    statusElement.className = `hero-score-status ${statusClass}`;
  }
  
  // Update category scores
  const airEl = document.getElementById('score-air');
  const infraEl = document.getElementById('score-infra');
  const envEl = document.getElementById('score-env');
  
  if (airEl) airEl.textContent = score.air;
  if (infraEl) infraEl.textContent = score.infra;
  if (envEl) envEl.textContent = score.env;
}


// ============================================
// PART 9C: MODAL SYSTEM FOR DETAILED METRICS
// ============================================

/**
 * Open metric detail modal
 * @param {string} metricType - Type of metric to display
 */
function openMetricModal(metricType) {
  const modal = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const content = document.getElementById('modal-content');
  
  if (!modal || !title || !content) return;
  
  // Metric titles mapping
  const titles = {
    'air-quality': 'Air Quality Details',
    'weather': 'Weather Details',
    'traffic': 'Traffic Congestion Details',
    'uv': 'UV Index Details',
    'wind': 'Wind Conditions Details',
    'daylight': 'Daylight Details',
    'energy': 'Energy Consumption Details',
    'waste': 'Waste Management Details',
    'water': 'Water Quality Details',
    'population': 'Population Density Details',
    'soil': 'Soil Quality Details',
    'groundwater': 'Groundwater Level Details',
    'pressure': 'Atmospheric Pressure Details'
  };
  
  title.textContent = titles[metricType] || 'Metric Details';
  
  // Clear cache for this metric to ensure fresh data
  Object.keys(historicalDataCache).forEach(key => {
    if (key.startsWith(metricType)) {
      delete historicalDataCache[key];
    }
  });
  
  // Reset time granularity controls to monthly
  document.querySelectorAll('.time-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-granularity') === 'monthly') {
      btn.classList.add('active');
    }
  });
  
  // Generate modal content
  content.innerHTML = generateModalContent(metricType);
  
  // Show modal
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  // Render chart after brief delay with default monthly granularity
  setTimeout(() => renderModalChart(metricType, 'monthly'), 150);
}

/**
 * Close modal
 */
function closeMetricModal() {
  const modal = document.getElementById('modal-overlay');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

/**
 * Generate modal content based on metric type
 */
function generateModalContent(metricType) {
  // Convert metric type to match metricData keys (camelCase)
  const metricKey = metricType.replace(/-([a-z])/g, (g) => g[1].toUpperCase()).replace('-', '');
  const data = metricData[metricKey] || {};
  
  console.log(`📊 Modal for ${metricType} -> ${metricKey}:`, data);
  
  switch(metricType) {
    case 'air-quality':
      return `
        <div class="modal-hero-value">
          <div class="modal-value-box">${data.value !== null && data.value !== undefined ? data.value : '--'}</div>
          <div class="modal-value-unit">AQI</div>
        </div>
        <div class="modal-metric-status">${data.subMetrics?.status || ''}</div>
        <div class="modal-chart" id="modal-chart"></div>
        <div class="modal-section">
          <h3><i class="fa-solid fa-wind"></i> Pollutants Breakdown</h3>
          <div class="modal-metric-list">
            <div class="modal-metric-item">
              <strong>PM2.5</strong>
              <span>${data.subMetrics?.pm25 !== null && data.subMetrics?.pm25 !== undefined ? data.subMetrics.pm25 : '--'} µg/m³</span>
            </div>
            <div class="modal-metric-item">
              <strong>PM10</strong>
              <span>${data.subMetrics?.pm10 !== null && data.subMetrics?.pm10 !== undefined ? data.subMetrics.pm10 : '--'} µg/m³</span>
            </div>
            <div class="modal-metric-item">
              <strong>Ozone (O₃)</strong>
              <span>${data.subMetrics?.o3 !== null && data.subMetrics?.o3 !== undefined ? data.subMetrics.o3 : '--'} µg/m³</span>
            </div>
            <div class="modal-metric-item">
              <strong>NO₂</strong>
              <span>${data.subMetrics?.no2 !== null && data.subMetrics?.no2 !== undefined ? data.subMetrics.no2 : '--'} µg/m³</span>
            </div>
          </div>
        </div>
      `;
    
    case 'weather':
      return `
        <div class="modal-hero-value">
          <div class="modal-value-box">${data.value !== null && data.value !== undefined ? data.value : '--'}</div>
          <div class="modal-value-unit">°C</div>
        </div>
        <div class="modal-metric-status">${data.subMetrics?.weatherDescription || ''}</div>
        <div class="modal-chart" id="modal-chart"></div>
        <div class="modal-section">
          <h3><i class="fa-solid fa-cloud-sun"></i> Detailed Metrics</h3>
          <div class="modal-metric-list">
            <div class="modal-metric-item">
              <strong>Humidity</strong>
              <span>${data.subMetrics?.humidity || '--'}%</span>
            </div>
            <div class="modal-metric-item">
              <strong>Pressure</strong>
              <span>${data.subMetrics?.pressure || '--'} hPa</span>
            </div>
            <div class="modal-metric-item">
              <strong>Wind Speed</strong>
              <span>${data.subMetrics?.windSpeed || '--'} m/s</span>
            </div>
          </div>
        </div>
      `;
    
    case 'traffic':
      return `
        <div class="modal-hero-value">
          <div class="modal-value-box">${data.value !== null && data.value !== undefined ? data.value : '--'}</div>
          <div class="modal-value-unit">%</div>
        </div>
        <div class="modal-metric-status">${data.subMetrics?.status || ''}</div>
        <div class="modal-chart" id="modal-chart"></div>
        <div class="modal-section">
          <h3><i class="fa-solid fa-car"></i> Traffic Details</h3>
          <div class="modal-metric-list">
            <div class="modal-metric-item">
              <strong>Current Speed</strong>
              <span>${data.subMetrics?.currentSpeed || '--'} km/h</span>
            </div>
            <div class="modal-metric-item">
              <strong>Free Flow Speed</strong>
              <span>${data.subMetrics?.freeFlowSpeed || '--'} km/h</span>
            </div>
          </div>
        </div>
      `;
    
    case 'uv':
      return `
        <div class="modal-hero-value">
          <div class="modal-value-box">${data.value !== null && data.value !== undefined ? data.value : '--'}</div>
          <div class="modal-value-unit">UVI</div>
        </div>
        <div class="modal-metric-status">${data.subMetrics?.riskLevel || ''}</div>
        <div class="modal-chart" id="modal-chart"></div>
        <div class="modal-section">
          <h3><i class="fa-solid fa-sun"></i> UV Protection</h3>
          <p class="modal-text">${data.subMetrics?.recommendation || 'UV index information'}</p>
        </div>
      `;
    
    case 'wind':
      return `
        <div class="modal-hero-value">
          <div class="modal-value-box">${data.value !== null && data.value !== undefined ? data.value : '--'}</div>
          <div class="modal-value-unit">km/h</div>
        </div>
        <div class="modal-metric-status">${data.subMetrics?.compassDirection ? 'From ' + data.subMetrics.compassDirection : ''}</div>
        <div class="modal-chart" id="modal-chart"></div>
        <div class="modal-section">
          <h3><i class="fa-solid fa-wind"></i> Wind Details</h3>
          <div class="modal-metric-list">
            <div class="modal-metric-item">
              <strong>Direction</strong>
              <span>${data.subMetrics?.compassDirection || '--'} (${data.subMetrics?.windDirection || '--'}°)</span>
            </div>
            <div class="modal-metric-item">
              <strong>Gust Speed</strong>
              <span>${data.subMetrics?.windGust || '--'} km/h</span>
            </div>
          </div>
        </div>
      `;
    
    case 'daylight':
      return `
        <div class="modal-hero-value">
          <div class="modal-value-box">${data.value !== null && data.value !== undefined ? data.value : '--'}</div>
          <div class="modal-value-unit">hrs</div>
        </div>
        <div class="modal-metric-status">Hours of Daylight</div>
        <div class="modal-chart" id="modal-chart"></div>
        <div class="modal-section">
          <h3><i class="fa-solid fa-sun"></i> Sun Times</h3>
          <div class="modal-metric-list">
            <div class="modal-metric-item">
              <strong>Sunrise</strong>
              <span>${data.subMetrics?.sunriseTime || '--'}</span>
            </div>
            <div class="modal-metric-item">
              <strong>Sunset</strong>
              <span>${data.subMetrics?.sunsetTime || '--'}</span>
            </div>
          </div>
        </div>
      `;
    
    default:
      return `
        <div class="modal-hero-value">
          <div class="modal-value-box">${data.value !== null && data.value !== undefined ? data.value : '--'}</div>
          <div class="modal-value-unit">${getUnitForMetric(metricType)}</div>
        </div>
        <div class="modal-metric-status">${data.subMetrics?.status || ''}</div>
        <div class="modal-chart" id="modal-chart"></div>
        <p class="modal-text">Detailed information for this metric.</p>
      `;
  }
}

/**
 * Get unit for metric type
 */
function getUnitForMetric(metricType) {
  const units = {
    'traffic': '%',
    'uv': 'UVI',
    'wind': 'km/h',
    'daylight': 'hrs',
    'energy': 'MWh',
    'waste': 'tons',
    'water': 'pH',
    'population': 'per km²',
    'soil': '%',
    'groundwater': 'm',
    'pressure': 'hPa'
  };
  return units[metricType] || '';
}

// ============================================
// EXPANDABLE CHART SYSTEM - DATA GENERATION
// ============================================

// Cache for historical data to avoid regeneration
const historicalDataCache = {};

/**
 * Generate historical data at different granularities
 * @param {string} metricType - Type of metric
 * @param {string} granularity - 'yearly', 'monthly', or 'daily'
 * @returns {Object} Data object with dates and values
 */
function generateHistoricalData(metricType, granularity) {
  // Check cache first
  const cacheKey = `${metricType}-${granularity}`;
  if (historicalDataCache[cacheKey]) {
    return historicalDataCache[cacheKey];
  }
  
  const metricKey = metricType.replace(/-([a-z])/g, (g) => g[1].toUpperCase()).replace('-', '');
  const currentData = metricData[metricKey] || {};
  const currentValue = currentData.value || 50;
  
  const data = { dates: [], values: [], labels: [] };
  const now = new Date();
  
  if (granularity === 'yearly') {
    // Generate 12 months of data (YEARLY VIEW)
    console.log(`📅 Generating YEARLY data: 12 months`);
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      data.dates.push(date);
      data.labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      // Simulate seasonal variation with trend
      const seasonalFactor = 1 + 0.3 * Math.sin((date.getMonth() / 12) * Math.PI * 2);
      const trendFactor = 1 + (i / 120); // Slight upward trend
      const randomVariation = 0.85 + Math.random() * 0.3;
      data.values.push(Math.max(0, currentValue * seasonalFactor * trendFactor * randomVariation));
    }
  } else if (granularity === 'monthly') {
    // Generate 30 days of data (MONTHLY VIEW)
    console.log(`📅 Generating MONTHLY data: 30 days`);
    const daysInMonth = 30;
    for (let i = daysInMonth - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      data.dates.push(date);
      data.labels.push(date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }));
      // Simulate daily variation with weekly patterns
      const weekdayFactor = date.getDay() === 0 || date.getDay() === 6 ? 0.75 : 1.05;
      const randomVariation = 0.8 + Math.random() * 0.4;
      data.values.push(Math.max(0, currentValue * weekdayFactor * randomVariation));
    }
  } else if (granularity === 'weekly') {
    // Generate 7 days of data (WEEKLY VIEW)
    console.log(`📅 Generating WEEKLY data: 7 days`);
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      data.dates.push(date);
      data.labels.push(date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }));
      // Simulate daily variation with weekly patterns
      const weekdayFactor = date.getDay() === 0 || date.getDay() === 6 ? 0.7 : 1.1;
      const randomVariation = 0.8 + Math.random() * 0.4;
      data.values.push(Math.max(0, currentValue * weekdayFactor * randomVariation));
    }
  } else if (granularity === 'daily') {
    // Generate 24 hours of data (DAILY VIEW)
    console.log(`📅 Generating DAILY data: 24 hours`);
    for (let i = 23; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.dates.push(date);
      data.labels.push(date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      // Simulate hourly variation with realistic patterns
      const hour = date.getHours();
      let hourlyFactor = 1.0;
      
      // Different patterns for different metrics
      if (metricType === 'traffic') {
        // Traffic peaks during rush hours
        hourlyFactor = hour >= 7 && hour <= 9 ? 1.8 : hour >= 17 && hour <= 19 ? 1.9 : 0.6;
      } else if (metricType === 'air-quality') {
        // Air quality worse during day, better at night
        hourlyFactor = hour >= 6 && hour <= 20 ? 1.3 : 0.7;
      } else {
        // General sinusoidal pattern
        hourlyFactor = 1 + 0.4 * Math.sin((hour / 24) * Math.PI * 2);
      }
      
      const randomVariation = 0.85 + Math.random() * 0.3;
      data.values.push(Math.max(0, currentValue * hourlyFactor * randomVariation));
    }
  }
  
  // Cache the data
  historicalDataCache[cacheKey] = data;
  
  return data;
}

/**
 * Get chart configuration for metric type
 */
function getMetricChartConfig(metricType) {
  const configs = {
    'air-quality': { color: '#00ff88', unit: 'AQI', fillColor: 'rgba(0, 255, 136, 0.15)' },
    'weather': { color: '#ff4444', unit: '°C', fillColor: 'rgba(255, 68, 68, 0.15)' },
    'traffic': { color: '#ffc107', unit: '%', fillColor: 'rgba(255, 193, 7, 0.15)' },
    'uv': { color: '#ff9800', unit: 'UVI', fillColor: 'rgba(255, 152, 0, 0.15)' },
    'wind': { color: '#4a9eff', unit: 'km/h', fillColor: 'rgba(74, 158, 255, 0.15)' },
    'daylight': { color: '#ffc107', unit: 'hrs', fillColor: 'rgba(255, 193, 7, 0.15)' },
    'energy': { color: '#ff9800', unit: 'MWh', fillColor: 'rgba(255, 152, 0, 0.15)' },
    'waste': { color: '#ff4444', unit: 'tons', fillColor: 'rgba(255, 68, 68, 0.15)' },
    'water': { color: '#4a9eff', unit: 'pH', fillColor: 'rgba(74, 158, 255, 0.15)' },
    'population': { color: '#00ff88', unit: 'people', fillColor: 'rgba(0, 255, 136, 0.15)' },
    'soil': { color: '#00ff88', unit: '%', fillColor: 'rgba(0, 255, 136, 0.15)' },
    'groundwater': { color: '#4a9eff', unit: 'm', fillColor: 'rgba(74, 158, 255, 0.15)' },
    'pressure': { color: '#4a9eff', unit: 'hPa', fillColor: 'rgba(74, 158, 255, 0.15)' }
  };
  
  return configs[metricType] || { color: '#00ff88', unit: '', fillColor: 'rgba(0, 255, 136, 0.15)' };
}

// Store current chart state
let currentChartState = {
  metricType: null,
  granularity: 'monthly',
  data: null
};

/**
 * Render detailed chart in modal with expandable granularity
 */
function renderModalChart(metricType, granularity = 'monthly') {
  const chartDiv = document.getElementById('modal-chart');
  if (!chartDiv || !Plotly) return;
  
  console.log(`🔄 Rendering chart: ${metricType} at ${granularity} granularity`);
  
  // Update current state
  currentChartState.metricType = metricType;
  currentChartState.granularity = granularity;
  
  // Generate data for current granularity (will use cache if available)
  const data = generateHistoricalData(metricType, granularity);
  currentChartState.data = data;
  
  console.log(`📈 Generated ${data.values.length} data points for ${granularity} view`);
  
  // Get metric configuration
  const config = getMetricChartConfig(metricType);
  
  // Create trace
  const trace = {
    x: data.dates,
    y: data.values,
    type: 'scatter',
    mode: 'lines',
    fill: 'tozeroy',
    line: { 
      color: config.color, 
      width: 2.5,
      shape: 'spline'
    },
    fillcolor: config.fillColor,
    hovertemplate: `<b>%{x|%b %d, %Y %H:%M}</b><br>Value: %{y:.1f} ${config.unit}<extra></extra>`
  };
  
  // Determine title based on granularity
  let titleText = '';
  if (granularity === 'yearly') {
    titleText = 'Last 12 Months';
  } else if (granularity === 'monthly') {
    titleText = 'Last 30 Days';
  } else if (granularity === 'weekly') {
    titleText = 'Last 7 Days';
  } else {
    titleText = 'Last 24 Hours';
  }
  
  // Apply theme configuration
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const layout = {
    ...getPlotlyThemeConfig(),
    height: 450,
    margin: { l: 60, r: 40, b: 80, t: 50, pad: 10 },
    xaxis: {
      ...getPlotlyThemeConfig().xaxis,
      title: '',
      showgrid: false,
      tickformat: granularity === 'yearly' ? '%b %Y' : granularity === 'monthly' ? '%d %b' : granularity === 'weekly' ? '%a %d' : '%H:%M',
      tickangle: -30,
      tickfont: { size: 11 },
      type: 'date'
    },
    yaxis: {
      ...getPlotlyThemeConfig().yaxis,
      title: config.unit,
      showgrid: true,
      gridcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      tickfont: { size: 11 }
    },
    dragmode: 'zoom',
    annotations: [
      {
        text: titleText,
        xref: 'paper',
        yref: 'paper',
        x: 0.5,
        y: 1.08,
        xanchor: 'center',
        yanchor: 'bottom',
        showarrow: false,
        font: {
          size: 14,
          color: isDark ? '#ffffff' : '#1a1a2e',
          weight: 600
        }
      }
    ]
  };
  
  const plotConfig = { 
    responsive: true, 
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: [] // Keep all controls
  };
  
  // Always use react for proper data updates
  Plotly.react(chartDiv, [trace], layout, plotConfig);
  
  console.log(`📊 Chart updated: ${metricType} - ${granularity} - ${data.values.length} data points`);
}

/**
 * Get air quality health recommendation
 */
function getAirQualityRecommendation(aqi) {
  if (!aqi) return 'Unable to determine recommendations.';
  if (aqi <= 50) return '✓ Air quality is excellent. Safe for all outdoor activities.';
  if (aqi <= 100) return '✓ Air quality is good. Most people can engage in outdoor activities.';
  if (aqi <= 150) return '⚠ Sensitive groups should limit outdoor exposure. Others can continue activities.';
  if (aqi <= 200) return '⚠ Everyone should reduce prolonged outdoor exposure. Wear masks if outside.';
  return '⚠ Avoid outdoor activities. Stay indoors and use air purifiers if available.';
}

/**
 * Initialize modal system
 */
function initializeModals() {
  // Make all metric cards clickable
  document.querySelectorAll('.metric-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', function() {
      const metricId = this.id.replace('-card', '');
      openMetricModal(metricId);
    });
  });
  
  // Close modal button
  const closeBtn = document.getElementById('modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeMetricModal);
  }
  
  // Time granularity buttons
  document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const granularity = this.getAttribute('data-granularity');
      
      console.log(`🎯 Time button clicked: ${granularity}`);
      
      // Update active state
      document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Re-render chart with new granularity
      if (currentChartState.metricType) {
        console.log(`🔄 Switching from ${currentChartState.granularity} to ${granularity}`);
        renderModalChart(currentChartState.metricType, granularity);
      } else {
        console.warn('⚠️ No metric type in current state');
      }
    });
  });
  
  // Close on overlay click
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeMetricModal();
      }
    });
  }
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMetricModal();
    }
  });
}


// ============================================
// PART 10: INITIALIZATION
// ============================================

/**
 * Initialize the application
 * Sets up theme, populates city selector, fetches initial data, and starts intervals
 * Called when the page loads
 */
function initializeApp() {
  console.log('Initializing C-Metrics Dashboard...');
  
  try {
    // Call applyTheme to set initial theme
    applyTheme();
    console.log('Theme applied');
    
    // Call populateCitySelector to populate dropdown
    populateCitySelector();
    console.log('City selector populated');
    
    // Initialize city search
    initializeCitySearch();
    console.log('City search initialized');
    
    // Set default city to Bangalore (already set in global state, but ensure it's selected in dropdown)
    const citySelector = document.getElementById('city-selector');
    if (citySelector) {
      citySelector.value = currentCity.name.toLowerCase();
    }
    console.log('Default city set to:', currentCity.name);
    
    // Set initial visibility of infrastructure and environmental sections
    toggleInfrastructureEnvironmentalSections(currentCity.name);
    console.log('Infrastructure and Environmental sections visibility set');
    
    // Initialize map
    setTimeout(() => {
      initializeMap();
      console.log('Map initialized');
    }, 100);
    
    // Initialize modals
    initializeModals();
    console.log('Modals initialized');
    
    // Call updateAllData to fetch initial data
    updateAllData().then(() => {
      console.log('Initial data fetch completed');
    }).catch(error => {
      console.error('Error fetching initial data:', error);
    });
    
    // Call displayStaticMetrics to show static data
    displayStaticMetrics();
    console.log('Static metrics displayed');
    
    // Start timestamp update interval (10 seconds)
    setupTimestampUpdate();
    
    console.log('C-Metrics Dashboard initialized successfully!');
    
  } catch (error) {
    console.error('Error during initialization:', error);
  }
}


// ============================================
// AUTO-REFRESH SYSTEM
// ============================================

let autoRefreshInterval = null;
let countdownInterval = null;

/**
 * Start auto-refresh timer (10 seconds)
 */
function startAutoRefresh() {
  // Clear any existing interval
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  
  // Set up 10-second auto-refresh
  autoRefreshInterval = setInterval(() => {
    console.log('🔄 Auto-refreshing data...');
    refreshAllData();
  }, 10000); // 10 seconds
  
  console.log('✅ Auto-refresh enabled (every 10 seconds)');
}

/**
 * Stop auto-refresh timer
 */
function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  console.log('⏸️ Auto-refresh disabled');
}

/**
 * Refresh all dashboard data
 */
function refreshAllData() {
  const refreshBtn = document.getElementById('refresh-btn');
  const updateText = document.getElementById('update-text');
  
  // Set flag to prevent loading overlays during refresh
  isAutoRefreshing = true;
  
  // Add spinning animation to button
  if (refreshBtn) {
    refreshBtn.classList.add('refreshing');
  }
  
  // Show refreshing status
  if (updateText) {
    updateText.textContent = 'Refreshing...';
    updateText.style.color = 'var(--accent-yellow)';
  }
  
  // Add pulse effect to all metric cards
  document.querySelectorAll('.metric-card').forEach(card => {
    card.classList.add('refreshing-pulse');
  });
  
  // Update all data WITHOUT showing loading overlays
  updateAllData().then(() => {
    // Reset flag
    isAutoRefreshing = false;
    // Remove animations after refresh completes
    if (refreshBtn) {
      setTimeout(() => {
        refreshBtn.classList.remove('refreshing');
      }, 1000);
    }
    
    // Update status text
    if (updateText) {
      updateText.textContent = 'Updated just now';
      updateText.style.color = 'var(--accent-green)';
      
      // Fade back to normal color
      setTimeout(() => {
        updateText.style.color = '';
      }, 2000);
    }
    
    // Remove pulse effect
    setTimeout(() => {
      document.querySelectorAll('.metric-card').forEach(card => {
        card.classList.remove('refreshing-pulse');
      });
    }, 500);
    
    console.log('✅ Refresh complete');
  }).catch(error => {
    console.error('Error during refresh:', error);
    // Reset flag
    isAutoRefreshing = false;
    
    if (refreshBtn) {
      refreshBtn.classList.remove('refreshing');
    }
    if (updateText) {
      updateText.textContent = 'Update failed';
      updateText.style.color = 'var(--accent-red)';
    }
    document.querySelectorAll('.metric-card').forEach(card => {
      card.classList.remove('refreshing-pulse');
    });
  });
}

/**
 * Update refresh indicator countdown
 */
function updateRefreshIndicator() {
  const indicator = document.getElementById('auto-refresh-indicator');
  if (!indicator) return;
  
  let countdown = 10;
  
  // Clear any existing countdown
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  
  countdownInterval = setInterval(() => {
    countdown--;
    if (countdown <= 0) countdown = 10;
    indicator.innerHTML = `<i class="fa-solid fa-circle-dot"></i> Auto-refresh: ${countdown}s`;
  }, 1000);
}

/**
 * Initialize refresh system
 */
function initializeRefreshSystem() {
  // Add click handler to refresh button
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      console.log('🔄 Manual refresh triggered');
      refreshAllData();
      // Reset countdown
      updateRefreshIndicator();
    });
  }
  
  // Start auto-refresh
  startAutoRefresh();
  
  // Update indicator countdown
  updateRefreshIndicator();
  
  console.log('✅ Refresh system initialized');
}


// ============================================
// EVENT LISTENERS
// ============================================

// Add window load listener calling initializeApp
window.addEventListener('load', () => {
  console.log('Page loaded, initializing application...');
  initializeApp();
  
  // Initialize refresh system after app loads
  setTimeout(() => {
    initializeRefreshSystem();
  }, 1000);
});

// Add click listener to theme toggle button calling toggleTheme
const themeToggleButton = document.getElementById('theme-toggle');
if (themeToggleButton) {
  themeToggleButton.addEventListener('click', () => {
    console.log('Theme toggle clicked');
    toggleTheme();
  });
}

// Add change listener to city selector calling changeCity
const citySelectorElement = document.getElementById('city-selector');
if (citySelectorElement) {
  citySelectorElement.addEventListener('change', () => {
    console.log('City selector changed');
    changeCity();
  });
}

console.log('Event listeners registered');

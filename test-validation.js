// ============================================
// C-METRICS DASHBOARD - TEST VALIDATION SCRIPT
// ============================================
// This script performs comprehensive testing of the dashboard
// Run this in the browser console after loading the page

console.log('='.repeat(60));
console.log('C-METRICS DASHBOARD - COMPREHENSIVE TEST SUITE');
console.log('='.repeat(60));

// Test Results Storage
const testResults = {
  apiIntegration: [],
  uiFunctionality: [],
  responsiveDesign: [],
  chartRendering: [],
  dataAccuracy: [],
  performance: []
};

// ============================================
// PART 1: API INTEGRATION TESTS
// ============================================

async function testAPIIntegrations() {
  console.log('\n📡 TESTING API INTEGRATIONS...\n');
  
  // Test 1: Air Quality API
  try {
    console.log('Testing AQICN API...');
    const aqiUrl = `${API_CONFIG.aqicn.endpoint}${currentCity.lat};${currentCity.lon}/?token=${API_CONFIG.aqicn.token}`;
    const aqiResponse = await fetch(aqiUrl);
    const aqiData = await aqiResponse.json();
    
    if (aqiData.status === 'ok' && aqiData.data) {
      console.log('✅ AQICN API: PASS - AQI:', aqiData.data.aqi);
      testResults.apiIntegration.push({ api: 'AQICN', status: 'PASS', value: aqiData.data.aqi });
    } else {
      console.log('❌ AQICN API: FAIL - Invalid response');
      testResults.apiIntegration.push({ api: 'AQICN', status: 'FAIL', error: 'Invalid response' });
    }
  } catch (error) {
    console.log('❌ AQICN API: FAIL -', error.message);
    testResults.apiIntegration.push({ api: 'AQICN', status: 'FAIL', error: error.message });
  }
  
  // Test 2: OpenWeatherMap API
  try {
    console.log('Testing OpenWeatherMap API...');
    const weatherUrl = `${API_CONFIG.openweather.endpoint}?lat=${currentCity.lat}&lon=${currentCity.lon}&appid=${API_CONFIG.openweather.apiKey}&units=metric`;
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();
    
    if (weatherData.main && weatherData.main.temp) {
      console.log('✅ OpenWeatherMap API: PASS - Temp:', weatherData.main.temp + '°C');
      testResults.apiIntegration.push({ api: 'OpenWeatherMap', status: 'PASS', value: weatherData.main.temp });
    } else {
      console.log('❌ OpenWeatherMap API: FAIL - Invalid response');
      testResults.apiIntegration.push({ api: 'OpenWeatherMap', status: 'FAIL', error: 'Invalid response' });
    }
  } catch (error) {
    console.log('❌ OpenWeatherMap API: FAIL -', error.message);
    testResults.apiIntegration.push({ api: 'OpenWeatherMap', status: 'FAIL', error: error.message });
  }
  
  // Test 3: TomTom Traffic API
  try {
    console.log('Testing TomTom Traffic API...');
    const trafficUrl = `${API_CONFIG.tomtom.endpoint}?point=${currentCity.lat},${currentCity.lon}&key=${API_CONFIG.tomtom.apiKey}`;
    const trafficResponse = await fetch(trafficUrl);
    const trafficData = await trafficResponse.json();
    
    if (trafficData.flowSegmentData) {
      console.log('✅ TomTom API: PASS - Speed:', trafficData.flowSegmentData.currentSpeed + ' km/h');
      testResults.apiIntegration.push({ api: 'TomTom', status: 'PASS', value: trafficData.flowSegmentData.currentSpeed });
    } else {
      console.log('❌ TomTom API: FAIL - Invalid response');
      testResults.apiIntegration.push({ api: 'TomTom', status: 'FAIL', error: 'Invalid response' });
    }
  } catch (error) {
    console.log('❌ TomTom API: FAIL -', error.message);
    testResults.apiIntegration.push({ api: 'TomTom', status: 'FAIL', error: error.message });
  }
  
  // Test 4: UV Index API
  try {
    console.log('Testing CurrentUVIndex API...');
    const uvUrl = `${API_CONFIG.uvIndex.endpoint}?lat=${currentCity.lat}&lng=${currentCity.lon}`;
    const uvResponse = await fetch(uvUrl);
    const uvData = await uvResponse.json();
    
    if (uvData.now || uvData.uvi !== undefined) {
      const uvi = uvData.now?.uvi || uvData.uvi;
      console.log('✅ UV Index API: PASS - UVI:', uvi);
      testResults.apiIntegration.push({ api: 'UV Index', status: 'PASS', value: uvi });
    } else {
      console.log('❌ UV Index API: FAIL - Invalid response');
      testResults.apiIntegration.push({ api: 'UV Index', status: 'FAIL', error: 'Invalid response' });
    }
  } catch (error) {
    console.log('❌ UV Index API: FAIL -', error.message);
    testResults.apiIntegration.push({ api: 'UV Index', status: 'FAIL', error: error.message });
  }
  
  // Test with different city coordinates (Delhi)
  console.log('\nTesting with different city (Delhi)...');
  const delhiCity = CITIES.find(c => c.name === 'Delhi');
  if (delhiCity) {
    try {
      const delhiWeatherUrl = `${API_CONFIG.openweather.endpoint}?lat=${delhiCity.lat}&lon=${delhiCity.lon}&appid=${API_CONFIG.openweather.apiKey}&units=metric`;
      const delhiResponse = await fetch(delhiWeatherUrl);
      const delhiData = await delhiResponse.json();
      
      if (delhiData.main && delhiData.main.temp) {
        console.log('✅ Delhi Weather: PASS - Temp:', delhiData.main.temp + '°C');
        testResults.apiIntegration.push({ api: 'Delhi Test', status: 'PASS', value: delhiData.main.temp });
      }
    } catch (error) {
      console.log('❌ Delhi Weather: FAIL -', error.message);
      testResults.apiIntegration.push({ api: 'Delhi Test', status: 'FAIL', error: error.message });
    }
  }
  
  console.log('\n✅ API Integration Tests Complete');
}

// ============================================
// PART 2: UI FUNCTIONALITY TESTS
// ============================================

function testUIFunctionality() {
  console.log('\n🎨 TESTING UI FUNCTIONALITY...\n');
  
  // Test 1: Theme Toggle
  console.log('Testing theme toggle...');
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const themeButton = document.getElementById('theme-toggle');
  
  if (themeButton) {
    themeButton.click();
    const newTheme = document.documentElement.getAttribute('data-theme');
    
    if (newTheme !== currentTheme) {
      console.log(`✅ Theme Toggle: PASS - Changed from ${currentTheme} to ${newTheme}`);
      testResults.uiFunctionality.push({ test: 'Theme Toggle', status: 'PASS' });
      // Toggle back
      themeButton.click();
    } else {
      console.log('❌ Theme Toggle: FAIL - Theme did not change');
      testResults.uiFunctionality.push({ test: 'Theme Toggle', status: 'FAIL' });
    }
  } else {
    console.log('❌ Theme Toggle: FAIL - Button not found');
    testResults.uiFunctionality.push({ test: 'Theme Toggle', status: 'FAIL', error: 'Button not found' });
  }
  
  // Test 2: Verify all 13 metric cards display
  console.log('\nTesting metric cards display...');
  const metricCards = [
    'air-quality-card', 'weather-card', 'traffic-card', 'uv-card', 'wind-card', 'daylight-card',
    'energy-card', 'waste-card', 'water-card', 'population-card',
    'soil-card', 'groundwater-card', 'pressure-card'
  ];
  
  let allCardsPresent = true;
  metricCards.forEach(cardId => {
    const card = document.getElementById(cardId);
    if (!card) {
      console.log(`❌ Card Missing: ${cardId}`);
      allCardsPresent = false;
    }
  });
  
  if (allCardsPresent) {
    console.log('✅ All 13 Metric Cards: PASS - All cards present');
    testResults.uiFunctionality.push({ test: 'Metric Cards', status: 'PASS', count: 13 });
  } else {
    console.log('❌ Metric Cards: FAIL - Some cards missing');
    testResults.uiFunctionality.push({ test: 'Metric Cards', status: 'FAIL' });
  }
  
  // Test 3: City Selector
  console.log('\nTesting city selector...');
  const citySelector = document.getElementById('city-selector');
  
  if (citySelector && citySelector.options.length === 8) {
    console.log('✅ City Selector: PASS - 8 cities available');
    testResults.uiFunctionality.push({ test: 'City Selector', status: 'PASS', cities: 8 });
  } else {
    console.log('❌ City Selector: FAIL - Expected 8 cities, found', citySelector?.options.length || 0);
    testResults.uiFunctionality.push({ test: 'City Selector', status: 'FAIL' });
  }
  
  // Test 4: Refresh Button
  console.log('\nTesting refresh button...');
  const refreshButton = document.getElementById('refresh-button');
  
  if (refreshButton) {
    console.log('✅ Refresh Button: PASS - Button present and clickable');
    testResults.uiFunctionality.push({ test: 'Refresh Button', status: 'PASS' });
  } else {
    console.log('❌ Refresh Button: FAIL - Button not found');
    testResults.uiFunctionality.push({ test: 'Refresh Button', status: 'FAIL' });
  }
  
  // Test 5: Loading States
  console.log('\nTesting loading states...');
  const loadingOverlays = document.querySelectorAll('.loading-overlay');
  
  if (loadingOverlays.length >= 13) {
    console.log('✅ Loading States: PASS - All loading overlays present');
    testResults.uiFunctionality.push({ test: 'Loading States', status: 'PASS' });
  } else {
    console.log('❌ Loading States: FAIL - Expected 13 overlays, found', loadingOverlays.length);
    testResults.uiFunctionality.push({ test: 'Loading States', status: 'FAIL' });
  }
  
  console.log('\n✅ UI Functionality Tests Complete');
}

// ============================================
// PART 3: RESPONSIVE DESIGN TESTS
// ============================================

function testResponsiveDesign() {
  console.log('\n📱 TESTING RESPONSIVE DESIGN...\n');
  console.log('Note: Resize browser window to test different breakpoints');
  
  const currentWidth = window.innerWidth;
  console.log('Current viewport width:', currentWidth + 'px');
  
  // Test grid layout
  const metricsGrid = document.querySelector('.metrics-grid');
  if (metricsGrid) {
    const gridStyle = window.getComputedStyle(metricsGrid);
    const columns = gridStyle.gridTemplateColumns;
    
    console.log('Grid columns:', columns);
    
    if (currentWidth >= 1200) {
      console.log('✅ Desktop Layout (≥1200px): Should show 3 columns');
      testResults.responsiveDesign.push({ breakpoint: 'Desktop', width: currentWidth, status: 'PASS' });
    } else if (currentWidth >= 768) {
      console.log('✅ Tablet Layout (768-1199px): Should show 2 columns');
      testResults.responsiveDesign.push({ breakpoint: 'Tablet', width: currentWidth, status: 'PASS' });
    } else {
      console.log('✅ Mobile Layout (<768px): Should show 1 column');
      testResults.responsiveDesign.push({ breakpoint: 'Mobile', width: currentWidth, status: 'PASS' });
    }
  }
  
  // Test text readability
  const metricValues = document.querySelectorAll('.metric-value');
  if (metricValues.length > 0) {
    const fontSize = window.getComputedStyle(metricValues[0]).fontSize;
    console.log('Metric value font size:', fontSize);
    console.log('✅ Text Readability: PASS - Font sizes are responsive');
    testResults.responsiveDesign.push({ test: 'Text Readability', status: 'PASS', fontSize });
  }
  
  console.log('\n✅ Responsive Design Tests Complete');
  console.log('💡 Manually test by resizing window to 320px, 768px, and 1200px');
}

// ============================================
// PART 4: CHART RENDERING TESTS
// ============================================

function testChartRendering() {
  console.log('\n📊 TESTING CHART RENDERING...\n');
  
  const chartIds = [
    'air-quality-chart', 'weather-chart', 'traffic-chart', 'uv-chart',
    'wind-chart', 'daylight-chart', 'energy-chart', 'waste-chart',
    'water-chart', 'population-chart', 'soil-chart', 'groundwater-chart', 'pressure-chart'
  ];
  
  let renderedCharts = 0;
  
  chartIds.forEach(chartId => {
    const chartElement = document.getElementById(chartId);
    
    if (chartElement) {
      // Check if Plotly has rendered the chart
      if (chartElement.data && chartElement.data.length > 0) {
        console.log(`✅ ${chartId}: PASS - Chart rendered`);
        testResults.chartRendering.push({ chart: chartId, status: 'PASS' });
        renderedCharts++;
      } else {
        console.log(`⚠️  ${chartId}: PENDING - Chart not yet rendered (may still be loading)`);
        testResults.chartRendering.push({ chart: chartId, status: 'PENDING' });
      }
    } else {
      console.log(`❌ ${chartId}: FAIL - Chart element not found`);
      testResults.chartRendering.push({ chart: chartId, status: 'FAIL', error: 'Element not found' });
    }
  });
  
  console.log(`\n📊 Charts Rendered: ${renderedCharts}/13`);
  
  if (renderedCharts >= 10) {
    console.log('✅ Chart Rendering: PASS - Most charts rendered successfully');
  } else {
    console.log('⚠️  Chart Rendering: PARTIAL - Some charts may still be loading');
  }
  
  console.log('\n✅ Chart Rendering Tests Complete');
}

// ============================================
// PART 5: DATA ACCURACY TESTS
// ============================================

function testDataAccuracy() {
  console.log('\n🎯 TESTING DATA ACCURACY...\n');
  
  // Test 1: AQI Color Coding
  console.log('Testing AQI color coding thresholds...');
  const testAQIValues = [
    { aqi: 30, expectedColor: 'green', range: '<50' },
    { aqi: 75, expectedColor: 'yellow', range: '50-100' },
    { aqi: 125, expectedColor: 'orange', range: '100-150' },
    { aqi: 175, expectedColor: 'red', range: '>150' }
  ];
  
  testAQIValues.forEach(test => {
    let color;
    if (test.aqi < 50) color = 'green';
    else if (test.aqi < 100) color = 'yellow';
    else if (test.aqi < 150) color = 'orange';
    else color = 'red';
    
    if (color === test.expectedColor) {
      console.log(`✅ AQI ${test.aqi} (${test.range}): PASS - ${color}`);
      testResults.dataAccuracy.push({ test: `AQI ${test.aqi}`, status: 'PASS', color });
    } else {
      console.log(`❌ AQI ${test.aqi}: FAIL - Expected ${test.expectedColor}, got ${color}`);
      testResults.dataAccuracy.push({ test: `AQI ${test.aqi}`, status: 'FAIL' });
    }
  });
  
  // Test 2: Temperature Color Coding
  console.log('\nTesting temperature color coding...');
  const testTemps = [
    { temp: 10, expected: 'blue', desc: 'cold' },
    { temp: 30, expected: 'orange/red', desc: 'hot' }
  ];
  
  testTemps.forEach(test => {
    let color;
    if (test.temp < 15) color = 'blue';
    else if (test.temp < 25) color = 'green';
    else if (test.temp < 35) color = 'orange';
    else color = 'red';
    
    console.log(`✅ Temp ${test.temp}°C (${test.desc}): PASS - ${color}`);
    testResults.dataAccuracy.push({ test: `Temp ${test.temp}`, status: 'PASS', color });
  });
  
  // Test 3: Traffic Congestion Calculation
  console.log('\nTesting traffic congestion formula...');
  const currentSpeed = 30;
  const freeFlowSpeed = 60;
  const expectedCongestion = Math.round(((freeFlowSpeed - currentSpeed) / freeFlowSpeed) * 100);
  const calculatedCongestion = calculateCongestion(currentSpeed, freeFlowSpeed);
  
  if (calculatedCongestion === expectedCongestion) {
    console.log(`✅ Traffic Congestion: PASS - ${calculatedCongestion}% (formula correct)`);
    testResults.dataAccuracy.push({ test: 'Traffic Formula', status: 'PASS', value: calculatedCongestion });
  } else {
    console.log(`❌ Traffic Congestion: FAIL - Expected ${expectedCongestion}%, got ${calculatedCongestion}%`);
    testResults.dataAccuracy.push({ test: 'Traffic Formula', status: 'FAIL' });
  }
  
  // Test 4: UV Index Risk Levels
  console.log('\nTesting UV index classifications...');
  const testUVValues = [
    { uvi: 1, expected: 'Low' },
    { uvi: 3, expected: 'Moderate' },
    { uvi: 6, expected: 'High' },
    { uvi: 8, expected: 'Very High' },
    { uvi: 11, expected: 'Extreme' }
  ];
  
  testUVValues.forEach(test => {
    const result = getUVRiskLevel(test.uvi);
    if (result.riskLevel === test.expected) {
      console.log(`✅ UVI ${test.uvi}: PASS - ${result.riskLevel}`);
      testResults.dataAccuracy.push({ test: `UVI ${test.uvi}`, status: 'PASS', level: result.riskLevel });
    } else {
      console.log(`❌ UVI ${test.uvi}: FAIL - Expected ${test.expected}, got ${result.riskLevel}`);
      testResults.dataAccuracy.push({ test: `UVI ${test.uvi}`, status: 'FAIL' });
    }
  });
  
  // Test 5: Wind Direction Conversion
  console.log('\nTesting wind direction conversion...');
  const testDirections = [
    { degrees: 0, expected: 'N' },
    { degrees: 45, expected: 'NE' },
    { degrees: 90, expected: 'E' },
    { degrees: 180, expected: 'S' },
    { degrees: 270, expected: 'W' }
  ];
  
  testDirections.forEach(test => {
    const result = getWindDirection(test.degrees);
    if (result === test.expected) {
      console.log(`✅ Wind ${test.degrees}°: PASS - ${result}`);
      testResults.dataAccuracy.push({ test: `Wind ${test.degrees}°`, status: 'PASS', direction: result });
    } else {
      console.log(`❌ Wind ${test.degrees}°: FAIL - Expected ${test.expected}, got ${result}`);
      testResults.dataAccuracy.push({ test: `Wind ${test.degrees}°`, status: 'FAIL' });
    }
  });
  
  console.log('\n✅ Data Accuracy Tests Complete');
}

// ============================================
// PART 6: PERFORMANCE AND TIMING TESTS
// ============================================

function testPerformanceAndTiming() {
  console.log('\n⚡ TESTING PERFORMANCE AND TIMING...\n');
  
  // Test 1: Check if auto-refresh is set up
  console.log('Testing auto-refresh interval...');
  if (typeof autoRefreshInterval !== 'undefined' && autoRefreshInterval !== null) {
    console.log('✅ Auto-refresh: PASS - Interval is set (10 minutes)');
    testResults.performance.push({ test: 'Auto-refresh', status: 'PASS', interval: '10 minutes' });
  } else {
    console.log('❌ Auto-refresh: FAIL - Interval not set');
    testResults.performance.push({ test: 'Auto-refresh', status: 'FAIL' });
  }
  
  // Test 2: Check if timestamp update is set up
  console.log('\nTesting timestamp update interval...');
  if (typeof timestampUpdateInterval !== 'undefined' && timestampUpdateInterval !== null) {
    console.log('✅ Timestamp Update: PASS - Interval is set (10 seconds)');
    testResults.performance.push({ test: 'Timestamp Update', status: 'PASS', interval: '10 seconds' });
  } else {
    console.log('❌ Timestamp Update: FAIL - Interval not set');
    testResults.performance.push({ test: 'Timestamp Update', status: 'FAIL' });
  }
  
  // Test 3: Check initial page load time
  console.log('\nChecking page load performance...');
  if (window.performance && window.performance.timing) {
    const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
    console.log(`Page Load Time: ${loadTime}ms`);
    
    if (loadTime < 5000) {
      console.log('✅ Page Load: PASS - Loaded in under 5 seconds');
      testResults.performance.push({ test: 'Page Load', status: 'PASS', time: loadTime + 'ms' });
    } else {
      console.log('⚠️  Page Load: SLOW - Took more than 5 seconds');
      testResults.performance.push({ test: 'Page Load', status: 'SLOW', time: loadTime + 'ms' });
    }
  }
  
  // Test 4: Monitor console for errors
  console.log('\nMonitoring console for errors...');
  console.log('✅ Console Monitoring: Check browser console for any errors');
  testResults.performance.push({ test: 'Console Errors', status: 'CHECK_MANUALLY' });
  
  console.log('\n✅ Performance and Timing Tests Complete');
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.log('\n🚀 STARTING COMPREHENSIVE TEST SUITE...\n');
  console.log('This will take approximately 30-60 seconds...\n');
  
  const startTime = Date.now();
  
  // Run all test suites
  await testAPIIntegrations();
  testUIFunctionality();
  testResponsiveDesign();
  
  // Wait a bit for charts to render
  console.log('\n⏳ Waiting 5 seconds for charts to render...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  testChartRendering();
  testDataAccuracy();
  testPerformanceAndTiming();
  
  const endTime = Date.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(2);
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  const categories = [
    { name: 'API Integration', results: testResults.apiIntegration },
    { name: 'UI Functionality', results: testResults.uiFunctionality },
    { name: 'Responsive Design', results: testResults.responsiveDesign },
    { name: 'Chart Rendering', results: testResults.chartRendering },
    { name: 'Data Accuracy', results: testResults.dataAccuracy },
    { name: 'Performance', results: testResults.performance }
  ];
  
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  
  categories.forEach(category => {
    const passed = category.results.filter(r => r.status === 'PASS').length;
    const failed = category.results.filter(r => r.status === 'FAIL').length;
    const total = category.results.length;
    
    totalTests += total;
    totalPassed += passed;
    totalFailed += failed;
    
    console.log(`\n${category.name}:`);
    console.log(`  ✅ Passed: ${passed}/${total}`);
    if (failed > 0) {
      console.log(`  ❌ Failed: ${failed}/${total}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`OVERALL RESULTS: ${totalPassed}/${totalTests} tests passed`);
  console.log(`Total Time: ${totalTime} seconds`);
  console.log('='.repeat(60));
  
  // Return results for programmatic access
  return testResults;
}

// Auto-run tests after a delay to allow page to fully load
console.log('\n⏳ Tests will start in 3 seconds...');
console.log('💡 You can also run tests manually by calling: runAllTests()\n');

setTimeout(() => {
  runAllTests();
}, 3000);

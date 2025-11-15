const API_CONFIG = {
  aqicn: {
    token: '58ddd9cd5b3787eabfe27df1e4ffced506929c4d',
    endpoint: 'https://api.waqi.info/feed/geo:'
  },
  openweather: {
    apiKey: '61c54134f8a6915a1e62cf9ef3167f22',
    endpoint: 'https://api.openweathermap.org/data/2.5/weather',
    oneCallEndpoint: 'https://api.openweathermap.org/data/3.0/onecall'
  },
  tomtom: {
    apiKey: 's4jQWWbIPPKpJxrK9wAceyDIk3zVeEei',
    endpoint: 'https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json'
  },
  uvIndex: {
    endpoint: 'https://currentuvindex.com/api/v1/uvi',
    requiresKey: false
  },
  apiNinjas: {
    apiKey: '+tJzk92xnrol7SKaTZAMcw==0uDErLKJ35ZnRlDc',
    endpoint: 'https://api.api-ninjas.com/v1/city'
  },
  agromonitoring: {
    apiKey: '6da17c89999d63c31c2324d23bec6981',
    endpoint: 'https://api.agromonitoring.com/agro/1.0/soil'
  },
  geocoding: {
    endpoint: 'https://api.openweathermap.org/geo/1.0/direct'
  },
  openMeteo: {
    geocodingEndpoint: 'https://geocoding-api.open-meteo.com/v1/search'
  }
};

const CITIES = [
  { name: 'Bangalore', lat: 12.9716, lon: 77.5946 }
];

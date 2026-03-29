// ========================================
// WEATHER DASHBOARD - JAVASCRIPT
// REST API Implementation using Fetch
// ========================================

// API Configuration - OpenWeatherMap Public API
const API_KEY = 'c27e00e7a6d4126a06fb9460bd154750'; // Get free key from openweathermap.org
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Default cities array (3 cities as per requirement)
const defaultCities = ['London', 'New York', 'Tokyo'];

// Weather data storage using array (non-primitive/mutable)
let weatherDataArray = [];

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherContainer = document.getElementById('weatherCardsContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorAlert = document.getElementById('errorAlert');
const errorMessage = document.getElementById('errorMessage');

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        handleSearch();
    }
});

// Initialize Dashboard - Load default cities
function initDashboard() {
    console.log('Initializing Weather Dashboard...');
    loadDefaultCities();
}

// Load default cities on page load
async function loadDefaultCities() {
    showLoading(true);
    hideError();
    
    // Clear previous data
    weatherDataArray = [];
    
    // Fetch weather for all default cities
    for (let i = 0; i < defaultCities.length; i++) {
        await fetchWeatherData(defaultCities[i]);
    }
    
    // Display all weather cards
    displayWeatherCards();
    showLoading(false);
}

// Handle Search Button Click
async function handleSearch() {
    const city = cityInput.value.trim();
    
    // Validation
    if (city === '') {
        showError('Please enter a city name!');
        return;
    }
    
    showLoading(true);
    hideError();
    
    // Clear previous data
    weatherDataArray = [];
    
    // Fetch weather for searched city
    await fetchWeatherData(city);
    
    // Display weather card
    displayWeatherCards();
    showLoading(false);
    
    // Clear input
    cityInput.value = '';
}

// Fetch Weather Data using REST API (GET request)
async function fetchWeatherData(cityName) {
    try {
        // REST API Call 1: Get Current Weather Data (JSON format)
        const weatherURL = `${BASE_URL}/weather?q=${cityName}&appid=${API_KEY}&units=metric`;
        
        console.log(`Fetching weather data for: ${cityName}`);
        
        const weatherResponse = await fetch(weatherURL);
        
        // Check if response is ok (status 200-299)
        if (!weatherResponse.ok) {
            throw new Error(`City "${cityName}" not found!`);
        }
        
        // Convert response to JSON
        const weatherData = await weatherResponse.json();
        
        // REST API Call 2: Get Air Quality Index (AQI)
        const lat = weatherData.coord.lat;
        const lon = weatherData.coord.lon;
        const aqiURL = `${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
        
        const aqiResponse = await fetch(aqiURL);
        const aqiData = await aqiResponse.json();
        
        // Create weather object and store in array
        const cityWeather = {
            city: weatherData.name,
            country: weatherData.sys.country,
            temperature: Math.round(weatherData.main.temp),
            feelsLike: Math.round(weatherData.main.feels_like),
            humidity: weatherData.main.humidity,
            pressure: weatherData.main.pressure,
            windSpeed: weatherData.wind.speed,
            description: weatherData.weather[0].description,
            icon: weatherData.weather[0].icon,
            aqi: aqiData.list[0].main.aqi
        };
        
        // Push object to array
        weatherDataArray.push(cityWeather);
        
        console.log('Weather data fetched successfully:', cityWeather);
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError(error.message);
    }
}

// Display Weather Cards dynamically
function displayWeatherCards() {
    // Clear container
    weatherContainer.innerHTML = '';
    
    // Check if array is empty
    if (weatherDataArray.length === 0) {
        weatherContainer.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-warning" role="alert">
                    <i class="bi bi-exclamation-circle"></i> No weather data available
                </div>
            </div>
        `;
        return;
    }
    
    // Loop through array and create cards
    weatherDataArray.forEach(function(data) {
        const cardHTML = createWeatherCard(data);
        weatherContainer.innerHTML += cardHTML;
    });
}

// Create Weather Card HTML (Template Literal)
function createWeatherCard(data) {
    const aqiInfo = getAQIInfo(data.aqi);
    
    // Using template literals (backticks) with ${} for variables
    return `
        <div class="col-md-4">
            <div class="weather-card">
                <!-- City Header -->
                <div class="city-header">
                    <h2 class="city-name">${data.city}</h2>
                    <p class="country-code">${data.country}</p>
                </div>
                
                <!-- Weather Main Info -->
                <div class="weather-main">
                    <img src="https://openweathermap.org/img/wn/${data.icon}@4x.png" 
                         alt="${data.description}" 
                         class="weather-icon">
                    <div class="temperature">${data.temperature}°C</div>
                    <div class="weather-description">${data.description}</div>
                </div>
                
                <!-- Weather Details -->
                <div class="weather-details">
                    <div class="detail-row">
                        <span class="detail-label">
                            <i class="bi bi-thermometer-half"></i> Feels Like
                        </span>
                        <span class="detail-value">${data.feelsLike}°C</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">
                            <i class="bi bi-droplet-fill"></i> Humidity
                        </span>
                        <span class="detail-value">${data.humidity}%</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">
                            <i class="bi bi-wind"></i> Wind Speed
                        </span>
                        <span class="detail-value">${data.windSpeed} m/s</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">
                            <i class="bi bi-speedometer2"></i> Pressure
                        </span>
                        <span class="detail-value">${data.pressure} hPa</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">
                            <i class="bi bi-cloud-haze"></i> Air Quality
                        </span>
                        <span class="detail-value">
                            <span class="aqi-badge ${aqiInfo.class}">${aqiInfo.text}</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Get AQI Information (Air Quality Index)
function getAQIInfo(aqiValue) {
    // Object to store AQI levels
    const aqiLevels = {
        1: { text: 'Good', class: 'aqi-good' },
        2: { text: 'Fair', class: 'aqi-fair' },
        3: { text: 'Moderate', class: 'aqi-moderate' },
        4: { text: 'Poor', class: 'aqi-poor' },
        5: { text: 'Very Poor', class: 'aqi-very-poor' }
    };
    
    // Return AQI info or default
    return aqiLevels[aqiValue] || { text: 'Unknown', class: 'aqi-moderate' };
}

// Show Loading Spinner
function showLoading(show) {
    if (show === true) {
        loadingSpinner.classList.remove('d-none');
    } else {
        loadingSpinner.classList.add('d-none');
    }
}

// Show Error Message
function showError(message) {
    errorMessage.textContent = message;
    errorAlert.classList.remove('d-none');
}

// Hide Error Message
function hideError() {
    errorAlert.classList.add('d-none');
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);

// Console log for debugging
console.log('Weather Dashboard Script Loaded');
console.log('typeof weatherDataArray:', typeof weatherDataArray);
console.log('API Configuration:', {
    baseURL: BASE_URL,
    hasAPIKey: API_KEY !== 'YOUR_API_KEY_HERE'
});
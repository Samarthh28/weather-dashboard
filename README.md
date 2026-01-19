# weather-dashboard
Weather_Dashboard
# 🌦️ Weather Dashboard

A modern, responsive **Weather Dashboard web application** built using **HTML, CSS, and JavaScript**.  
It fetches real-time weather data from the **OpenWeather API** and displays current conditions along with a 5-day forecast.

---

## 🚀 Features
- Search weather by city name
- Use current location (Geolocation)
- Current weather details
- 5-day weather forecast
- °C / °F temperature toggle
- Dynamic weather icons & background
- Recent search history (LocalStorage)
- Fully responsive & modern UI

---

## 🛠️ Tech Stack
- HTML5  
- CSS3  
- JavaScript (ES6)  
- OpenWeather REST API  

---

## 🔑 API Key Setup (Required)
This project uses the **OpenWeather API**.  
For security reasons, the API key is **not included** in this repository.

### Step 1: Get an API Key
1. Go to https://openweathermap.org/
2. Create an account or log in
3. Navigate to **Profile → My API Keys**
4. Copy your API key

### Step 2: Add the API Key
Open the file `app.js` and replace the placeholder:

```js
const API_KEY = "YOUR_API_KEY";

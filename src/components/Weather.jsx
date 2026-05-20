import React, { useEffect, useRef, useState } from "react";
import "./Weather.css";
import search_icon from "../assets/search.png";
import clear_icon from "../assets/clear.png";
import cloud_icon from "../assets/cloud.png";
import drizzle_icon from "../assets/drizzle.png";
import humidity_icon from "../assets/humidity.png";
import rain_icon from "../assets/rain.png";
import snow_icon from "../assets/snow.png";
import wind_icon from "../assets/wind.png";

const Weather = () => {
  const inputRef = useRef();
  const [weatherData, setWeatherData] = useState(null);

  const allIcons = {
    clear: clear_icon,
    cloud: cloud_icon,
    drizzle: drizzle_icon,
    rain: rain_icon,
    snow: snow_icon,
  };

  const getIconFromCode = (code) => {
    // Open-Meteo weathercode mapping
    // 0: Clear, 1-3: Mainly clear to overcast, 45-48: Fog, 51-67: Drizzle/Rain, 71-77: Snow, 80-82: Rain showers, 95-99: Thunderstorm
    if (code === 0) return allIcons.clear;
    if (code >= 1 && code <= 3) return allIcons.cloud;
    if (code === 45 || code === 48) return allIcons.drizzle;
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)) return allIcons.rain;
    if (code >= 71 && code <= 77) return allIcons.snow;
    return allIcons.clear;
  };

  const search = async (city) => {
    if (!city || city.trim() === "") {
      alert("Ingresar la Ciudad a Buscar");
      return;
    }

    try {
      // 1) Geocoding using Open-Meteo geocoding API (no key required)
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        city
      )}&count=1`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
      if (!geoRes.ok || !geoData.results || geoData.results.length === 0) {
        alert('Ciudad no encontrada');
        setWeatherData(null);
        return;
      }

      const place = geoData.results[0];
      const { latitude, longitude, name, country } = place;

      // 2) Current weather from Open-Meteo. Request hourly humidity to get current humidity value.
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m&temperature_unit=celsius&windspeed_unit=kmh&timezone=auto`;
      const weatherRes = await fetch(weatherUrl);
      const weatherDataRaw = await weatherRes.json();
      if (!weatherRes.ok || !weatherDataRaw.current_weather) {
        alert('No se pudieron obtener datos meteorológicos');
        setWeatherData(null);
        return;
      }

      const cw = weatherDataRaw.current_weather;
      // find current humidity from hourly arrays by matching time
      let humidity = null;
      if (weatherDataRaw.hourly && weatherDataRaw.hourly.time && weatherDataRaw.hourly.relativehumidity_2m) {
        const idx = weatherDataRaw.hourly.time.indexOf(cw.time);
        if (idx !== -1) humidity = weatherDataRaw.hourly.relativehumidity_2m[idx];
      }

      const icon = getIconFromCode(cw.weathercode);
      setWeatherData({
        humidity: humidity !== null ? humidity : 'N/A',
        windSpeed: cw.windspeed,
        temperature: Math.round(cw.temperature),
        location: `${name}${country ? ', ' + country : ''}`,
        icon: icon,
      });
    } catch (error) {
      setWeatherData(null);
      console.error(error);
      alert('Error al consultar el servicio. Revisa la consola para más detalles.');
    }
  };

  useEffect(() => {
    search("Tucuman");
  }, []);

  return (
    <div className="weather">
      <div className="search-bar">
        <input ref={inputRef} type="text" placeholder="Search" />
        <img
          src={search_icon}
          alt="clear icon"
          onClick={() => search(inputRef.current.value)}
        />
      </div>

      {weatherData ? (
        <>
          <img
            src={weatherData.icon}
            alt="clear icon"
            className="weather-icon"
          />
          <p className="temperature">{weatherData.temperature}°C</p>
          <p className="location">{weatherData.location}</p>
          <div className="weather-data">
            <div className="col">
              <img src={humidity_icon} alt="humidity icon" />
              <div>
                <p>{weatherData.humidity}</p>
                <span>Humidity</span>
              </div>
            </div>
            <div className="col">
              <img src={wind_icon} alt="wind icon" />
              <div>
                <p>{weatherData.windSpeed}</p>
                <span>Wind Speed</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="no-data">
          <p>No hay datos disponibles.</p>
          {!import.meta.env.VITE_APP_ID && (
            <p className="hint">Configura `VITE_APP_ID` en un `.env`.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Weather;

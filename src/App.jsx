import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [city, setCity] = useState('Karachi')
  const [searchCity, setSearchCity] = useState('Karachi')
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [useGeo, setUseGeo] = useState(false)

  const weatherCodes = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Drizzle',
    55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Showers',
    81: 'Heavy showers', 82: 'Violent showers', 95: 'Thunderstorm',
    96: 'Thunderstorm + hail', 99: 'Thunderstorm + heavy hail'
  }

  const fetchWeather = async (lat, lon, name) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=5`
      )
      const data = await res.json()
      setWeather({
        ...data.current,
        city: name || city
      })
      setForecast(data.daily)
    } catch (e) {
      setError('Failed to fetch weather data')
    }
    setLoading(false)
  }

  const search = async () => {
    if (!searchCity.trim()) return
    setLoading(true)
    setError('')
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchCity)}&count=1`)
      const geoData = await geoRes.json()
      if (!geoData.results || geoData.results.length === 0) {
        setError('City not found')
        setLoading(false)
        return
      }
      const { latitude, longitude, name, country } = geoData.results[0]
      setCity(`${name}, ${country}`)
      fetchWeather(latitude, longitude, `${name}, ${country}`)
    } catch (e) {
      setError('Search failed')
      setLoading(false)
    }
  }

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      return
    }
    setUseGeo(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&language=en&format=json`)
          const data = await res.json()
          const name = data.results?.[0]?.name || 'Your Location'
          setCity(name)
          setSearchCity(name)
          fetchWeather(pos.coords.latitude, pos.coords.longitude, name)
        } catch {
          fetchWeather(pos.coords.latitude, pos.coords.longitude, 'Your Location')
        }
      },
      () => setError('Location access denied')
    )
  }

  useEffect(() => {
    search()
  }, [])

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="app">
      <div className={`card ${loading ? 'loading' : ''}`}>
        <div className="search-bar">
          <input
            type="text"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Search city..."
          />
          <button onClick={search}>🔍</button>
          <button onClick={detectLocation} title="Use my location">📍</button>
        </div>
        {error && <div className="error">{error}</div>}
        {weather && (
          <div className="weather">
            <div className="city">{weather.city}</div>
            <div className="temp">{Math.round(weather.temperature_2m)}°C</div>
            <div className="desc">{weatherCodes[weather.weather_code] || 'Unknown'}</div>
            <div className="details">
              <div className="detail">
                <div className="label">Humidity</div>
                <div className="value">{weather.relative_humidity_2m}%</div>
              </div>
              <div className="detail">
                <div className="label">Wind</div>
                <div className="value">{Math.round(weather.wind_speed_10m)} km/h</div>
              </div>
              <div className="detail">
                <div className="label">Feels Like</div>
                <div className="value">{Math.round(weather.apparent_temperature)}°C</div>
              </div>
            </div>
            {forecast.time && (
              <div className="forecast">
                {forecast.time.map((d, i) => {
                  const date = new Date(d)
                  return (
                    <div key={i} className="forecast-day">
                      <div className="day-name">{i === 0 ? 'Today' : days[date.getDay()]}</div>
                      <div className="day-temp">{Math.round(forecast.temperature_2m_max[i])}°</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App

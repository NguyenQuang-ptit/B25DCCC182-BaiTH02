import { useEffect, useMemo, useState } from 'react'
import './App.css'

type City = {
  id: string
  name: string
  latitude: number
  longitude: number
}

type WeatherResponse = {
  current: {
    time: string
    temperature_2m: number
    relative_humidity_2m: number
    wind_speed_10m: number
    weather_code: number
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
  }
  timezone: string
}

type Unit = 'C' | 'F'

type WeatherMeta = {
  label: string
  icon: string
  gradient: string
}

const CITIES: City[] = [
  { id: 'hanoi', name: 'Hà Nội', latitude: 21.0285, longitude: 105.8542 },
  { id: 'haiphong', name: 'Hải Phòng', latitude: 20.8449, longitude: 106.6881 },
  { id: 'hue', name: 'Huế', latitude: 16.4637, longitude: 107.5909 },
  { id: 'danang', name: 'Đà Nẵng', latitude: 16.0544, longitude: 108.2022 },
  { id: 'nhatrang', name: 'Nha Trang', latitude: 12.2388, longitude: 109.1967 },
  { id: 'dalat', name: 'Đà Lạt', latitude: 11.9404, longitude: 108.4583 },
  { id: 'hcm', name: 'TP. Hồ Chí Minh', latitude: 10.8231, longitude: 106.6297 },
  { id: 'cantho', name: 'Cần Thơ', latitude: 10.0452, longitude: 105.7469 },
]

const WEATHER_META: Record<number, WeatherMeta> = {
  0: { label: 'Trời quang', icon: '☀️', gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)' },
  1: { label: 'Phần lớn nắng', icon: '🌤️', gradient: 'linear-gradient(135deg, #fcd34d, #f59e0b)' },
  2: { label: 'Có mây', icon: '⛅', gradient: 'linear-gradient(135deg, #93c5fd, #60a5fa)' },
  3: { label: 'Nhiều mây', icon: '☁️', gradient: 'linear-gradient(135deg, #cbd5e1, #94a3b8)' },
  45: { label: 'Sương mù', icon: '🌫️', gradient: 'linear-gradient(135deg, #cbd5e1, #94a3b8)' },
  48: { label: 'Sương mù đóng băng', icon: '🌫️', gradient: 'linear-gradient(135deg, #dbeafe, #93c5fd)' },
  51: { label: 'Mưa nhẹ', icon: '🌦️', gradient: 'linear-gradient(135deg, #7dd3fc, #38bdf8)' },
  53: { label: 'Mưa nhẹ', icon: '🌦️', gradient: 'linear-gradient(135deg, #7dd3fc, #38bdf8)' },
  55: { label: 'Mưa vừa', icon: '🌧️', gradient: 'linear-gradient(135deg, #60a5fa, #2563eb)' },
  56: { label: 'Mưa lạnh', icon: '🌧️', gradient: 'linear-gradient(135deg, #7dd3fc, #1d4ed8)' },
  57: { label: 'Mưa lạnh', icon: '🌧️', gradient: 'linear-gradient(135deg, #7dd3fc, #1d4ed8)' },
  61: { label: 'Mưa nhỏ', icon: '🌦️', gradient: 'linear-gradient(135deg, #60a5fa, #2563eb)' },
  63: { label: 'Mưa vừa', icon: '🌧️', gradient: 'linear-gradient(135deg, #60a5fa, #2563eb)' },
  65: { label: 'Mưa nhiều', icon: '🌧️', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
  66: { label: 'Mưa lạnh', icon: '🌧️', gradient: 'linear-gradient(135deg, #60a5fa, #1d4ed8)' },
  67: { label: 'Mưa lạnh', icon: '🌧️', gradient: 'linear-gradient(135deg, #60a5fa, #1d4ed8)' },
  71: { label: 'Tuyết nhẹ', icon: '🌨️', gradient: 'linear-gradient(135deg, #dbeafe, #bfdbfe)' },
  73: { label: 'Tuyết vừa', icon: '❄️', gradient: 'linear-gradient(135deg, #e0f2fe, #bfdbfe)' },
  75: { label: 'Tuyết rơi', icon: '❄️', gradient: 'linear-gradient(135deg, #dbeafe, #93c5fd)' },
  77: { label: 'Mưa đá', icon: '🌧️', gradient: 'linear-gradient(135deg, #c7d2fe, #a5b4fc)' },
  80: { label: 'Mưa rào', icon: '🌦️', gradient: 'linear-gradient(135deg, #38bdf8, #2563eb)' },
  81: { label: 'Mưa rào', icon: '🌧️', gradient: 'linear-gradient(135deg, #38bdf8, #1d4ed8)' },
  82: { label: 'Mưa rào mạnh', icon: '⛈️', gradient: 'linear-gradient(135deg, #2563eb, #0f172a)' },
  85: { label: 'Mưa tuyết', icon: '🌨️', gradient: 'linear-gradient(135deg, #dbeafe, #93c5fd)' },
  86: { label: 'Mưa tuyết', icon: '🌨️', gradient: 'linear-gradient(135deg, #dbeafe, #93c5fd)' },
  95: { label: 'Dông bão', icon: '⛈️', gradient: 'linear-gradient(135deg, #312e81, #0f172a)' },
  96: { label: 'Dông bão', icon: '⛈️', gradient: 'linear-gradient(135deg, #312e81, #0f172a)' },
  99: { label: 'Dông bão', icon: '⛈️', gradient: 'linear-gradient(135deg, #312e81, #0f172a)' },
}

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const convertTemperature = (value: number, unit: Unit) =>
  unit === 'C' ? value : (value * 9) / 5 + 32

const getWeatherMeta = (code: number): WeatherMeta =>
  WEATHER_META[code] ?? {
    label: 'Thời tiết khác',
    icon: '🌤️',
    gradient: 'linear-gradient(135deg, #bfdbfe, #60a5fa)',
  }

const formatDayLabel = (value: string) =>
  new Date(value).toLocaleDateString('vi-VN', { weekday: 'short' })

const formatDateLabel = (value: string) =>
  new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  })

const formatUpdatedAt = (value: string) =>
  new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

function App() {
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null)
  const [weather, setWeather] = useState<WeatherResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unit, setUnit] = useState<Unit>('C')
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []

    try {
      const stored = localStorage.getItem('weather-favorites')
      return stored ? (JSON.parse(stored) as string[]) : []
    } catch {
      return []
    }
  })

  const selectedCity = CITIES.find((city) => city.id === selectedCityId) ?? null
  const currentMeta = weather ? getWeatherMeta(weather.current.weather_code) : null

  useEffect(() => {
    localStorage.setItem('weather-favorites', JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    if (!selectedCity) {
      setWeather(null)
      return
    }

    let ignore = false

    const fetchWeather = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${selectedCity.latitude}&longitude=${selectedCity.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FHo_Chi_Minh&forecast_days=7`,
        )

        if (!response.ok) {
          throw new Error('Không thể tải dữ liệu thời tiết.')
        }

        const data = (await response.json()) as WeatherResponse

        if (!ignore) {
          setWeather(data)
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải dữ liệu.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchWeather()

    return () => {
      ignore = true
    }
  }, [selectedCity, refreshCounter])

  const visibleCities = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm)

    return [...CITIES]
      .filter((city) => normalizeText(city.name).includes(normalizedSearch))
      .sort((a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id)))
  }, [favorites, searchTerm])

  const toggleFavorite = (cityId: string) => {
    setFavorites((previous) =>
      previous.includes(cityId)
        ? previous.filter((item) => item !== cityId)
        : [...previous, cityId],
    )
  }

  const handleRetry = () => {
    setRefreshCounter((count) => count + 1)
  }

  const appBackground = currentMeta ? currentMeta.gradient : 'linear-gradient(135deg, #e0f2fe, #dbeafe)'

  return (
    <div className="weather-app" style={{ background: appBackground }}>
      <header className="topbar">
        <div>
          <p className="eyebrow">Weather app</p>
          <h1>Thời tiết Việt Nam</h1>
        </div>

        <div className="unit-toggle" aria-label="Chuyển đổi đơn vị nhiệt độ">
          <button
            type="button"
            className={unit === 'C' ? 'unit-button active' : 'unit-button'}
            onClick={() => setUnit('C')}
          >
            °C
          </button>
          <button
            type="button"
            className={unit === 'F' ? 'unit-button active' : 'unit-button'}
            onClick={() => setUnit('F')}
          >
            °F
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="city-panel">
          <div className="search-box">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm thành phố..."
              aria-label="Tìm thành phố"
            />
          </div>

          <ul className="city-list">
            {visibleCities.length === 0 ? (
              <li className="empty-list">Không tìm thấy thành phố phù hợp.</li>
            ) : (
              visibleCities.map((city) => {
                const isSelected = city.id === selectedCityId
                const isFavorite = favorites.includes(city.id)

                return (
                  <li key={city.id}>
                    <div
                      className={isSelected ? 'city-card selected' : 'city-card'}
                      onClick={() => setSelectedCityId(city.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelectedCityId(city.id)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="city-name-row">
                        <span>{city.name}</span>
                        <button
                          type="button"
                          className={isFavorite ? 'favorite-button active' : 'favorite-button'}
                          onClick={(event) => {
                            event.stopPropagation()
                            toggleFavorite(city.id)
                          }}
                          aria-label={isFavorite ? 'Bỏ yêu thích thành phố' : 'Thêm thành phố vào yêu thích'}
                        >
                          ★
                        </button>
                      </div>

                      {isSelected && <span className="selected-tag">Đang chọn</span>}
                    </div>
                  </li>
                )
              })
            )}
          </ul>
        </aside>

        <main className="weather-panel">
          {!selectedCity && !loading && !error && (
            <div className="status-panel empty">
              <div className="status-icon">📍</div>
              <h2>Chưa chọn thành phố</h2>
              <p>Hãy chọn một thành phố ở danh sách bên trái để xem thời tiết hiện tại và dự báo 7 ngày.</p>
            </div>
          )}

          {loading && (
            <div className="status-panel loading">
              <div className="spinner" />
              <p>Đang tải dữ liệu thời tiết...</p>
            </div>
          )}

          {error && !loading && (
            <div className="status-panel error">
              <div className="status-icon">⚠️</div>
              <h2>Không thể tải dữ liệu</h2>
              <p>{error}</p>
              <button type="button" className="retry-button" onClick={handleRetry}>
                Thử lại
              </button>
            </div>
          )}

          {selectedCity && weather && !loading && !error && currentMeta && (
            <div className="weather-card">
              <div className="current-header">
                <div>
                  <p className="label">Thời tiết hiện tại</p>
                  <h2>{selectedCity.name}</h2>
                </div>
                <div className="status-badge">
                  <span>{currentMeta.icon}</span>
                  {currentMeta.label}
                </div>
              </div>

              <div className="temperature-section">
                <div className="temperature">
                  {Math.round(convertTemperature(weather.current.temperature_2m, unit))}°{unit}
                </div>

                <div className="metrics">
                  <div className="metric-item">
                    <span>Độ ẩm</span>
                    <strong>{weather.current.relative_humidity_2m}%</strong>
                  </div>
                  <div className="metric-item">
                    <span>Tốc độ gió</span>
                    <strong>{weather.current.wind_speed_10m} km/h</strong>
                  </div>
                  <div className="metric-item">
                    <span>Cập nhật</span>
                    <strong>{formatUpdatedAt(weather.current.time)}</strong>
                  </div>
                </div>
              </div>

              <div className="forecast-section">
                <div className="forecast-title">Dự báo 7 ngày</div>
                <div className="forecast-grid">
                  {weather.daily.time.map((day, index) => {
                    const code = weather.daily.weather_code[index]
                    const meta = getWeatherMeta(code)
                    const Max = Math.round(convertTemperature(weather.daily.temperature_2m_max[index], unit))
                    const Min = Math.round(convertTemperature(weather.daily.temperature_2m_min[index], unit))

                    return (
                      <div key={`${day}-${selectedCity.id}`} className="forecast-card">
                        <div className="day-name">{formatDayLabel(day)}</div>
                        <div className="day-date">{formatDateLabel(day)}</div>
                        <div className="forecast-icon">{meta.icon}</div>
                        <div className="forecast-label">{meta.label}</div>
                        <div className="forecast-range">
                          <span>{Max}°{unit}</span>
                          <span className="low">{Min}°{unit}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App

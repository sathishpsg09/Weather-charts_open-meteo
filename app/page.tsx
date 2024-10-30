'use client';

import React from 'react';
import Chart from 'react-apexcharts';
import { Thermometer, Wind, Droplets, Eye, Sun, Moon, ChevronDown, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent,DialogTitle } from "@/components/ui/dialog";

// Utility function to format hourly timestamps
const formatHour = (hour) => {
  return `${hour}:00`;
};

const SearchBox = ({ onLocationSelect }) => {
  const [search, setSearch] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showDialog, setShowDialog] = React.useState(false);

  const searchLocations = async (query) => {
    if (query.length < 3) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
      );
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = React.useCallback(
    React.useDeferredValue((value) => {
      setSearch(value);
      searchLocations(value);
    }),
    []
  );

  const handleSelect = (location) => {
    onLocationSelect(location);
    setShowDialog(false);
    setSearch('');
    setResults([]);
  };

  return (
    <>
      <Button 
        variant="outline" 
        className="w-full flex justify-between items-center" 
        onClick={() => setShowDialog(true)}
      >
        <Search className="h-3.5 w-3.5 mr-2" />
        <span className="flex-1 text-left">Search location...</span>
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Search for a city..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full"
            />
            
            {isLoading && (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            
            <div className="space-y-2">
              {results.map((result) => (
                <Button
                  key={`${result.latitude}-${result.longitude}`}
                  variant="ghost"
                  className="w-full justify-start text-left"
                  onClick={() => handleSelect(result)}
                >
                  {result.name}, {result.country}
                  {result.admin1 && ` (${result.admin1})`}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const WeatherMetricCard = ({ title, value, hourlyData, icon: Icon, color, unit }) => {
  const [hoveredValue, setHoveredValue] = React.useState(null);
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  const chartOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      sparkline: { enabled: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
      events: {
        mouseMove: function(event, chartContext, config) {
          if (config.dataPointIndex !== -1) {
            const value = hourlyData[config.dataPointIndex].y;
            setHoveredValue(`${value}${unit}`);
          }
        },
        mouseLeave: function() {
          setHoveredValue(null);
        }
      },
      background: 'transparent'
    },
    colors: [color],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 100]
      }
    },
    grid: {
      show: theme !== 'dark',
      borderColor: theme === 'dark' ? '#2D3748' : '#f3f4f6',
      strokeDashArray: 3,
      xaxis: { lines: { show: false } }
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    tooltip: {
      custom: function({ series, seriesIndex, dataPointIndex }) {
        const value = series[seriesIndex][dataPointIndex];
        const time = hourlyData[dataPointIndex].x;
        return `
          <div class="${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-2 rounded-lg shadow-lg border">
            <div class="text-sm opacity-75">${time}</div>
            <div class="text-lg font-bold">${value}${unit}</div>
          </div>
        `;
      }
    },
    xaxis: {
      categories: hourlyData.map(d => d.x),
      labels: {
        show: true,
        style: {
          colors: theme === 'dark' ? '#CBD5E0' : '#6B7280',
          fontSize: '11px'
        },
        rotateAlways: false,
        hideOverlappingLabels: true,
        showDuplicates: false,
        trim: true,
        maxHeight: 40
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: { show: false },
    dataLabels: { enabled: false }
  };

  const series = [{
    name: title,
    data: hourlyData.map(d => d.y)
  }];

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="bg-card rounded-lg border shadow-sm hover:shadow-md transition-all duration-300"
    >
      <CollapsibleTrigger asChild>
        <Card className="cursor-pointer border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between py-2 px-3">
            <CardTitle className="text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span>{title}</span>
              </div>
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {hoveredValue ? hoveredValue : value}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  isOpen ? 'transform rotate-180' : ''
                }`}
              />
            </div>
          </CardHeader>
        </Card>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <CardContent className="p-3">
          <div className="h-[180px] w-full">
            <Chart
              options={chartOptions}
              series={series}
              type="area"
              height="100%"
            />
          </div>
        </CardContent>
      </CollapsibleContent>
    </Collapsible>
  );
};

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-8 h-8"
    >
      <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

const WeatherDashboard = () => {
  const { theme } = useTheme();
  const [location, setLocation] = React.useState(null);
  const [weatherData, setWeatherData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchWeatherData = async (location) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability,visibility`
      );
      const data = await response.json();
      
      // Process the hourly data
      const hourlyMetrics = {
        temperature: data.hourly.temperature_2m.slice(0, 24).map((temp, idx) => ({
          x: formatHour(idx),
          y: temp
        })),
        windSpeed: data.hourly.wind_speed_10m.slice(0, 24).map((speed, idx) => ({
          x: formatHour(idx),
          y: speed
        })),
        precipitation: data.hourly.precipitation_probability.slice(0, 24).map((prob, idx) => ({
          x: formatHour(idx),
          y: prob
        })),
        visibility: data.hourly.visibility.slice(0, 24).map((vis, idx) => ({
          x: formatHour(idx),
          y: vis / 1000 // Convert to km
        }))
      };

      setWeatherData(hourlyMetrics);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (location) {
      fetchWeatherData(location);
    }
  }, [location]);

  const metrics = weatherData ? [
    {
      title: "Temperature",
      value: `${weatherData.temperature[0].y.toFixed(1)}°C`,
      hourlyData: weatherData.temperature,
      icon: Thermometer,
      color: theme === 'dark' ? "#f87171" : "#ff7e67",
      unit: "°C"
    },
    {
      title: "Wind Speed",
      value: `${weatherData.windSpeed[0].y.toFixed(1)} km/h`,
      hourlyData: weatherData.windSpeed,
      icon: Wind,
      color: theme === 'dark' ? "#60a5fa" : "#4299e1",
      unit: " km/h"
    },
    {
      title: "Precipitation",
      value: `${weatherData.precipitation[0].y}%`,
      hourlyData: weatherData.precipitation,
      icon: Droplets,
      color: theme === 'dark' ? "#4ade80" : "#68d391",
      unit: "%"
    },
    {
      title: "Visibility",
      value: `${weatherData.visibility[0].y.toFixed(1)} km`,
      hourlyData: weatherData.visibility,
      icon: Eye,
      color: theme === 'dark' ? "#a78bfa" : "#805ad5",
      unit: " km"
    }
  ] : [];

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Weather Dashboard</h1>
        <ThemeToggle />
      </div>
      
      <div className="mb-4">
        <SearchBox onLocationSelect={setLocation} />
        {location && (
          <p className="text-sm mt-2 text-muted-foreground">
            Showing weather for {location.name}, {location.country}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {metrics.map((metric) => (
            <WeatherMetricCard key={metric.title} {...metric} />
          ))}
        </div>
      )}
    </div>
  );
};

export default WeatherDashboard;
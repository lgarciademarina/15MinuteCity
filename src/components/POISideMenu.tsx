import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import categories from '@/pages/api/POI_CATEGORIES.json';

const groupToColor = Object.fromEntries(
  Object.entries(categories).map(([groupName, group]) => [
    groupName,
    group.color
  ])
);

const categoryToColor = Object.fromEntries(
  Object.entries(categories).flatMap(([groupName, group]) =>
    Object.entries(group.categories).map(([category, value]) => [
      category,
      group.color
    ])
  )
);

type Props = {
  stats: any;
  coordinates: number[];
};

export default function POISideMenu({
  stats,
  coordinates,
}: Props) {
  const [cityName, setCityName] = useState(null);
  const [position, setPosition] = useState<{ lon: number | null; lat: number | null; }>({ lon: null, lat: null, });
      
  useEffect(() => {
    if ( !coordinates?.length || coordinates.length !== 2 ) return;
        
    const [lon, lat] = window.ol.proj.transform( coordinates, 'EPSG:3857', 'EPSG:4326' );
    setPosition({ lon, lat });
      
    fetch(`https://www.cartociudad.es/geocoder/api/geocoder/reverseGeocode?lon=${lon}&lat=${lat}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.muni) {
          setCityName(data.muni);
        }
      })
      .catch(err => console.error("Error fetching city name:", err));
  }, [coordinates]);


  
  // Prepare data for category group chart
  let categoryGroupData = {}, categoryNameData = {};
  if (stats) {
    categoryGroupData = Object.entries(stats.byCategoryGroup).map(([name, value]) => ({
      originalName: name,
      name: name.charAt(0).toUpperCase() + name.slice(1).replaceAll('_', ' '), 
      value: value
      }));
  
    // Prepare data for category name chart (top 10) with percentages
    const totalValue = Object.values(stats.byCategoryName).reduce((sum, val) => sum + (val as number), 0);
    categoryNameData = Object.entries(stats.byCategoryName)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([name, value]) => ({
        name: name.replaceAll('_', ' '),
        value: value as number,
        percentage: ((value as number) / totalValue * 100).toFixed(1)
      }));
  }

  return (
    <div className="w-full h-full bg-white shadow-lg overflow-y-auto">
      <div className="p-4 border-b sticky top-0 bg-white z-10">
      {cityName ? (
          <div className="flex flex-col justify-between items-center justify-center">
            <h2 className="text-2xl font-bold">{cityName.toUpperCase()}</h2>
            {position.lon && position.lat && (
              <div className="mt-1 font-mono text-xs text-gray-500">
                  {`lon: ${position.lon.toFixed(6)}, lat: ${position.lat.toFixed(6)}`}
              </div>
            )}
          </div>
      ): (
        <div className="my-10"></div>
      )}
      </div>

      <div className="m-4">
        {/* 15-Minute City Index */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">15-Minute City</h3>
          <p className="mb-3">The 15-minute city is an urban model that proposes that any person should be able to access their basic needs (work, shopping, healthcare, education, and leisure) within a maximum of 15 minutes by walking or cycling from their home, without relying on a car.</p>
          <p className="mb-3">This is an example of the 15-minute city concept using <b>walking distances</b> and <b><a href="https://openrouteservice.org/" target="_blank" rel="noopener noreferrer">OpenRouteService</a></b>.</p>
        </div>
        

        {/* Summary Stats */}
        {!stats ? (
          <div className="flex flex-col items-center justify-center text-center text-gray-500 px-6 my-20">
          <div className="text-lg font-semibold mb-2">
            No data available
          </div>
      
          <div className="text-sm">
            Click on a point on the map to view accessibility scores and POI statistics.
          </div>
        </div>
        ) : (
        <>
          <div className="mb-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">{stats.fifteenMinIndex.overallScore}/100</div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <div>
                  <span className="text-gray-600">Accessibility:</span>
                  <span className="font-medium ml-1">{(stats.fifteenMinIndex.accessibilityScore * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Diversity:</span>
                  <span className="font-medium ml-1">{(stats.diversity.categoryRichness * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Reachability:</span>
                  <span className="font-medium ml-1">{(stats.reachability.reachabilityScore * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Redundancy:</span>
                  <span className="font-medium ml-1">{(stats.fifteenMinIndex.redundancyScore * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total POIs</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.diversity.uniqueCategories}/{stats.reachability.totalCategories}</div>
                <div className="text-sm text-gray-600">Categories Reachable</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(0, 255, 0, 0.5)' }}>
                <div className="text-lg font-bold text-slate-900">{stats.travelTime.within5Count}</div>
                <div className="text-xs text-slate-800">Within 5 min</div>
                <div className="text-xs text-slate-800">{stats.areas[300]}</div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 0, 0.5)' }}>
                <div className="text-lg font-bold text-slate-900">{stats.travelTime.within10Count}</div>
                <div className="text-xs text-slate-800">Within 10 min</div>
                <div className="text-xs text-slate-800">{stats.areas[600]}</div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 165, 0, 0.5)' }}>
                <div className="text-lg font-bold text-slate-900">{stats.travelTime.within15Count}</div>
                <div className="text-xs text-slate-800">Within 15 min</div>
                <div className="text-xs text-slate-800">{stats.areas[900]}</div>
              </div>
            </div>
          </div>

          {/* Travel Time Statistics */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Travel Time Analysis</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{stats.travelTime.averageTime.toFixed(1)} min</div>
                <div className="text-xs text-gray-600">Average Time</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-lg font-bold text-purple-600">{stats.travelTime.medianTime.toFixed(1)} min</div>
                <div className="text-xs text-gray-600">Median Time</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-lg font-bold text-green-600">{stats.travelTime.minTime.toFixed(1)} min</div>
                <div className="text-xs text-gray-600">Fastest Access</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-lg font-bold text-orange-600">{stats.travelTime.maxTime.toFixed(1)} min</div>
                <div className="text-xs text-gray-600">Slowest Access</div>
              </div>
            </div>
            
          </div>

          {/* Category Groups Chart */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">By Category Group</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryGroupData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80} 
                  style={{ fontSize: '10px' }}
                />
                <YAxis style={{ fontSize: '10px' }} />
                <Tooltip contentStyle={{ fontSize: '10px' }} />
                <Bar dataKey="value">
                  {categoryGroupData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={groupToColor[entry.originalName] || '#8884d8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Categories Chart */}
          <div className="mb-3">
            <h3 className="text-lg font-semibold">Top 10 Categories</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryNameData}
                  cx="50%"
                  cy="45%"
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                  style={{ fontSize: '10px' }}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                >
                  {categoryNameData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={categoryToColor[entry.name] || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Scores */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Category Accessibility</h3>
            <div className="space-y-2">
              {Object.entries(stats.fifteenMinIndex.categoryScores).map(([category, score]) => (
                <div key={category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="capitalize text-sm">{category.replaceAll('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm">{stats.byCategoryGroup[category]}</div>
                    <div className={`w-3 h-3 rounded-full ${score === 1 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="font-medium text-sm">{score === 1 ? '✓' : '✗'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
        )}
      </div>
    </div>
  );
};
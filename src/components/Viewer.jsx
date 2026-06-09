
import { useEffect, useState } from 'react';
import POISideMenu from './POISideMenu';
import { fetchPOIs, extractPOIStatistics, getOnlyEssentialFeatures, addTravelTimeToFeatures, addDetailsToFeatures, splitEssentialFeatures } from "@/src/utils/POITools"
import { createMap, removeInfoLayers, addIsochronesLayer, addPOILayer, addMarkerLayer } from '@/src/utils/viewer'

const Viewer = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [coordinates, setCoordinates] = useState(null);
    const [poiStats, setPoiStats] = useState(null);

    const initMap = () => {
      const mapjs = createMap();

      mapjs.on('click', async function (evt) {
        removeInfoLayers();
        setCoordinates(evt.coord);
        const [lon, lat] = window.ol.proj.transform(evt.coord, 'EPSG:3857', 'EPSG:4326');
        let response = await fetch(`/api/isochrone?lat=${lat}&lon=${lon}`);
        let isochrones_data = await response.json();
        addIsochronesLayer(isochrones_data);
        let areas = {};
        [300, 600, 900].forEach(time => {
            const area = isochrones_data.features.find(feature => feature.properties?.value === time)?.properties.area/1000000;
            areas[time] = `${area.toFixed(2)} km2`;
        })
        console.log(`Áreas: ${areas['300']}, ${areas['600']}, ${areas['900']}`);
        
        const polygon = isochrones_data.features.find(feature => feature.properties?.value === 900);
        const poiResult = await fetchPOIs(JSON.stringify(polygon.geometry));
        console.log(`POIs encontrados: ${poiResult.totalFetched} (${poiResult.totalUnique} únicos)`);

        const essentialFeatures = getOnlyEssentialFeatures(poiResult);
        addTravelTimeToFeatures(essentialFeatures, isochrones_data.features);
        addDetailsToFeatures(essentialFeatures);
        console.log(`POIs esenciales: ${essentialFeatures.length}`);

        const groupedEssentialFeatures = splitEssentialFeatures(essentialFeatures);

        Object.entries(groupedEssentialFeatures).forEach(([groupName, features]) => {
          if (groupName === 'unknown') return; // Skip unknown category group
          addPOILayer(groupName, features);
        });

        addMarkerLayer([lon, lat]);

        // Extract POI statistics
        const stats = extractPOIStatistics(essentialFeatures);
        setPoiStats(stats);
        stats.areas = areas;
        console.log('POI Statistics:', stats);
      });

      window.mapjs = mapjs;
    };

    useEffect(() => {
        // Only initialize if map doesn't already exist
        if (window.mapjs) return;
        initMap();
    }, []);

    return (
      <div className="relative w-full h-[100svh] flex flex-col sm:flex-row">

        {/* Mobile toggle button (LEFT side) */}
        <button
          onClick={() => setMenuOpen(prev => !prev)}
          className="
            sm:hidden
            absolute top-4 left-4 z-50
            w-11 h-11
            flex items-center justify-center
            bg-[#71a7d3]/90 backdrop-blur-md
            shadow-lg
            rounded-full
            border border-gray-200
            text-white-700
            hover:bg-[#71a7d3]
            active:scale-95
            transition-all duration-200
          "
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="white"
              viewBox="0 0 24 24"
              stroke="white"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="white"
              viewBox="0 0 24 24"
              stroke="white"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* POI Drawer */}
        <div
          className={`
            absolute sm:static top-0 left-0 h-full w-full sm:w-1/3 sm:min-w-[400px] max-w-full
            bg-[var(--background)] shadow-lg z-40
            transform transition-transform duration-300
            ${menuOpen ? "translate-x-0" : "-translate-x-full"}
            sm:translate-x-0
          `}
        >
            <POISideMenu
              stats={poiStats}
              coordinates={coordinates}
            />
        </div>

        {/* Map */}
        <div id="map" className={`w-screen h-full ${menuOpen ? 'hidden sm:block' : ''}`} />
        { poiStats && (
          <div className={`absolute bottom-4 right-4 z-50 max-w-[220px] rounded-xl border border-slate-200 bg-white/85 p-3 text-xs shadow-lg backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-100 ${menuOpen ? 'hidden sm:block' : ''}`}>
            <div className="font-semibold mb-2 text-sm">Isochrone legend</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: 'rgba(0, 255, 0, 0.5)' }} />
                <span>≤ 5 min walking</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: 'rgba(255, 255, 0, 0.5)' }} />
                <span>≤ 10 min walking</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: 'rgba(255, 165, 0, 0.5)' }} />
                <span>≤ 15 min walking</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
};

export default Viewer;

import React, { useState } from 'react';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'; 
import categories from '@/pages/api/POI_CATEGORIES.json';
import POISideMenu from './POISideMenu';


const fetchPOIs = async (polygon) => {
    
    const request = await fetch(`/api/poi?polygon=${polygon}`);
    const data = await request.json();
    
    // Remove duplicates based on osm_id
    const uniqueFeatures = Array.from(new Map(
        data.features?.map(feature => [feature.properties?.osm_id || feature.id, feature])
    ).values());
    
    return {
        features: uniqueFeatures,
        totalFetched: data.features?.length || 0,
        totalUnique: uniqueFeatures?.length || 0
    };
};

const extractPOIStatistics = (features) => {
  // --------------------------------------------
  // Build lookup: categoryId → metadata
  // --------------------------------------------
  const categoryLookup = new Map();

  Object.entries(categories).forEach(([groupKey, group]) => {
    Object.entries(group.categories).forEach(([name, code]) => {
      categoryLookup.set(Number(code), {
        category_name: name,
        category_group: groupKey,
        color: group.color,
      });
    });
  });

  const stats = {
    total: 0,
    byCategoryGroup: {},
    byCategoryName: {},
    byCategoryId: {},

    fifteenMinIndex: {
      overallScore: 0,
      categoryScores: {},
      accessibilityScore: 0,
      diversityScore: 0,
      reachabilityScore: 0,
      redundancyScore: 0,
    },

    reachability: {
      reachableCategories: new Set(),
      totalCategories: Object.keys(categories).length,
      binaryScores: {},
    },

    diversity: {
      uniqueCategories: 0,
      categoryRichness: 0,
    },

    travelTime: {
      averageTime: 0,
      medianTime: 0,
      minTime: Infinity,
      maxTime: 0,
      times: [],
      within5Count: 0,
      within10Count: 0,
      within15Count: 0,
    },

    redundancy: {
      byCategory: {},
    },
  };

  // --------------------------------------------
  // PROCESS FEATURES
  // --------------------------------------------
  features.forEach((feature) => {
    const attributes =
      feature.properties || feature.getAttributes?.() || {};

    const categoryIds = attributes.category_ids || {};
    const travelTimeSeconds = Number(attributes.travel_time);
    const travelTimeMinutes = Number.isFinite(travelTimeSeconds)
      ? travelTimeSeconds / 60
      : null;

    // IMPORTANT: prevent duplicates per feature
    const seenGroups = new Set();

    // FIX: handle array OR object safely
    const ids = Array.isArray(categoryIds)
      ? categoryIds
      : Object.keys(categoryIds);

    ids.forEach((id) => {
      const categoryId = Number(id);

      const meta = categoryLookup.get(categoryId);
      if (!meta) return;

      const { category_name, category_group } = meta;

      // count category occurrences (global stats)
      stats.byCategoryGroup[category_group] =
        (stats.byCategoryGroup[category_group] || 0) + 1;

      stats.byCategoryName[category_name] =
        (stats.byCategoryName[category_name] || 0) + 1;

      stats.byCategoryId[categoryId] =
        (stats.byCategoryId[categoryId] || 0) + 1;

      stats.total += 1;

      // reachability (only once per feature per group)
      if (!seenGroups.has(category_group)) {
        stats.reachability.reachableCategories.add(category_group);
        seenGroups.add(category_group);
      }

      // redundancy
      if (!stats.redundancy.byCategory[category_group]) {
        stats.redundancy.byCategory[category_group] = {};
      }

      stats.redundancy.byCategory[category_group][category_name] =
        (stats.redundancy.byCategory[category_group][category_name] || 0) + 1;

      // travel time
      if (travelTimeMinutes !== null) {
        stats.travelTime.times.push(travelTimeMinutes);

        stats.travelTime.minTime = Math.min(
          stats.travelTime.minTime,
          travelTimeMinutes
        );

        stats.travelTime.maxTime = Math.max(
          stats.travelTime.maxTime,
          travelTimeMinutes
        );

        if (travelTimeMinutes <= 5) stats.travelTime.within5Count++;
        else if (travelTimeMinutes <= 10) stats.travelTime.within10Count++;
        else if (travelTimeMinutes <= 15) stats.travelTime.within15Count++;
      }
    });
  });

  // --------------------------------------------
  // TRAVEL TIME STATS
  // --------------------------------------------
  if (stats.travelTime.times.length > 0) {
    stats.travelTime.times.sort((a, b) => a - b);

    stats.travelTime.averageTime =
      stats.travelTime.times.reduce((a, b) => a + b, 0) /
      stats.travelTime.times.length;

    stats.travelTime.medianTime =
      stats.travelTime.times[
        Math.floor(stats.travelTime.times.length / 2)
      ];
  } else {
    stats.travelTime.minTime = 0;
  }

  // --------------------------------------------
  // DIVERSITY
  // --------------------------------------------
  stats.diversity.uniqueCategories =
    stats.reachability.reachableCategories.size;

  stats.diversity.categoryRichness =
    stats.diversity.uniqueCategories /
    stats.reachability.totalCategories;

  stats.reachability.reachabilityScore =
    stats.diversity.categoryRichness;

  // --------------------------------------------
  // CATEGORY SCORES (0 or 1 per group)
  // --------------------------------------------
  Object.entries(categories).forEach(([groupKey]) => {
    const isReachable =
      stats.reachability.reachableCategories.has(groupKey);

    stats.fifteenMinIndex.categoryScores[groupKey] = isReachable ? 1 : 0;
    stats.reachability.binaryScores[groupKey] = isReachable ? 1 : 0;
  });

  // --------------------------------------------
  // ACCESSIBILITY (NORMALIZED, NEVER > 1)
  // --------------------------------------------
  const totalWeight = Object.values(categories).reduce(
    (acc, c) => acc + (c.weight || 0),
    0
  );

  const rawAccessibility = Object.entries(categories).reduce(
    (acc, [groupKey, config]) => {
      return (
        acc +
        (stats.fifteenMinIndex.categoryScores[groupKey] || 0) *
          (config.weight || 0)
      );
    },
    0
  );

  stats.fifteenMinIndex.accessibilityScore =
    totalWeight > 0 ? rawAccessibility / totalWeight : 0;

    // --------------------------------------------
    // REDUNDANCY
    // --------------------------------------------
    
    // total POI occurrences per group
    const totalByGroup = {};
    // unique category names per group
    const uniqueByGroup = {};
    
    Object.entries(stats.redundancy.byCategory).forEach(([group, cats]) => {
      totalByGroup[group] = 0;
      uniqueByGroup[group] = new Set(Object.keys(cats));
    
      Object.values(cats).forEach(count => {
        totalByGroup[group] += count;
      });
    });
    
    // compute redundancy per group
    const redundancyPerGroup = Object.keys(totalByGroup).map(group => {
      const total = totalByGroup[group];
      const unique = uniqueByGroup[group].size;
      if (total === 0) return 0;
      // repetition ratio: how much is repeated inside group
      return 1 - (unique / total);
    });
    
    // final redundancy score (bounded 0–1)
    stats.fifteenMinIndex.redundancyScore =
      redundancyPerGroup.length > 0
        ? redundancyPerGroup.reduce((a, b) => a + b, 0) / redundancyPerGroup.length
        : 0;

  // --------------------------------------------
  // FINAL SCORE (0–100)
  // --------------------------------------------
  stats.fifteenMinIndex.overallScore = Math.round(
    (stats.fifteenMinIndex.accessibilityScore * 0.7 +
      stats.diversity.categoryRichness * 0.2 +
      stats.fifteenMinIndex.redundancyScore * 0.1) *
      100
  );

  return stats;
};

const addTravelTimeToFeatures = (items, polygons) => {
    // Enrich filteredFeatures with travel time zone information using spatial filters
    items.map(point => {
        polygons.forEach(polygon => {
            if (booleanPointInPolygon( point, polygon )) point.properties.travel_time = polygon.properties.value;
        })
    });
}

const categoryToDetails = (id) => {
  let result = {};
  Object.entries(categories).forEach(([groupName, group]) => {
    if (Object.values(group.categories).find(value => value === Number(id))) {
      result = { color: group.color, category_group: groupName };
    }
  });

  return result;
};


const addDetailsToFeatures = (items) => {
  items.map(point => {
    const groups = Object.keys(point.properties.category_ids);
    const details = categoryToDetails(groups?.[0]);
    point.properties.color = details.color || 'red';
    point.properties.category_group = details.category_group || 'unknown';
  })

}

const addMarker = ([lon, lat]) => {
  mapjs.addLayers(
      new window.IDEE.layer.GeoJSON(
        {
          name: 'Location',
          legend: 'Selected Location',
          source: {
            type: 'FeatureCollection',
            features: [ { type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] } } ]
          },
          extract: false,
        },
        {
          displayInLayerSwitcher: false,
          style: new window.IDEE.style.Generic({
            point: {
              radius: 5,
              icon: {
                  src: 'https://componentes.idee.es/estaticos/Simbologia/svg/marcadores/marker.svg',
                  scale: 1.5,
                  fill: {
                      color: '#71a7d3',
                  },
                  stroke: {
                      width: 30,
                      color: 'white',
                  },
                  anchor: [0.5, 1]
              },
            }
          })
        }
      )
    );
}

const Viewer = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [coordinates, setCoordinates] = useState(null);
    const [poiStats, setPoiStats] = useState(null);

    const initMap = () => {
      const lang = window.localStorage.language || 'es';
      window.IDEE.language.setLang(lang);
      // let zoom = Utils.isMobile() ? 4 : 5;
      let zoom = 15;
      let center = window.ol.proj.fromLonLat([-5.6615,43.5357]);
      let mouseProjection = 'EPSG:4326';
      try {
        const arrayParams = new URLSearchParams(window.location.search.replace('?', ''));
        zoom = arrayParams.get('zoom') || zoom;
        mouseProjection = arrayParams.get('srs') || mouseProjection;
        center = arrayParams.get('center') ? arrayParams.get('center').split(',').map(coord => parseFloat(coord)) : center;
        center = (center === INITIAL_CENTER) ? center : transform(center, mouseProjection, 'EPSG:3857');
      } catch (err) { }
    
      const mapjs = window.IDEE.map({
        container: 'map',
        controls: [],//Utils.isMobile() ? ['rotate'] : ['scale*true'],
        center: center,
        zoom: zoom,
        minZoom: 5,//Utils.isMobile() ? 3 : 5,
        maxZoom: 20,
      });
      mapjs.addPlugin(new window.IDEE.plugin.Layerswitcher({
          collapsed: true,
          position: 'TR',
          tooltip: '',
          collapsible: true,
          isDraggable: false,
          modeSelectLayers: 'eyes',
          tools: ['transparency', 'legend', 'zoom', 'information', 'style', 'delete'],
          isMoveLayers: true,
          https: true,
          http: true,
          showCatalog: false,
      }));
      mapjs.addPlugin(new IDEE.plugin.Locator({
        position: 'TR',
        collapsible: true,
        collapsed: true,
        zoom: 16,
        byParcelCadastre: false,
        byCoordinates: true,
        byPlaceAddressPostal: {
          maxResults: 5,
          reverse: false,
          resultVisibility: false
        },
        isDraggable: false,
      }));

      mapjs.on('click', async function (evt) {
        mapjs.removeLayers(mapjs.getLayers().filter(l => !l.isBase));

        setCoordinates(evt.coord);
        const [lon, lat] = window.ol.proj.transform(evt.coord, 'EPSG:3857', mouseProjection);
        let response = await fetch(`/api/isochrone?lat=${lat}&lon=${lon}`);
        let isochrones_data = await response.json();
        mapjs.addLayers(new window.IDEE.layer.GeoJSON({
            name: 'Isochrone',
            legend: 'Isócronas',
            source: {'type': 'FeatureCollection', 'features': isochrones_data?.features?.reverse()},
            extract: false,
        }, {
          displayInLayerSwitcher: false,
          style: new window.IDEE.style.Generic({
            polygon: {
                fill: {
                    color: function (feature) {
                        const value = feature.getAttribute('value');
                        if (value <= 300) return 'rgba(0, 255, 0, 0.5)';
                        if (value <= 600) return 'rgba(255, 255, 0, 0.5)';
                        if (value <= 900) return 'rgba(255, 165, 0, 0.5)';
                        return 'rgba(0, 255, 0, 0.5)';
                    },
                    opacity: 0.3,
                }
            }
          }),
        },
        ));
        let areas = {};
        [300, 600, 900].forEach(time => {
            const area = isochrones_data.features.find(feature => feature.properties?.value === time)?.properties.area/1000000;
            areas[time] = `${area.toFixed(2)} km2`;
        })
        console.log(`Áreas: ${areas['300']}, ${areas['600']}, ${areas['900']}`);
        
        const polygon = isochrones_data.features.find(feature => feature.properties?.value === 900);
        const poiResult = await fetchPOIs(JSON.stringify(polygon.geometry));
        console.log(`POIs encontrados: ${poiResult.totalFetched} (${poiResult.totalUnique} únicos)`);

        // Filter to only essential 15m categories
        const codes = Object.values(categories).flatMap(group => Object.values(group.categories));
        const essentialCodes = new Set(codes);
        const filteredFeatures = poiResult.features.filter(feature => {
            const attributes = feature.properties || {};
            const categoryIds = attributes.category_ids || {};
            return Object.keys(categoryIds).some(id => essentialCodes.has(parseInt(id)));
        });

        addTravelTimeToFeatures(filteredFeatures, isochrones_data.features);
        addDetailsToFeatures(filteredFeatures);

        const grouped = {};

        filteredFeatures.forEach(feature => {
          const group = feature.properties.category_group || 'unknown';

          const key = group;
          if (!grouped[key]) {
            grouped[key] = [];
          }
          grouped[key].push(feature);
        });

        console.log(`POIs esenciales: ${filteredFeatures.length}`);
        Object.entries(grouped).forEach(([groupName, features]) => {
          if (groupName === 'unknown') return; // Skip unknown category group
          mapjs.addLayers(
            new window.IDEE.layer.GeoJSON(
              {
                name: groupName,
                legend: groupName.replaceAll('_', ' '),
                source: {
                  type: 'FeatureCollection',
                  features
                },
                extract: false,
                displayInLayerSwitcher: true
              },
              {
                style: new window.IDEE.style.Generic({
                  point: {
                    radius: 6,
                    fill: {
                      color: features[0]?.properties.color || 'red',
                      opacity: 1
                    }
                  }
                })
              }
            )
          );
        
        });

        addMarker([lon, lat]);

        // Extract POI statistics
        const stats = extractPOIStatistics(filteredFeatures);
        setPoiStats(stats);
        stats.areas = areas;
        console.log('POI Statistics:', stats);
      });

      window.mapjs = mapjs;
   };

    React.useEffect(() => {
        // Only initialize if map doesn't already exist
        if (window.mapjs) return;
        initMap();
    }, []);

    return (
      <div className="relative w-full h-screen flex flex-col sm:flex-row">

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
            absolute sm:static top-0 left-0 h-full w-full sm:w-1/3 min-w-[400px] 
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
        <div id="map" className="w-full h-full" />

      </div>
    );
};

export default Viewer;
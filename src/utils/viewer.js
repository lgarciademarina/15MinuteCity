export function createMap(container) {
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
        container: container || 'map',
        controls: [],
        center: center,
        zoom: zoom,
        minZoom: 5,
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

    return mapjs;
}

export function removeInfoLayers(){
    window.mapjs.removeLayers(mapjs.getLayers().filter(l => !l.isBase));
}

export function addIsochronesLayer(isochrones_data){
    window.mapjs.addLayers(new window.IDEE.layer.GeoJSON({
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
    }));
}

export function addPOILayer(name, features) {
    window.mapjs.addLayers(new window.IDEE.layer.GeoJSON({
        name: name,
        legend: name.replaceAll('_', ' '),
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
    }));
}

export function addMarkerLayer ([lon, lat]) {
    window.mapjs.addLayers(new window.IDEE.layer.GeoJSON({
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
                    fill: { color: '#71a7d3' },
                    stroke: { width: 30, color: 'white' },
                    anchor: [0.5, 1]
                },
            }
        })
    }));
}

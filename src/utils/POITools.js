import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import categories from '@/pages/api/POI_CATEGORIES.json';

export async function fetchPOIs(polygon) {
    
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
}

export function extractPOIStatistics(features) {
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
        stats.byCategoryGroup[category_group] = (stats.byCategoryGroup[category_group] || 0) + 1;
        stats.byCategoryName[category_name] = (stats.byCategoryName[category_name] || 0) + 1;
        stats.byCategoryId[categoryId] = (stats.byCategoryId[categoryId] || 0) + 1;
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
        stats.redundancy.byCategory[category_group][category_name] = (stats.redundancy.byCategory[category_group][category_name] || 0) + 1;
  
        // travel time
        if (travelTimeMinutes !== null) {
          stats.travelTime.times.push(travelTimeMinutes);
          stats.travelTime.minTime = Math.min( stats.travelTime.minTime, travelTimeMinutes );
          stats.travelTime.maxTime = Math.max( stats.travelTime.maxTime, travelTimeMinutes );
  
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
      stats.travelTime.averageTime = stats.travelTime.times.reduce((a, b) => a + b, 0) / stats.travelTime.times.length;
      stats.travelTime.medianTime = stats.travelTime.times[ Math.floor(stats.travelTime.times.length / 2) ];
    } else {
      stats.travelTime.minTime = 0;
    }
  
    // --------------------------------------------
    // DIVERSITY
    // --------------------------------------------
    stats.diversity.uniqueCategories = stats.reachability.reachableCategories.size;
    stats.diversity.categoryRichness = stats.diversity.uniqueCategories / stats.reachability.totalCategories;
    stats.reachability.reachabilityScore = stats.diversity.categoryRichness;
  
    // --------------------------------------------
    // CATEGORY SCORES (0 or 1 per group)
    // --------------------------------------------
    Object.entries(categories).forEach(([groupKey]) => {
      const isReachable = stats.reachability.reachableCategories.has(groupKey);
      stats.fifteenMinIndex.categoryScores[groupKey] = isReachable ? 1 : 0;
      stats.reachability.binaryScores[groupKey] = isReachable ? 1 : 0;
    });
  
    // --------------------------------------------
    // ACCESSIBILITY (NORMALIZED, NEVER > 1)
    // --------------------------------------------
    const totalWeight = Object.values(categories).reduce( (acc, c) => acc + (c.weight || 0), 0 );
  
    const rawAccessibility = Object.entries(categories).reduce(
      (acc, [groupKey, config]) => {
        return ( acc + (stats.fifteenMinIndex.categoryScores[groupKey] || 0) * (config.weight || 0) );
      }, 0
    );
  
    stats.fifteenMinIndex.accessibilityScore = totalWeight > 0 ? rawAccessibility / totalWeight : 0;
  
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
    redundancyPerGroup.length > 0 ? redundancyPerGroup.reduce((a, b) => a + b, 0) / redundancyPerGroup.length : 0;
  
    // --------------------------------------------
    // FINAL SCORE (0–100)
    // --------------------------------------------
    stats.fifteenMinIndex.overallScore = Math.round( (stats.fifteenMinIndex.accessibilityScore * 0.7 + stats.diversity.categoryRichness * 0.2 + stats.fifteenMinIndex.redundancyScore * 0.1) * 100);
  
    return stats;
};

export function getOnlyEssentialFeatures(poiFeatures){
    // Filter to only essential 15m categories
    const codes = Object.values(categories).flatMap(group => Object.values(group.categories));
    const essentialCodes = new Set(codes);
    return poiFeatures.features.filter(feature => {
        const attributes = feature.properties || {};
        const categoryIds = attributes.category_ids || {};
        return Object.keys(categoryIds).some(id => essentialCodes.has(parseInt(id)));
    }) || {};
}

export function addTravelTimeToFeatures(items, polygons) {
    // Enrich filteredFeatures with travel time zone information using spatial filters
    items.map(point => {
        polygons.forEach(polygon => {
            if (booleanPointInPolygon( point, polygon )) point.properties.travel_time = polygon.properties.value;
        })
    });
}

export function addDetailsToFeatures(items){
    function categoryToDetails(id) {
        let result = {};
        Object.entries(categories).forEach(([groupName, group]) => {
            if (Object.values(group.categories).find(value => value === Number(id))) {
                result = { color: group.color, category_group: groupName };
            }
        });
        
        return result;
    };
  
    items.map(point => {
        const groups = Object.keys(point.properties.category_ids);
        const details = categoryToDetails(groups?.[0]);
        point.properties.color = details.color || 'red';
        point.properties.category_group = details.category_group || 'unknown';
    })
  
}

export function splitEssentialFeatures(essentialFeatures){
    const grouped = {};
    essentialFeatures.forEach(feature => {
        const group = feature.properties.category_group || 'unknown';
        if (!grouped[group]) grouped[group] = [];
        grouped[group].push(feature);
    });
    return grouped;
}
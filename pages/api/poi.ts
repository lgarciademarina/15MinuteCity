import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { polygon, categoryGroupIds } = req.query;

  if (!polygon || typeof polygon !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid polygon parameter' });
  }

  let geojson;
  try {
    geojson = JSON.parse(polygon);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid polygon JSON' });
  }

  const body: any = {
    request: 'pois',
    geometry: {
      geojson: geojson,
    }
  };

  // Add category group filters if provided
  const category_ids = typeof categoryGroupIds === 'string' 
    ? categoryGroupIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id))
    : [];
  console.log(`Received category group IDs: ${category_ids}`);
  if (category_ids.length > 0) {
    body.filters = {
      category_group_ids: category_ids,
    };
  }

  try {
    const response = await fetch(`${process.env.OPENROUTE_POIS}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
        'Content-Type': 'application/json',
        'Authorization': process.env.OPENROUTE_API_KEY || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Error fetching POIs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

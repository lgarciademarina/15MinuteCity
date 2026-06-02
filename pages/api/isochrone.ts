import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lon } = req.query;

  if (!lat || !lon || typeof lat !== 'string' || typeof lon !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid lat or lon parameters' });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: 'Invalid lat or lon values' });
  }

  const body = {
    locations: [[longitude, latitude]],
    range: [300, 600, 900],
    attributes: ["area"],
    interval: 300,
    range_type: "time",
    area_units: "m"
  };

  try {
    const response = await fetch(`${process.env.OPENROUTE_ISOCHRONES}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
        'Content-Type': 'application/json',
        'Authorization': process.env.OPENROUTE_API_KEY || '',
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error fetching isochrone:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
const port = 3000;
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.use(express.static('public'));

app.get('/api/standings', async (req, res) => {
  const apiKey = '00c1731f5fa741389482e69b26a620d1'; 
  const apiUrl = 'https://api.football-data.org/v4/competitions/PL/standings'; // v4 endpoint

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'X-Auth-Token': apiKey,
        'Accept': 'application/json' // Required header
      }
    });

    // Log the response status for debugging
    console.log('API Status:', response.status);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    // Extract standings data (structure might differ in v4)
    if (data.standings && data.standings[0].table) {
      res.json(data.standings[0].table);
    } else {
      throw new Error('Invalid API response structure');
    }
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/fixtures/previous', async (req, res) => {
  const apiKey = '00c1731f5fa741389482e69b26a620d1';
  const apiUrl = 'https://api.football-data.org/v4/competitions/PL/matches';
  const currentMatchday = 23; // Current matchday

  try {
    const response = await fetch(apiUrl, { headers: { 'X-Auth-Token': apiKey, 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    const data = await response.json();
    console.log('Previous Fixtures API Response:', JSON.stringify(data, null, 2)); // 👈 Log the response

    const currentDate = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(currentDate.getMonth() - 1);

    // Filter and sort previous matches (newest first)
    const previousFixtures = data.matches
      .filter(match => {
        const matchDate = new Date(match.utcDate);
        return matchDate < currentDate && matchDate >= oneMonthAgo;
      })
      .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate)); // Most recent first

    // Group matches by matchday
    const groupedFixtures = {};
    previousFixtures.forEach(match => {
      const matchday = match.matchday;
      if (!groupedFixtures[matchday]) {
        groupedFixtures[matchday] = [];
      }
      groupedFixtures[matchday].push(match);
    });

    // Filter out incomplete matchdays (less than 10 matches)
    const completeMatchdays = Object.entries(groupedFixtures)
      .filter(([matchday, matches]) => matches.length === 10) // Only complete matchdays
      .map(([matchday, matches]) => ({
        matchday: parseInt(matchday),
        matches: matches.sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate)) // Sort matches by date (newest first)
      }))
      .sort((a, b) => b.matchday - a.matchday); // Sort matchdays in descending order

    res.json(completeMatchdays);
  } catch (error) {
    console.error('Previous Fixtures Error:', error); // 👈 Log the error
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/fixtures/next', async (req, res) => {
  const apiKey = '00c1731f5fa741389482e69b26a620d1'; // Replace with your key
  const apiUrl = 'https://api.football-data.org/v4/competitions/PL/matches';
  const currentMatchday = 23; // Current matchday

  try {
    const response = await fetch(apiUrl, { headers: { 'X-Auth-Token': apiKey, 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    const data = await response.json();
    const currentDate = new Date();
    const threeMonthsAhead = new Date();
    threeMonthsAhead.setMonth(currentDate.getMonth() + 3); // 3 months ahead

    // Filter and sort next matches (soonest first)
    const nextFixtures = data.matches
      .filter(match => {
        const matchDate = new Date(match.utcDate);
        return matchDate >= currentDate && matchDate <= threeMonthsAhead;
      })
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate)); // Soonest first

    // Group matches by matchday
    const groupedFixtures = {};
    nextFixtures.forEach(match => {
      const matchday = match.matchday;
      if (!groupedFixtures[matchday]) {
        groupedFixtures[matchday] = [];
      }
      groupedFixtures[matchday].push(match);
    });

    // Filter out incomplete matchdays (less than 10 matches)
    const completeMatchdays = Object.entries(groupedFixtures)
      .filter(([matchday, matches]) => matches.length === 10) // Only complete matchdays
      .map(([matchday, matches]) => ({
        matchday: parseInt(matchday),
        matches: matches.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate)) // Sort matches by date
      }))
      .sort((a, b) => a.matchday - b.matchday); // Sort matchdays in ascending order

    res.json(completeMatchdays);
  } catch (error) {
    console.error('Next Fixtures Error:', error); // 👈 Log the error
    res.status(500).json({ error: error.message });
  }
});
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
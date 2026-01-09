import { getRandomGenre, getTotalGenreCount } from './database.js';
import { formatGenrePost, formatStatsPost, formatMilestonePost } from '../templates/post_templates.js';

const LASTFM_API_URL = 'http://ws.audioscrobbler.com/2.0/';
const SCREENSHOT_WAIT_TIME = 30000; // 30 seconds in milliseconds

/**
 * Trigger screenshot generation by fetching the URL
 * Waits 10 seconds for the screenshot service to generate the image
 * @param {string} url - URL to fetch for screenshot generation
 */
async function triggerScreenshotGeneration(url) {
  try {
    // Fetch the URL to trigger screenshot generation
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MusicGenreBot/1.0 (Screenshot Generator)'
      }
    });

    if (!response.ok) {
      console.warn(`Screenshot trigger returned ${response.status} for ${url}`);
    } else {
      console.log('✓ Screenshot generation triggered');
    }

    // Wait 10 seconds for screenshot to be generated
    console.log('Waiting 10 seconds for screenshot generation...');
    await new Promise(resolve => setTimeout(resolve, SCREENSHOT_WAIT_TIME));
    console.log('✓ Screenshot should be ready');

  } catch (error) {
    console.warn('Could not trigger screenshot generation:', error.message);
    // Continue anyway - screenshot may already exist or will be generated later
  }
}

export async function generateGenrePost() {
  const genre = await getRandomGenre();

  if (!process.env.SITE_URL) {
    throw new Error('SITE_URL environment variable is required');
  }

  const url = `${process.env.SITE_URL}/${genre.slug}`;

  // Trigger screenshot generation by visiting the URL
  console.log(`Triggering screenshot generation for: ${url}`);
  await triggerScreenshotGeneration(url);

  // Fetch Last.fm tracks for this genre
  let tracks = [];
  if (process.env.LASTFM_API_KEY) {
    try {
      tracks = await getTracksForGenre(genre.genre);
    } catch (error) {
      console.warn('Could not fetch Last.fm tracks:', error.message);
    }
  }

  const text = formatGenrePost(genre.genre, tracks, url);

  return {
    text,
    url,
    embedTitle: genre.genre,
    embedDescription: 'Generate your own random music genre'
  };
}

export async function generateStatsPost() {
  const totalCount = await getTotalGenreCount();

  if (!process.env.SITE_URL) {
    throw new Error('SITE_URL environment variable is required');
  }

  const text = formatStatsPost(totalCount);

  return {
    text,
    url: process.env.SITE_URL,
    embedTitle: 'Music Genre-ator',
    embedDescription: `${totalCount} random music genres generated and counting`
  };
}

export async function generateMilestonePost(milestoneCount) {
  const text = formatMilestonePost(milestoneCount);

  return {
    text,
    url: process.env.SITE_URL,
    embedTitle: 'Music Genre-ator Milestone',
    embedDescription: `${milestoneCount} genres generated!`
  };
}

/**
 * Fetch top tracks for a single tag from Last.fm
 * @param {string} tag - Tag to search for
 * @returns {Promise<Array>} Array of track objects
 */
async function fetchTracksByTag(tag) {
  if (!process.env.LASTFM_API_KEY) {
    return [];
  }

  const encodedTag = encodeURIComponent(tag.toLowerCase());
  const url = `${LASTFM_API_URL}?method=tag.gettoptracks&tag=${encodedTag}&limit=10&api_key=${process.env.LASTFM_API_KEY}&format=json`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Last.fm API error: ${response.status}`);
    }

    const data = await response.json();

    // Handle case where Last.fm returns error
    if (data.error) {
      console.warn(`Last.fm API error for tag "${tag}": ${data.message}`);
      return [];
    }

    // Last.fm returns tracks in data.tracks.track
    const tracks = data.tracks?.track || [];
    return Array.isArray(tracks) ? tracks : (tracks ? [tracks] : []);
  } catch (error) {
    console.error(`Error fetching tracks for tag "${tag}":`, error.message);
    return [];
  }
}

/**
 * Fetch top tracks for a given genre from Last.fm
 * Uses fallback strategy: tries full genre first, then combines results from individual words
 * @param {string} genre - Genre name to search for
 * @returns {Promise<Array>} Array of track objects
 */
async function getTracksForGenre(genre) {
  if (!process.env.LASTFM_API_KEY) {
    console.warn('LASTFM_API_KEY not configured');
    return [];
  }

  // Try full genre name first
  console.log(`Searching Last.fm for full genre: "${genre}"`);
  let tracks = await fetchTracksByTag(genre);

  // If no results, try breaking down into individual words and combine results
  if (!tracks || tracks.length === 0) {
    console.log(`No results for full genre, trying individual words...`);

    // Split genre into words and remove common stop words
    const words = genre
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2); // Filter out very short words

    if (words.length > 1) {
      const allTracks = [];
      const trackMap = new Map(); // Use Map to track unique tracks

      // Fetch tracks for each word
      for (const word of words) {
        console.log(`Fetching tracks for tag: "${word}"`);
        const wordTracks = await fetchTracksByTag(word);

        if (wordTracks && wordTracks.length > 0) {
          console.log(`Found ${wordTracks.length} tracks for tag: "${word}"`);

          // Add tracks to map, using artist+name as unique key
          wordTracks.forEach(track => {
            const key = `${track.artist.name}|${track.name}`.toLowerCase();
            if (!trackMap.has(key)) {
              trackMap.set(key, track);
              allTracks.push(track);
            }
          });
        }
      }

      tracks = allTracks;
      console.log(`Combined total: ${tracks.length} unique tracks from all tags`);

      // Shuffle the combined tracks to mix different genres
      tracks = shuffleArray(tracks);

      // Limit to 10 tracks
      if (tracks.length > 10) {
        tracks = tracks.slice(0, 10);
        console.log(`Shuffled and limited to 10 tracks`);
      }
    }
  } else {
    console.log(`Found ${tracks.length} tracks for full genre`);
  }

  return tracks || [];
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function shouldPostStats() {
  // Post stats on Sundays
  const today = new Date();
  return today.getDay() === 0;
}

export async function checkMilestone() {
  const totalCount = await getTotalGenreCount();

  // Check for milestone numbers (every 5,000)
  const milestones = [60000, 65000, 70000, 75000, 80000, 85000, 90000, 95000, 100000];

  // This is a simple check - in production, you'd want to track the last posted milestone
  // to avoid duplicate posts
  for (const milestone of milestones) {
    if (totalCount >= milestone && totalCount < milestone + 100) {
      return milestone;
    }
  }

  return null;
}

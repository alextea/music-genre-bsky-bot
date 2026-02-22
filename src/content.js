import { getRandomGenre, getTotalGenreCount } from './database.js';
import { formatGenrePost, formatStatsPost, formatMilestonePost } from '../templates/post_templates.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { getTracksForGenre } = require('music-genre-lastfm-utils');
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

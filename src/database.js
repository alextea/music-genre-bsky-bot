import pg from 'pg';
const { Pool } = pg;

let pool;

export function initDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  return pool;
}

export async function getRandomGenre() {
  if (!pool) {
    initDatabase();
  }

  try {
    const result = await pool.query(
      'SELECT genre, slug FROM genres ORDER BY RANDOM() LIMIT 1'
    );

    if (result.rows.length === 0) {
      throw new Error('No genres found in database');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error fetching random genre:', error);
    throw error;
  }
}

export async function getTotalGenreCount() {
  if (!pool) {
    initDatabase();
  }

  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM genres');
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error('Error fetching genre count:', error);
    throw error;
  }
}

export async function getRecentGenreCount(days = 7) {
  if (!pool) {
    initDatabase();
  }

  try {
    // Note: Only works if genres table has a created_at timestamp column
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM genres WHERE created_at > NOW() - INTERVAL \'$1 days\'',
      [days]
    );
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    // If created_at column doesn't exist, return null
    console.warn('Could not fetch recent genres (created_at column may not exist)');
    return null;
  }
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
  }
}

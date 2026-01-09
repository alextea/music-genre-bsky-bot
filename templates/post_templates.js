// Post templates for genre announcements
export const GENRE_TEMPLATES = [
  (genre, emoji) => `${emoji} Today's genre: ${genre} ${emoji}`,
  (genre, emoji) => `${emoji} Just discovered: ${genre} ${emoji}`,
  (genre, emoji) => `${emoji} The algorithm has spoken: ${genre} ${emoji}`,
  (genre, emoji) => `${emoji} New genre alert: ${genre} ${emoji}`,
  (genre, emoji) => `${emoji} ${genre} is my jam ${emoji}`,
  (genre, emoji) => `${emoji} Fresh from the generator: ${genre} ${emoji}`,
  (genre, emoji) => `${emoji} I was into ${genre} before it was cool ${emoji}`
];

export const EMOJIS = ["🎤", "🎧", "🎼", "🎹", "🥁", "🎷", "🎺", "🎸", "🎻", "💽", "💿", "🔊", "👩‍🎤", "👨🏻‍🎤" ];

// Get random template
export function getRandomWord(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Format genre post with tracks
export function formatGenrePost(genre, tracks, url) {
  const template = getRandomWord(GENRE_TEMPLATES);
  const emoji = getRandomWord(EMOJIS);
  let post = template(genre, emoji);

  if (tracks && tracks.length > 0) {
    post += '\n\nDiscovered on Last.fm:';
    tracks.slice(0, 5).forEach(track => {
      post += `\n• ${track.artist.name} - ${track.name}`;
    });
  }

  post += `\n\nGenerate yours: ${url}`;

  return post;
}

// Format stats post
export function formatStatsPost(totalCount, recentCount = null) {
  let post = `📊 Music Genre Stats 📊\n\n`;
  post += `Total genres generated: ${formatNumber(totalCount)}`;

  if (recentCount !== null) {
    post += `\nNew this week: ${formatNumber(recentCount)}`;
  }

  post += `\n\nWhat's your next genre? https://musicgenre.site`;

  return post;
}

// Format milestone post
export function formatMilestonePost(count) {
  const emojis = '🎉🎊🎈';
  return `${emojis} MILESTONE ALERT ${emojis}\n\nWe just hit ${formatNumber(count)} randomly generated music genres!\n\nThank you for all the creative chaos.\n\nGenerate yours: https://musicgenre.site`;
}

// Helper to format large numbers
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

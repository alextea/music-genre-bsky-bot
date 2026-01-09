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
    post += '\n\nTop tracks:';

    // Add tracks one by one, checking length each time
    let tracksAdded = 0;
    for (const track of tracks.slice(0, 5)) {
      const trackLine = `\n• ${track.artist.name} - ${track.name}`;
      const testPost = post + trackLine + `\n\nGenerate yours: ${url}`;

      // Keep under 290 graphemes to be safe (300 is limit)
      if (countGraphemes(testPost) <= 290) {
        post += trackLine;
        tracksAdded++;
      } else {
        break;
      }
    }

    // If we couldn't add any tracks, remove the "Top tracks:" header
    if (tracksAdded === 0) {
      post = template(genre, emoji);
    }
  }

  post += `\n\nGenerate yours: ${url}`;

  // Final safety check - truncate if still too long
  if (countGraphemes(post) > 300) {
    post = truncateToGraphemes(post, 297) + '...';
  }

  return post;
}

// Count graphemes (extended grapheme clusters)
// This is a simplified version - for production use a library like grapheme-splitter
function countGraphemes(text) {
  // Use Intl.Segmenter if available (Node 16+)
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text)).length;
  }

  // Fallback: use string length (less accurate but safe)
  // This is conservative and may count some multi-byte chars as multiple graphemes
  return text.length;
}

// Truncate text to a specific grapheme count
function truncateToGraphemes(text, maxGraphemes) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    const segments = Array.from(segmenter.segment(text));

    if (segments.length <= maxGraphemes) {
      return text;
    }

    return segments.slice(0, maxGraphemes).map(s => s.segment).join('');
  }

  // Fallback: use substring
  return text.substring(0, maxGraphemes);
}

// Format stats post
export function formatStatsPost(totalCount, recentCount = null) {
  let post = `📊 Music Genre Stats 📊\n\n`;
  post += `Total genres generated: ${formatNumber(totalCount)}`;

  if (recentCount !== null) {
    post += `\nNew this week: ${formatNumber(recentCount)}`;
  }

  post += `\n\nWhat's your next genre? https://musicgenre.site`;

  // Safety check
  if (countGraphemes(post) > 300) {
    post = truncateToGraphemes(post, 297) + '...';
  }

  return post;
}

// Format milestone post
export function formatMilestonePost(count) {
  const emojis = '🎉🎊🎈';
  let post = `${emojis} MILESTONE ALERT ${emojis}\n\nWe just hit ${formatNumber(count)} randomly generated music genres!\n\nThank you for all the creative chaos.\n\nGenerate yours: https://musicgenre.site`;

  // Safety check
  if (countGraphemes(post) > 300) {
    post = truncateToGraphemes(post, 297) + '...';
  }

  return post;
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

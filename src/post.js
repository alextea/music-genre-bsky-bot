#!/usr/bin/env node
import dotenv from 'dotenv';
import { initBluesky, createPost } from './bluesky.js';
import { initDatabase, closeDatabase } from './database.js';
import { generateGenrePost, generateStatsPost, generateMilestonePost, shouldPostStats, checkMilestone } from './content.js';

// Load environment variables
dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  try {
    console.log('🤖 Music Genre Bluesky Bot Starting...\n');

    if (DRY_RUN) {
      console.log('🧪 DRY RUN MODE - No posts will be published\n');
    }

    // Initialize connections
    console.log('Connecting to database...');
    initDatabase();

    if (!DRY_RUN) {
      console.log('Authenticating with Bluesky...');
      await initBluesky();
    }

    console.log('');

    // Check for milestone
    console.log('Checking for milestones...');
    const milestone = await checkMilestone();

    if (milestone) {
      console.log(`🎉 Milestone detected: ${milestone} genres!\n`);
      const milestonePost = await generateMilestonePost(milestone);

      console.log('Generated milestone post:');
      console.log('─'.repeat(60));
      console.log(milestonePost.text);
      console.log('─'.repeat(60));
      console.log(`URL: ${milestonePost.url}`);
      console.log('');

      if (!DRY_RUN) {
        await createPost(
          milestonePost.text,
          milestonePost.url,
          milestonePost.embedTitle,
          milestonePost.embedDescription
        );
        console.log('✅ Milestone post published!\n');
      }
    } else if (shouldPostStats()) {
      // Sunday - post weekly stats
      console.log('📊 Sunday detected - posting weekly stats\n');
      const statsPost = await generateStatsPost();

      console.log('Generated stats post:');
      console.log('─'.repeat(60));
      console.log(statsPost.text);
      console.log('─'.repeat(60));
      console.log(`URL: ${statsPost.url}`);
      console.log('');

      if (!DRY_RUN) {
        await createPost(
          statsPost.text,
          statsPost.url,
          statsPost.embedTitle,
          statsPost.embedDescription
        );
        console.log('✅ Stats post published!\n');
      }
    } else {
      // Regular day - post random genre
      console.log('🎸 Generating random genre post...\n');
      const genrePost = await generateGenrePost();

      console.log('Generated genre post:');
      console.log('─'.repeat(60));
      console.log(genrePost.text);
      console.log('─'.repeat(60));
      console.log(`URL: ${genrePost.url}`);
      console.log('');

      if (!DRY_RUN) {
        await createPost(
          genrePost.text,
          genrePost.url,
          genrePost.embedTitle,
          genrePost.embedDescription
        );
        console.log('✅ Genre post published!\n');
      }
    }

    console.log('🎉 Bot completed successfully!');

  } catch (error) {
    console.error('❌ Error running bot:', error);
    process.exit(1);
  } finally {
    // Clean up database connection
    await closeDatabase();
  }
}

// Run the bot
main();

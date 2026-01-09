# Music Genre Bluesky Bot

Daily Bluesky bot that posts random music genres from [musicgenre.site](https://musicgenre.site) with Last.fm track listings.

## Features

- Posts random generated music genres daily at 2 PM UTC
- Includes top 5 Last.fm tracks for each genre
- Posts weekly statistics on Sundays
- Celebrates genre count milestones (every 5,000 genres)
- Social card previews with screenshots automatically
- Minimal compute usage (runs once and exits)

## Project Structure

```
bluesky-bot/
├── src/
│   ├── post.js           # Main entry point (run this)
│   ├── bluesky.js        # Bluesky API client
│   ├── content.js        # Content generation logic
│   └── database.js       # PostgreSQL database queries
├── templates/
│   └── post_templates.js # Post text templates
├── package.json
├── railway.json          # Railway cron configuration
└── .env.example          # Environment variables template
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd bluesky-bot
npm install
```

### 2. Configure Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` and add:

**Bluesky Credentials:**
- Go to https://bsky.app/settings/app-passwords
- Create a new app password
- Add your handle and app password to `.env`

```env
BLUESKY_IDENTIFIER=yourhandle.bsky.social
BLUESKY_PASSWORD=your-app-password-here
```

**Database Connection:**
- Copy `DATABASE_URL` from your Railway musicgenre.site project
- Should look like: `postgresql://user:pass@host:5432/database`

**Last.fm API:**
- Copy `LASTFM_API_KEY` from your musicgenre.site app

**Site URL:**
```env
SITE_URL=https://musicgenre.site
```

### 3. Test Locally

Run in dry-run mode to test without posting:

```bash
npm test
```

This will:
- Connect to the database
- Generate a post
- Display the content
- NOT publish to Bluesky

Run for real (will post to Bluesky):

```bash
npm start
```

## Deployment Options

### Option 1: Railway (Recommended)

Railway provides built-in cron scheduling and shares the database with your main app.

**Steps:**

1. **Create a new Railway service:**
   ```bash
   # In the bluesky-bot directory
   railway login
   railway init
   ```

2. **Link to your existing Railway project:**
   - Select "Link to existing project"
   - Choose your musicgenre.site project

3. **Set environment variables in Railway dashboard:**
   - `BLUESKY_IDENTIFIER`
   - `BLUESKY_PASSWORD`
   - `LASTFM_API_KEY` (copy from main app)
   - `SITE_URL` (copy from main app)
   - `DATABASE_URL` (copy from main app)
   - `NODE_ENV=production`

4. **Deploy:**
   ```bash
   railway up
   ```

5. **Configure cron:**
   The `railway.json` file configures a daily cron at 2 PM UTC (10 AM EST):
   ```json
   "crons": [
     {
       "name": "daily-genre-post",
       "schedule": "0 14 * * *",
       "command": "npm start"
     }
   ]
   ```

   To change the schedule, edit the cron expression:
   - `0 14 * * *` = 2 PM UTC daily
   - `0 10 * * *` = 10 AM UTC daily
   - `0 */6 * * *` = Every 6 hours

6. **Monitor logs:**
   ```bash
   railway logs
   ```

**Cost:** Free (minimal usage, runs ~5 seconds per day)

---

### Option 2: Fly.io

If you prefer using your existing Fly.io account:

1. **Create `fly.toml`:**
   ```toml
   app = "musicgenre-bluesky-bot"

   [build]

   [env]
     NODE_ENV = "production"

   [[services]]
     internal_port = 8080
     protocol = "tcp"
   ```

2. **Deploy:**
   ```bash
   fly launch
   fly secrets set BLUESKY_IDENTIFIER=yourhandle.bsky.social
   fly secrets set BLUESKY_PASSWORD=your-app-password
   fly secrets set DATABASE_URL=postgresql://...
   fly secrets set LASTFM_API_KEY=your-key
   fly secrets set SITE_URL=https://musicgenre.site
   ```

3. **Set up cron via Fly Machines API or external service**

---

### Option 3: Linux Web Host with Cron

1. **SSH into your server:**
   ```bash
   ssh user@yourserver.com
   ```

2. **Clone the repo:**
   ```bash
   git clone <your-repo-url> bluesky-bot
   cd bluesky-bot
   npm install
   ```

3. **Create `.env` file** with your credentials

4. **Add cron job:**
   ```bash
   crontab -e
   ```

   Add line (runs daily at 2 PM UTC):
   ```
   0 14 * * * cd /path/to/bluesky-bot && /usr/bin/node src/post.js >> /var/log/bluesky-bot.log 2>&1
   ```

5. **Monitor logs:**
   ```bash
   tail -f /var/log/bluesky-bot.log
   ```

---

### Option 4: GitHub Actions

1. **Create `.github/workflows/post.yml`:**
   ```yaml
   name: Daily Bluesky Post

   on:
     schedule:
       - cron: '0 14 * * *'  # 2 PM UTC daily
     workflow_dispatch:  # Allow manual trigger

   jobs:
     post:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '22'
         - run: npm ci
         - run: npm start
           env:
             BLUESKY_IDENTIFIER: ${{ secrets.BLUESKY_IDENTIFIER }}
             BLUESKY_PASSWORD: ${{ secrets.BLUESKY_PASSWORD }}
             DATABASE_URL: ${{ secrets.DATABASE_URL }}
             LASTFM_API_KEY: ${{ secrets.LASTFM_API_KEY }}
             SITE_URL: https://musicgenre.site
   ```

2. **Add secrets to GitHub repository settings:**
   - Go to Settings > Secrets and variables > Actions
   - Add: `BLUESKY_IDENTIFIER`, `BLUESKY_PASSWORD`, `DATABASE_URL`, `LASTFM_API_KEY`

3. **Push to GitHub** and the workflow will run automatically

**Cost:** Free (2,000 minutes/month)

---

## Posting Schedule

**Default schedule (Railway `railway.json`):**
- **Monday-Saturday:** Random genre with Last.fm tracks at 2 PM UTC
- **Sunday:** Weekly statistics at 2 PM UTC
- **Milestones:** Automatic detection when count hits 60k, 65k, 70k, etc.

**To change the posting time:**

Edit the cron expression in `railway.json`:
```json
"schedule": "0 14 * * *"
```

Cron format: `minute hour day month weekday`

Examples:
- `0 10 * * *` = 10 AM UTC (6 AM EST)
- `0 18 * * *` = 6 PM UTC (2 PM EST)
- `0 */6 * * *` = Every 6 hours
- `0 12,18 * * *` = Noon and 6 PM UTC

## Post Types

### Daily Genre Post
```
🎸 Today's genre: cosmic doom metal 🎸

Discovered on Last.fm:
• Sleep - Dopesmoker (1.2M listeners)
• Electric Wizard - Funereal (890K listeners)
• Om - Meditation Is the Practice of Death (450K listeners)
• Yob - The Great Cessation (380K listeners)
• Conan - Foehammer (210K listeners)

Generate yours: https://musicgenre.site/cosmic-doom-metal
```

### Weekly Stats (Sundays)
```
📊 Music Genre Stats 📊

Total genres generated: 55,806

What's your next genre? https://musicgenre.site
```

### Milestone Posts
```
🎉🎊🎈 MILESTONE ALERT 🎉🎊🎈

We just hit 60,000 randomly generated music genres!

Thank you for all the creative chaos.

Generate yours: https://musicgenre.site
```

## Social Card Previews

The bot includes the genre URL in each post. Bluesky automatically fetches and displays your existing screenshot images as rich social cards - no additional image handling required!

Your Open Graph meta tags from the main app handle this automatically.

## Troubleshooting

**Authentication Error:**
- Verify your Bluesky credentials in `.env`
- Make sure you're using an app password, not your main password
- Check that your handle includes `.bsky.social`

**Database Connection Error:**
- Verify `DATABASE_URL` is correct
- Check that Railway database allows external connections
- Ensure SSL mode is configured correctly

**No Last.fm Tracks:**
- Check that `LASTFM_API_KEY` is set
- Bot will still post without tracks if API fails

**Post Not Appearing:**
- Check Railway logs: `railway logs`
- Run manually with `npm start` to test
- Verify cron schedule is configured correctly

## Monitoring

**Railway:**
```bash
railway logs --tail
```

**Local dry run:**
```bash
npm test
```

**Check cron schedule:**
```bash
# Railway dashboard shows next scheduled run
# Or check railway.json configuration
```

## Future Enhancements

Ideas for extending the bot:

- Reply to mentions with custom genres
- Post genres as threads (main post + track list)
- Add hashtags (#MusicGenres, #RandomMusic)
- Track engagement metrics
- Allow follower requests for specific word combinations
- Cross-post to other platforms (Mastodon, Twitter)

## License

MIT

## Support

For issues or questions, open an issue on GitHub or contact [@yourhandle](https://bsky.app/profile/yourhandle.bsky.social) on Bluesky.

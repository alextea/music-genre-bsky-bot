import { AtpAgent, RichText } from '@atproto/api';

let agent;

export async function initBluesky() {
  if (!process.env.BLUESKY_IDENTIFIER || !process.env.BLUESKY_PASSWORD) {
    throw new Error('BLUESKY_IDENTIFIER and BLUESKY_PASSWORD environment variables are required');
  }

  agent = new AtpAgent({
    service: 'https://bsky.social'
  });

  await agent.login({
    identifier: process.env.BLUESKY_IDENTIFIER,
    password: process.env.BLUESKY_PASSWORD
  });

  console.log('✓ Authenticated with Bluesky');
  return agent;
}

export async function createPost(text, url = null, embedTitle = null, embedDescription = null) {
  if (!agent) {
    await initBluesky();
  }

  try {
    const rt = new RichText({ text });
    await rt.detectFacets(agent);

    const postRecord = {
      text: rt.text,
      facets: rt.facets,
      createdAt: new Date().toISOString()
    };

    // Add external link embed if URL provided
    if (url) {
      const external = await fetchLinkMetadata(url, embedTitle, embedDescription);
      postRecord.embed = {
        $type: 'app.bsky.embed.external',
        external
      };
    }

    const response = await agent.post(postRecord);
    console.log('✓ Post created successfully');
    return response;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}

/**
 * Fetch link metadata and upload image to Bluesky
 * This mimics what the Bluesky web app does when you paste a URL
 */
async function fetchLinkMetadata(url, fallbackTitle, fallbackDescription) {
  try {
    console.log('Fetching link card metadata...');

    // Fetch the webpage to extract Open Graph metadata
    const response = await fetch(url);
    const html = await response.text();

    // Extract Open Graph metadata
    const ogTitle = extractMetaTag(html, 'og:title') || extractMetaTag(html, 'twitter:title') || fallbackTitle || url;
    const ogDescription = extractMetaTag(html, 'og:description') || extractMetaTag(html, 'twitter:description') || fallbackDescription || '';
    const ogImage = extractMetaTag(html, 'og:image') || extractMetaTag(html, 'twitter:image');

    console.log(`✓ Title: "${ogTitle}"`);
    console.log(`✓ Description: "${ogDescription.substring(0, 50)}${ogDescription.length > 50 ? '...' : ''}"`);
    console.log(`✓ Image URL: ${ogImage || 'none'}`);

    const external = {
      uri: url,
      title: ogTitle,
      description: ogDescription
    };

    // If there's an image, fetch and upload it
    if (ogImage) {
      try {
        console.log('Fetching and uploading image...');
        const imageResponse = await fetch(ogImage);
        const imageBuffer = await imageResponse.arrayBuffer();
        const imageBlob = new Uint8Array(imageBuffer);

        // Determine mime type from response or default to jpeg
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

        // Upload the image to Bluesky
        const uploadResponse = await agent.uploadBlob(imageBlob, { encoding: mimeType });
        external.thumb = uploadResponse.data.blob;

        console.log('✓ Image uploaded successfully');
      } catch (imageError) {
        console.warn('Could not upload image:', imageError.message);
      }
    }

    return external;
  } catch (error) {
    console.warn('Could not fetch link metadata:', error.message);
    // Fallback to basic metadata
    return {
      uri: url,
      title: fallbackTitle || url,
      description: fallbackDescription || ''
    };
  }
}

/**
 * Extract meta tag content from HTML
 */
function extractMetaTag(html, property) {
  // Try property= first (for og: tags)
  let regex = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
  let match = html.match(regex);

  if (!match) {
    // Try name= (for twitter: tags and others)
    regex = new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
    match = html.match(regex);
  }

  if (!match) {
    // Try reversed order (content before property/name)
    regex = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`, 'i');
    match = html.match(regex);
  }

  if (!match) {
    regex = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`, 'i');
    match = html.match(regex);
  }

  return match ? match[1] : null;
}

export async function createThreadPost(posts) {
  if (!agent) {
    await initBluesky();
  }

  try {
    let parent = null;

    for (const postData of posts) {
      const rt = new RichText({ text: postData.text });
      await rt.detectFacets(agent);

      const postRecord = {
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString()
      };

      // Add reply reference if this is part of a thread
      if (parent) {
        postRecord.reply = {
          root: parent.root || parent.ref,
          parent: parent.ref
        };
      }

      // Add external embed if provided
      if (postData.url) {
        const external = await fetchLinkMetadata(postData.url, postData.embedTitle, postData.embedDescription);
        postRecord.embed = {
          $type: 'app.bsky.embed.external',
          external
        };
      }

      const response = await agent.post(postRecord);

      parent = {
        ref: {
          uri: response.uri,
          cid: response.cid
        },
        root: parent ? parent.root : {
          uri: response.uri,
          cid: response.cid
        }
      };

      console.log(`✓ Thread post ${posts.indexOf(postData) + 1}/${posts.length} created`);
    }

    return parent;
  } catch (error) {
    console.error('Error creating thread:', error);
    throw error;
  }
}

export function getAgent() {
  return agent;
}

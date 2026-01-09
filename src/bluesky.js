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
      postRecord.embed = {
        $type: 'app.bsky.embed.external',
        external: {
          uri: url,
          title: embedTitle || url,
          description: embedDescription || ''
        }
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
        postRecord.embed = {
          $type: 'app.bsky.embed.external',
          external: {
            uri: postData.url,
            title: postData.embedTitle || postData.url,
            description: postData.embedDescription || ''
          }
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

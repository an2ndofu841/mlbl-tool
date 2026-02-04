import { TwitterApi } from 'twitter-api-v2';

const getXClient = () => {
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    throw new Error('Missing X API environment variables.');
  }

  return new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken,
    accessSecret: accessTokenSecret,
  });
};

export const postTweet = async (text: string, imageUrl?: string | null) => {
  const client = getXClient();
  let mediaId: string | undefined;

  if (imageUrl) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    mediaId = await client.v1.uploadMedia(buffer, { mimeType: contentType });
  }

  if (mediaId) {
    await client.v2.tweet({
      text,
      media: { media_ids: [mediaId] },
    });
    return;
  }

  await client.v2.tweet(text);
};

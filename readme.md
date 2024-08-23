# bundle.social SDK
Node.js SDK for [bundle.social](https://bundle.social) API.

## Installation

```bash
npm install bundlesocial
yarn add bundlesocial
pnpm add bundlesocial
```

> !!! Make sure you have created a team on [bundle.social](https://bundle.social) and have an generated API key. !!!

## Setup
```ts
import { BundleSocial } from 'bundlesocial';

// Get the API key from the bundle.social dashboard
const bundleSocial = new BundleSocial('YOUR_API_KEY');
```

## Usage
### Get the team information
```ts
const team = await bundlesocial.team.teamGetTeam();
```

### Upload a file
```ts
const video = await fs.readFile('./video.mp4');
const videoUpload = await bundlesocial.upload.uploadCreate({
  formData: {
    file: new Blob([video], { type: 'video/mp4' }),
  }
});

const jpgImage = await fs.readFile('./image.jpg');
const jpgUpload = await bundlesocial.upload.uploadCreate({
  formData: {
    file: new Blob([jpgImage], { type: 'image/jpeg' }),
  }
});
```

### Create a post
```ts
// Make sure you have uploaded the file before creating a post.
// Make sure you have connected a social account to the team.
const createdPost = await bundlesocial.post.postCreate({
  requestBody: {
    data: {
      INSTAGRAM: {
        text: 'Test Post',
        type: 'REEL',
        uploadIds: [
          videoUpload?.id
        ]
      },
      YOUTUBE: {
        text: 'Test Post',
        type: 'SHORT',
        madeForKids: false,
        uploadIds: [
          videoUpload?.id
        ],
        privacyStatus: 'PUBLIC',
      },
      TIKTOK: {
        text: 'Test Post',
        uploadIds: [
          videoUpload?.id
        ],
        privacy: 'PUBLIC_TO_EVERYONE',
      },
      REDDIT: {
        sr: 'r/bundlesocial',
        text: 'Test Post',
        uploadIds: [
          jpgUpload.id
        ],
      },
    },
    postDate: new Date().toISOString(),
    socialAccountTypes: ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'REDDIT'],
    status: 'SCHEDULED',
    title: 'Test Post',
  }
});
```

### Get the post information
```ts
const post = await bundlesocial.post.postGet({
  id: createdPost.id,
});
```

## Handling errors
```ts
try {
  const team = await bundlesocial.team.teamGetTeam();
} catch (error) {
  if (error instanceof ApiError) {
    // Handle the error
    console.log(error?.status, error?.statusText, error?.body);
  } else {
    throw error;
  }
}
```

## Handling webhook events
```ts
// this is a simple example using express
app.post('/webhook', express.json({ type: 'application/json' }), (req, res) => {
  const bundlesocial = new Bundlesocial(apiKey);
  const signature = req.headers['x-signature'];

  let event: WebhookEvent;

  try {
    // Verify the webhook signature and return a typed event
    event = bundlesocial.webhooks.constructEvent(
      req.body,
      signature as string,
      secret,
    );
    // Do something with the event
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err);
    return res.sendStatus(400);
  }

  return res.send();
});
```

## License
MIT
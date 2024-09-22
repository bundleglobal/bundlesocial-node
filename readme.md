# bundle.social SDK
Node.js SDK for [bundle.social](https://bundle.social) API.

Check out our detailed docs here [https://info.bundle.social/api-reference/sdk](https://info.bundle.social/api-reference/sdk)

## Installation

```bash
npm install bundlesocial
yarn add bundlesocial
pnpm add bundlesocial
```

> !!! Make sure you have generated an API key on [bundle.social](https://bundle.social). !!!

## Setup
```ts
import { BundleSocial } from 'bundlesocial';

// Get the API key from the bundle.social dashboard
const bundleSocial = new BundleSocial('YOUR_API_KEY');
```

## Usage
```ts
// Make sure you have uploaded the file before creating a post.
// Make sure you have connected a social account to the team.
const createdPost = await bundlesocial.post.postCreate({
  requestBody: {
    teamId: team.id,
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

## License
MIT

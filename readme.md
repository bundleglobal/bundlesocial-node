# bundle.social SDK
Node.js SDK for [bundle.social](https://bundle.social) API.

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
### Get the organization information
```ts
const organization = await bundlesocial.organization.organizationGetOrganization();
```

### Create a team
```ts
const createdTeam = await bundlesocial.team.teamCreateTeam({
  requestBody: {
    name: 'Test Team',
    tier: 'FREE',
  },
});
```

### Get the team information
```ts
const team = await bundlesocial.team.teamGetTeam({
  id: createdTeam?.id,
});
```

### Manage social accounts (needed for product integration only)
If you can connect social accounts directly through our web app, you can skip this step.

For more info check out our docs: [https://info.bundle.social/api-reference](https://info.bundle.social/api-reference)

#### Connect social account
```ts
const response = await bundlesocial.socialAccount.socialAccountConnect({
  requestBody: {
    type: 'TIKTOK',
    teamId: team.id,
    redirectUrl: 'https://your-redirect-url.com',
  }
});

// Redirect the user to the response.url
// After the user has connected the account, the user will be redirected to the redirectUrl
```

#### Select page, account or channel (required for FACEBOOK, INSTAGRAM, YOUTUBE and LINKEDIN)
After the user has connected the account and was redirected to your page, you can let the user select the page, account or channel. We unified the data for all platforms. Each social account has a `channels` field, that is an array of their channels (pages, accounts, channels depending on the platform).

```ts
const team = await bundlesocial.team.teamGetTeam({
  id: team.id,
});

const socialAccount = team?.socialAccounts?.find((account) => account.type === 'YOUTUBE');
const socialAccountChannelId = socialAccount?.channels?.[0]?.id;

if (socialAccountChannelId) {
  await bundlesocial.socialAccount.socialAccountSetChannel({
    requestBody: {
      type,
      teamId: team.id,
      channelId: socialAccountChannelId,
    }
  });
}
```


### Upload a file
```ts
const video = await fs.readFile('./video.mp4');
const videoUpload = await bundlesocial.upload.uploadCreate({
  formData: {
    teamId: team.id,
    file: new Blob([video], { type: 'video/mp4' }),
  }
});

const jpgImage = await fs.readFile('./image.jpg');
const jpgUpload = await bundlesocial.upload.uploadCreate({
  formData: {
    teamId: team.id,
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

### Get the post information
```ts
const post = await bundlesocial.post.postGet({
  id: createdPost.id,
});
```

## Handling errors
```ts
try {
  const organization = await bundlesocial.organization.organizationGetOrganization();
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

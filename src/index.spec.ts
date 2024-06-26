import fs from 'node:fs/promises';
import { ApiError, Bundlesocial, type PostCreateResponse, type UploadGetResponse } from '../dist';
import 'dotenv/config';

if (!process.env.BUNDLE_SOCIAL_API_KEY) {
  throw new Error('BUNDLE_SOCIAL_API_KEY env var is required');
}

const bundlesocial = new Bundlesocial(process.env.BUNDLE_SOCIAL_API_KEY);

// APP
describe('App', () => {
  describe('appGetHealth', () => {
    it('should return ok status', async () => {
      expect.assertions(1);
      try {
        const response = await bundlesocial.app.appGetHealth();
        
        expect(response).toMatchObject({
          status: expect.any(String),
          createdAt: expect.any(String),
        });
      } catch (error) {
        if (error instanceof ApiError) {
          console.error(error);
        }
        throw error;
      }
    });
  });
});

// TEAM
describe('Team', () => {
  describe('teamGetTeam', () => {
    it('should return a team', async () => {
      expect.assertions(1);
      try {
        const response = await bundlesocial.team.teamGetTeam();
        
        expect(response).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          users: expect.arrayContaining([]),
          createdById: expect.any(String),
          createdBy: expect.any(Object),
          invitations: expect.arrayContaining([]),
          bots: expect.arrayContaining([]),
          socialAccounts: expect.arrayContaining([]),
          usage: {
            monthlyPosts: expect.any(Number),
          }
        });
      } catch (error) {
        if (error instanceof ApiError) {
          console.error(error);
        }
        throw error;
      }
    });
  });
});


type UploadMatcher = Partial<Record<keyof UploadGetResponse, jest.Expect | string | number>>;
const uploadMatcher: UploadMatcher = {
  id: expect.any(String),
  teamId: expect.any(String),
  type: expect.any(String),
  mime: expect.any(String),
  ext: expect.any(String),
  iconUrl: expect.any(String),
  thumbnailUrl: expect.any(String),
  url: expect.any(String),
  iconPath: expect.any(String),
  thumbnailPath: expect.any(String),
}
const jpgUploadMatcher: UploadMatcher = {
  ...uploadMatcher,
  type: 'image',
  mime: 'image/jpeg',
  ext: 'jpg',
};
const pngUploadMatcher: UploadMatcher = {
  ...uploadMatcher,
  type: 'image',
  mime: 'image/png',
  ext: 'png',
};
const videoUploadMatcher: UploadMatcher = {
  ...uploadMatcher,
  type: 'video',
  mime: 'video/mp4',
  ext: 'mp4',
};

// UPLOADS
describe('Uploads', () => {
  describe('create and delete and upload', () => {
    it('should create and then delete jpg upload', async () => {
      expect.assertions(3);
      try {
        const jpgImage = await fs.readFile('./src/test/jpg-square.jpg');
        const createdUpload = await bundlesocial.upload.uploadCreate({
          formData: {
            file: new Blob([jpgImage], { type: 'image/jpeg' }),
          }
        });
        expect(createdUpload).toMatchObject(jpgUploadMatcher);

        const upload = await bundlesocial.upload.uploadGet({
          id: createdUpload.id,
        });
        expect(upload).toMatchObject(jpgUploadMatcher);

        const deletedUpload = await bundlesocial.upload.uploadDelete({
          id: createdUpload.id,
        });
        expect(deletedUpload).toMatchObject(jpgUploadMatcher);      
      } catch (error) {
        if (error instanceof ApiError) {
          console.error(error);
        }
        throw error;
      }
    });
  });

  describe('should create and then delete png upload', () => {
    it('should create and then delete png upload', async () => {
      expect.assertions(3);
      try {
        const pngImage = await fs.readFile('./src/test/png-square.png');
        const createdUpload = await bundlesocial.upload.uploadCreate({
          formData: {
            file: new Blob([pngImage], { type: 'image/png' }),
          }
        });
        expect(createdUpload).toMatchObject(pngUploadMatcher);

        const upload = await bundlesocial.upload.uploadGet({
          id: createdUpload.id,
        });
        expect(upload).toMatchObject(pngUploadMatcher);

        const deletedUpload = await bundlesocial.upload.uploadDelete({
          id: createdUpload.id,
        });
        expect(deletedUpload).toMatchObject(pngUploadMatcher);
      } catch (error) {
        if (error instanceof ApiError) {
          console.error(error);
        }
        throw error;
      }
    });        
  });

  describe('should create and then delete video upload', () => {
    it('should create and then delete video upload', async () => {
      expect.assertions(3);
      try {
        const video = await fs.readFile('./src/test/mp4-horizontal.mp4');
        const createdUpload = await bundlesocial.upload.uploadCreate({
          formData: {
            file: new Blob([video], { type: 'video/mp4' }),
          }
        });
        expect(createdUpload).toMatchObject(videoUploadMatcher);

        const upload = await bundlesocial.upload.uploadGet({
          id: createdUpload.id,
        });
        expect(upload).toMatchObject(videoUploadMatcher);

        const deletedUpload = await bundlesocial.upload.uploadDelete({
          id: createdUpload.id,
        });
        expect(deletedUpload).toMatchObject(videoUploadMatcher);         
      } catch (error) {
        if (error instanceof ApiError) {
          console.error(error);
        }
        throw error;
      }
    });
  });

  describe('should create and then delete many uploads', () => {
    it('should create and then delete many uploads', async () => {
      expect.assertions(5);
      try {
        const jpgImage = await fs.readFile('./src/test/jpg-square.jpg');
        const createdJpgUpload = await bundlesocial.upload.uploadCreate({
          formData: {
            file: new Blob([jpgImage], { type: 'image/jpeg' }),
          }
        });
        expect(createdJpgUpload).toMatchObject(jpgUploadMatcher);

        const pngImage = await fs.readFile('./src/test/png-square.png');
        const createdPngUpload = await bundlesocial.upload.uploadCreate({
          formData: {
            file: new Blob([pngImage], { type: 'image/png' }),
          }
        });
        expect(createdPngUpload).toMatchObject(pngUploadMatcher);

        const video = await fs.readFile('./src/test/mp4-horizontal.mp4');
        const createdVideoUpload = await bundlesocial.upload.uploadCreate({
          formData: {
            file: new Blob([video], { type: 'video/mp4' }),
          }
        });
        expect(createdVideoUpload).toMatchObject(videoUploadMatcher);

        const uploads = await bundlesocial.upload.uploadGetList();

        expect(uploads).toEqual(expect.arrayContaining([
          expect.objectContaining(jpgUploadMatcher),
          expect.objectContaining(pngUploadMatcher),
          expect.objectContaining(videoUploadMatcher),
        ]));

        const deletedUploads = await bundlesocial.upload.uploadDeleteMany({
          requestBody: {
            ids: [createdJpgUpload.id, createdPngUpload.id, createdVideoUpload.id],
          }
        });
        expect(deletedUploads).toEqual(expect.arrayContaining([
          expect.objectContaining(jpgUploadMatcher),
          expect.objectContaining(pngUploadMatcher),
          expect.objectContaining(videoUploadMatcher),
        ]));  
      } catch (error) {
        if (error instanceof ApiError) {
          console.error(error);
        }
        throw error;
      }
    });
  });
});

type PostMatcher = Partial<Record<keyof PostCreateResponse, jest.Expect | string | number>>;
const postMatcher: PostMatcher = {
  id: expect.any(String),
  teamId: expect.any(String),
  title: expect.any(String),
  status: expect.any(String),
  data: expect.objectContaining({
    FACEBOOK: expect.objectContaining({
      text: expect.any(String),
      type: expect.any(String),
    }),
  }),
};
const postMatcherWithUploads: PostMatcher = {
  ...postMatcher,
  data: expect.objectContaining({
    FACEBOOK: expect.objectContaining({
      text: expect.any(String),
      type: expect.any(String),
      uploadIds: expect.arrayContaining([expect.any(String)])
    }),
  })
};
// POST
describe('Post', () => {
  describe('create post without image or video and then delete it', () => {
    expect.assertions(3);
    it('should create and then delete post without image or video', async () => {
      try {
        const createdPost = await bundlesocial.post.postCreate({
          requestBody: {
            data: {
              FACEBOOK: {
                text: 'Hello, world!',
                type: 'POST',
                uploadIds: [],
              },
            },
            postDate: new Date().toISOString(),
            socialAccountTypes: ['FACEBOOK'],
            status: 'DRAFT',
            title: 'Hello, world!',
          }
        });

        expect(createdPost).toMatchObject(postMatcher);

        const post = await bundlesocial.post.postGet({
          id: createdPost.id,
        });

        expect(post).toMatchObject(postMatcher);

        const deletedPost = await bundlesocial.post.postDelete({
          id: createdPost.id,
        });

        expect(deletedPost).toMatchObject(postMatcher);         
      } catch (error) {
        if (error instanceof ApiError) {
          console.error(error);
        }
        throw error;
      }
    }); 
  });
  describe('create post with image and then delete it', () => {
    it('should create and then delete post with image', async () => {
      expect.assertions(4);
      try {
        const jpgImage = await fs.readFile('./src/test/jpg-square.jpg');
        const createdJpgUpload = await bundlesocial.upload.uploadCreate({
          formData: {
            file: new Blob([jpgImage], { type: 'image/jpeg' }),
          }
        });
        expect(createdJpgUpload).toMatchObject(jpgUploadMatcher);

        const createdPost = await bundlesocial.post.postCreate({
          requestBody: {
            data: {
              FACEBOOK: {
                text: 'Hello, world!',
                type: 'POST',
                uploadIds: [createdJpgUpload.id],
              },
            },
            postDate: new Date().toISOString(),
            socialAccountTypes: ['FACEBOOK'],
            status: 'DRAFT',
            title: 'Hello, world!',
          }
        });

        expect(createdPost).toMatchObject(postMatcherWithUploads);

        const post = await bundlesocial.post.postGet({
          id: createdPost.id,
        });

        expect(post).toMatchObject(postMatcherWithUploads);

        const deletedPost = await bundlesocial.post.postDelete({
          id: createdPost.id,
        });

        expect(deletedPost).toMatchObject(postMatcherWithUploads);  
      } catch (error) {
        if (error instanceof ApiError) {
          console.error(error);
        }
        throw error;
      }
    });
  });
  describe('create post with video and then delete it', () => {
    it('should create and then delete post with video', async () => {
      expect.assertions(4);
      try {
        const video = await fs.readFile('./src/test/mp4-horizontal.mp4');
        const createdVideoUpload = await bundlesocial.upload.uploadCreate({
          formData: {
            file: new Blob([video], { type: 'video/mp4' }),
          }
        });
        expect(createdVideoUpload).toMatchObject(videoUploadMatcher);

        const createdPost = await bundlesocial.post.postCreate({
          requestBody: {
            data: {
              FACEBOOK: {
                text: 'Hello, world!',
                type: 'POST',
                uploadIds: [createdVideoUpload.id],
              },
            },
            postDate: new Date().toISOString(),
            socialAccountTypes: ['FACEBOOK'],
            status: 'DRAFT',
            title: 'Hello, world!',
          }
        });

        expect(createdPost).toMatchObject(postMatcherWithUploads);

        const post = await bundlesocial.post.postGet({
          id: createdPost.id,
        });

        expect(post).toMatchObject(postMatcherWithUploads);

        const deletedPost = await bundlesocial.post.postDelete({
          id: createdPost.id,
        });

        expect(deletedPost).toMatchObject(postMatcherWithUploads);         
      } catch (error) {
        if (error instanceof ApiError) {
          console.error(error);
        }
        throw error;
      }
    });
  });
  describe('create many posts and then delete it', () => {
    it('should create and then delete many posts', async () => {
      expect.assertions(7);
      try {
        const jpgImage = await fs.readFile('./src/test/jpg-square.jpg');
        const createdJpgUpload = await bundlesocial.upload.uploadCreate({
          formData: {
            file: new Blob([jpgImage], { type: 'image/jpeg' }),
          }
        });
        expect(createdJpgUpload).toMatchObject(jpgUploadMatcher);

        const video = await fs.readFile('./src/test/mp4-horizontal.mp4');
        const createdVideoUpload = await bundlesocial.upload.uploadCreate({
          formData: {
            file: new Blob([video], { type: 'video/mp4' }),
          }
        });
        expect(createdVideoUpload).toMatchObject(videoUploadMatcher);

        const createdPost1 = await bundlesocial.post.postCreate({
          requestBody: {
            data: {
              FACEBOOK: {
                text: 'Hello, world!',
                type: 'POST',
                uploadIds: [createdJpgUpload.id],
              },
            },
            postDate: new Date().toISOString(),
            socialAccountTypes: ['FACEBOOK'],
            status: 'DRAFT',
            title: 'Hello, world!',
          }
        });

        expect(createdPost1).toMatchObject(postMatcherWithUploads);

        const createdPost2 = await bundlesocial.post.postCreate({
          requestBody: {
            data: {
              FACEBOOK: {
                text: 'Hello, world!',
                type: 'POST',
                uploadIds: [createdVideoUpload.id],
              },
            },
            postDate: new Date().toISOString(),
            socialAccountTypes: ['FACEBOOK'],
            status: 'DRAFT',
            title: 'Hello, world!',
          }
        });

        expect(createdPost2).toMatchObject(postMatcherWithUploads);

        const posts = await bundlesocial.post.postGetList({
          offset: 0,
          limit: 10,
        });

        expect(posts).toMatchObject({
          items: expect.arrayContaining([
            expect.objectContaining(postMatcherWithUploads),
            expect.objectContaining(postMatcherWithUploads),
          ]),
          total: expect.any(Number),
        });

        const deletedPost1 = await bundlesocial.post.postDelete({
          id: createdPost1.id,
        });
        const deletedPost2 = await bundlesocial.post.postDelete({
          id: createdPost2.id,
        });
        expect(deletedPost1).toMatchObject(postMatcherWithUploads);
        expect(deletedPost2).toMatchObject(postMatcherWithUploads);
      } catch (error) {
        if (error instanceof ApiError) {
          console.error(error);
        }
        throw error;
      }
    });
  });
});

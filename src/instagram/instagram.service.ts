import { Injectable, Logger } from '@nestjs/common';
import { igApi, getCookie } from 'insta-fetcher';
import { InstagramDBService } from '../services/db/instagram-db.service';
import { TInstagramPost } from '../types/instagram';
import { IPaginatedPosts } from 'insta-fetcher/dist/types/PaginatedPosts';

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);
  private ig: igApi;

  constructor(private readonly instagramDBService: InstagramDBService) {}

  private async connect() {
    const sessionId = await this.getSessionId();

    if (sessionId) {
      this.ig = new igApi(sessionId.id, false);
    } else {
      await this.setSessionId();
      await this.connect();
    }
  }

  async getSessionId() {
    try {
      return this.instagramDBService.getSessionId();
    } catch (e) {
      this.logger.error(e);
    }
  }

  async setSessionId() {
    try {
      const instagramLogin = process.env.INSTAGRAM_LOGIN;
      const instagramPassword = process.env.INSTAGRAM_PASSWORD;
      if (!instagramLogin || !instagramPassword) {
        return new Error('Env variables are not exist');
      }
      const newSessionId = (await getCookie(
        instagramLogin,
        instagramPassword,
      )) as string;
      const timestamp = Date.now();

      await this.instagramDBService.setSessionId(newSessionId, timestamp);
    } catch (e) {
      console.log(e);
    }
  }

  async getPosts(instagramAccount: string) {
    await this.connect();

    if (this.ig) {
      try {
        const response = await this.ig.fetchUserPostsV2(instagramAccount);
        return this.savePosts(instagramAccount, response);
      } catch (e) {
        this.logger.error(e);
        return e;
      }
    }
  }

  private proceedPosts(paginatedPosts: IPaginatedPosts): TInstagramPost[] {
    return paginatedPosts.edges.map(({ node: post }) => {
      return {
        id: post.id,
        __typename: post.__typename,
        is_video: post.is_video,
        video_url: post.video_url,
        display_url: post.display_url,
        taken_at_timestamp: post.taken_at_timestamp,
        product_type: post.product_type,
        media: post.edge_sidecar_to_children
          ? post.edge_sidecar_to_children.edges.map(
              ({ node }) => node.display_url,
            )
          : [],
        ...(post?.edge_media_to_caption?.edges[0]?.node?.text && {
          caption: post.edge_media_to_caption.edges[0].node.text,
        }),
        text: post.edge_media_to_caption.edges[0].node.text || '',
      };
    });
  }

  async savePosts(instagramAccount: string, posts: IPaginatedPosts) {
    try {
      const updatedPosts = this.proceedPosts(posts);
      await this.instagramDBService.setPosts(instagramAccount, updatedPosts);

      return updatedPosts;
    } catch (error) {
      this.logger.error(error);
    }
  }

  async removePosts() {
    try {
      this.instagramDBService.removePosts();
    } catch (e) {
      this.logger.error(e);
    }
  }

  async getNextPost(userId: number, channel: string) {
    try {
      return this.instagramDBService.getNextPost(userId, channel);
    } catch (e) {
      this.logger.error(e);
    }
  }
  async getLastPublishedPost(userId: number, channel: string) {
    try {
      return this.instagramDBService.getLastPublishedPost(userId, channel);
    } catch (e) {
      this.logger.error(e);
    }
  }
}
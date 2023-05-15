import {Body, Controller, Get, Logger, Param, Query} from "@nestjs/common";
import {InstagramApiService} from "./instagram-api.service";
import {Cron} from "@nestjs/schedule";
import {isProduction} from "../helpers/node-env";
import {InstagramDBService} from "./instagram-db.service";
import {FirebaseService} from "../services/firebase.service";

@Controller()
export class InstagramController {
  private readonly logger = new Logger(InstagramApiService.name);

  constructor(
    private readonly instagramApiService: InstagramApiService,
    private readonly instagramDBService: InstagramDBService,
    private readonly firebaseService: FirebaseService,
  ) {}

  @Get('get-posts')
  async getPostsManual(@Query() query: { [key: string]: string }) {
    try {
      const response = await this.instagramApiService.getPosts(query.account);
      this.logger.debug('getPostsManual in InstagramController');
      this.logger.debug(response);
      return response;
    } catch(e) {
      this.logger.error(e)
      return e;
    }
  }

  @Get('remove-posts')
  async removePosts() {
    try {
      this.instagramApiService.removePosts();

      return 'Posts removed'
    } catch(e) {
      this.logger.error(e)
    }
  }
}

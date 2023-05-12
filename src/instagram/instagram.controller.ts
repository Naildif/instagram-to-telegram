import {Controller, Logger} from "@nestjs/common";
import {InstagramApiService} from "./instagram-api.service";
import {Cron} from "@nestjs/schedule";

@Controller()
export class InstagramController {
  private readonly logger = new Logger(InstagramApiService.name);

  constructor(
    private readonly instagramApiService: InstagramApiService,
  ) {
    // this.getPosts();
  }

  @Cron('* */29 * * * *')
  async getPosts() {
    try {
      this.instagramApiService.getPosts();
    } catch(e) {
      this.logger.error(e)
    }
  }
}

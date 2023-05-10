import {Injectable, Logger} from "@nestjs/common";
import {TelegramApiService} from "./telegram-api.service";
import {Cron} from "@nestjs/schedule";
import {TelegramMethod} from "../types/telegram";
import {InjectModel} from "@nestjs/mongoose";
import {InstagramPost} from "../instagram/instagram-post.schema";
import {Model} from "mongoose";

@Injectable()
export class TelegramSendMessagesService {
  constructor(
    private readonly telegramApiService: TelegramApiService,
    @InjectModel(InstagramPost.name) private readonly instagramPostModel: Model<InstagramPost>,
    ) {}

  private readonly logger = new Logger(TelegramSendMessagesService.name);

  async getPost() {
    console.log('sdss');
    try {
      const resp = await this.instagramPostModel.aggregate<InstagramPost>([
        {$match: { posted: false }},
        {$unwind: '$taken_at_timestamp'},
        {$sort: {'taken_at_timestamp': 1}},
        {$limit: 1},
      ])

      return resp && resp[0] || false;
    } catch (error) {
      this.logger.error(error)
      return false
    }
  }

  // @Cron('*/20 * * * * *')
  async handleCron() {
    const newPost = await this.getPost()

    if (newPost) {
      this.sendPost(newPost);
    }
  }

  async sendPost(post: InstagramPost) {
    let data: {
      media?: string;
      photo?: string;
      video?: string;
    } = {};
    let header = undefined;
    let media = [];

    if (post.media.length === 0) {
      if (post.is_video) {
        header = TelegramMethod.SendVideo
        data.video = post.video_url
      } else {
        header = TelegramMethod.SendPhoto
        data.photo = post.display_url
      }
    } else {
      header = TelegramMethod.SendMediaGroup;

      if (post.is_video) {
        media = [{ type: 'photo', media: post.video_url}, ...post.media.map(item => ({ type: 'photo', media: item }))];
      } else {
        media = post.media.map(item => ({ type: 'photo', media: item }))
      }

      data.media = JSON.stringify(media)
    }

    try {
      const response = await this.telegramApiService.sendRequest(header, {
        chat_id: '@rihanna_instagram',
        caption: post.caption,
        ...data,
      });

      if (response.data.ok) {
        this.setPosted(post.id)
      }
    } catch (error) {
      this.logger.error(error)
    }
  }

  async setPosted(id) {
    try {
      const post = await this.instagramPostModel.updateOne({ id },
        { posted: true, postedDate: Date.now()});
    } catch(error) {
      this.logger.error(error);
    }
  }
}
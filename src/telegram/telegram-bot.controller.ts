import {Controller, Logger} from '@nestjs/common';
import Context, {NarrowedContext, Telegraf, Telegram } from 'telegraf';
import { message } from 'telegraf/filters';

@Controller('telegram-bot')
export class TelegramBotController {
  private readonly logger: Logger = new Logger(TelegramBotController.name);
  private bot: Telegraf;

  constructor() {
    this.initialize();
  }

  initialize() {
    this.bot = new Telegraf(process.env.TELEGRAM_TOKEN);

    this.applyCommands()

    this.bot.launch();
  }

  applyCommands() {
    this.onStart();
    this.bot.help((ctx) => ctx.reply('Send me a sticker'));
    this.bot.settings((ctx) => ctx.reply('Send me a settings'));
    this.bot.on(message('sticker'), (ctx) => ctx.reply('👍'));
    this.bot.hears('hi', (ctx) => ctx.reply('Hey there'));
  }

  stopBotOnAppStop() {
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }

  onStart() {
    this.bot.start(async ctx => {
      const getChat = await ctx.getChat(); // get user data
      this.saveUser(getChat)

      ctx.reply(`Welcome! I am InstaParser Bot!
      I can parse instagram posts and reels and post them into your channel.
      `)

      ctx.reply(`Add me to your group with admin rights and tell me instagram account which you want to parse.
      Format: https://www.instagram.com/rihannaofficiall/ or rihannaofficiall`)
    });
  }

  saveUser(getChat) {
    const { id, first_name: firstName, last_name: lastName, username, type, active_usernames: activeUsernames} = getChat;
  }
}
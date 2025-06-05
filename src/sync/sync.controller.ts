import { Body, Controller, Post } from "@nestjs/common";
import { Cookies } from "src/decorators/cookie.decorator";
import { User } from "src/decorators/user.docorator";
import { SyncService } from "./sync.service";

@Controller('api')
export class SyncController {
  constructor(private syncService: SyncService) {}
  @Post('/sync')
  async sync(@User() user: any, @Cookies('githubAccessToken') accessToken: string, @Body('notes') notes: any) {
    if (!notes) {
      throw Error('nos')
    }
    await this.syncService.sync(user, accessToken, notes);
  }

  @Post('/sync/notes')
  async getNotes(@User() user: any, @Cookies('githubAccessToken') accessToken: string) {
    return await this.syncService.getNotes(accessToken, user);
  }
}
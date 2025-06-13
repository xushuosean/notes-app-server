import { Body, Controller, Get, Post, Query, Res } from "@nestjs/common";
import { Response } from 'express';
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

  @Get('/sync/get/repos')
  async getRepos(@Cookies('githubAccessToken') accessToken: string, @Query('pageNum') pageNum: number, @Query('pageSize') pageSize: number) {
    return await this.syncService.getRepos(accessToken, pageNum, pageSize);
  }

  @Get('/sync/get/repo/detail')
  async getRepoDetail(
    @User() user: any, @Cookies('githubAccessToken') accessToken: string, @Query('repo') repo: string, @Query('path') path: string = ''
  ) {
    return await this.syncService.getRepoPath(accessToken, user, repo, path);
  }

  @Post('/sync/save/path')
  async saveDataRepo(
    @Body('dataPath') dataPath: string,
    @Res({ passthrough: true }) response: Response
  ) {
    const cookieOptions = this.syncService.saveDataRepo(dataPath);
    response.cookie(cookieOptions.name, cookieOptions.value, cookieOptions.options);
  }
}
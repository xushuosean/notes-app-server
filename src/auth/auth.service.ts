import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { scratchpadNote } from '../utils/data/scratchpadNote';
import { welcomeNote } from '../utils/data/welcomeNote';

const dataRepoName = 'notes-data';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(private readonly httpService: HttpService, private configService: ConfigService) {
  }
  async getAuthCallback(code: string) {
    const clientId = this.configService.get<string>('clientId');
    const clientSecret = this.configService.get<string>('clientSecret');

    const { data } = await firstValueFrom(this.httpService.post(`https://github.com/login/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`, null, {
      headers: {
        accept: 'application/json',
      },
    }))

    return {
      name: 'githubAccessToken',
      value: data.access_token,
      options: {
        httpOnly: true,
        maxAge: 86400000,
        secure: process.env.NODE_ENV === 'production',
      },
    };
  }

  async getAuthLogin(accessToken: string) {
    try {
      const { data } = await firstValueFrom(this.httpService.get('https://api.github.com/user', {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      }));
      this.logger.log(data.login)
      const username = data.login;

      const isFirstTimeLoggingIn = await this.firstTimeLoginCheck(username, accessToken)

      if (isFirstTimeLoggingIn) {
        await this.createNotesDataRepo(username, accessToken)
        await this.createInitialCommit(username, accessToken)
      }
    } catch (err) {
      this.logger.log('user error', err)
    }
  }

  async firstTimeLoginCheck(username: string, accessToken: string) {
    try {
      // await SDK(Method.GET, `/repos/${username}/takenote-data`, accessToken)
      await firstValueFrom(this.httpService.get(`https://api.github.com/repos/${username}/${dataRepoName}`, {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      }))
      // If repo already exists, we assume it's the takenote data repo and can move on
      return false
    } catch (error) {
      // If repo doesn't exist, we'll try to create it
      return true
    }
  }

  async createNotesDataRepo(username: string, accessToken: string) {
    const notesDataRepo = {
      name: dataRepoName,
      description: 'Database of notes for notes',
      private: true,
      visibility: 'private',
      has_issues: false,
      has_projects: false,
      has_wiki: false,
      is_template: false,
      auto_init: false,
      allow_squash_merge: false,
      allow_rebase_merge: false,
    }
    try {
      await firstValueFrom(this.httpService.post(`https://api.github.com/user/repos`, notesDataRepo, {
        headers: {
          Authorization: `token ${accessToken}`,
        }
      }))
    } catch (error) {
      throw new Error(error)
    }
  }

  async createInitialCommit(username: string, accessToken: string) {
    const noteCommit = {
      message: 'Initial commit',
      content: Buffer.from(JSON.stringify([scratchpadNote, welcomeNote], null, 2)).toString('base64'),
      branch: 'master',
    }
    try {
      await firstValueFrom(this.httpService.put(`https://api.github.com/repos/${username}/${dataRepoName}/contents/notes.json`, noteCommit, {
        headers: {
          Authorization: `token ${accessToken}`,
        }
      }))
    } catch (error) {
      throw new Error(error)
    }
  }
}

import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import * as dayjs from "dayjs";
import { firstValueFrom } from "rxjs";
import { User } from "./sync.interface";

const dataRepoName = 'notes-data';

@Injectable()
export class SyncService {
  constructor(private httpService: HttpService) { }

  async sync(userData: User, accessToken: string, notes, categories) {
    const username = userData.login;

    try {
      const ref = await firstValueFrom(this.httpService.get(`https://api.github.com/repos/${username}/${dataRepoName}/git/refs/heads/master`, {
        headers: {
          Authorization: `token ${accessToken}`,
        }
      }));



      // const [noteBlob, categoryBlob] = await Promise.all([
      //   firstValueFrom(this.httpService.post(`https://api.github.com/repos/${username}/${dataRepoName}/git/blobs`, {
      //     content: JSON.stringify(notes, null, 2),
      //   }, {
      //     headers: {
      //       Authorization: `token ${accessToken}`,
      //     },
      //   })),
      //   firstValueFrom(this.httpService.post(`https://api.github.com/repos/${username}/${dataRepoName}/git/blobs`, {
      //     content: JSON.stringify(categories, null, 2),
      //   }, {
      //     headers: {
      //       Authorization: `token ${accessToken}`,
      //     },
      //   })),
      // ]);

      const blobs = await Promise.all(
        notes.map(async (note) => {
          return await firstValueFrom(this.httpService.post(`https://api.github.com/repos/${username}/${dataRepoName}/git/blobs`, {
            content: JSON.stringify(note, null, 2),
          }, {
            headers: {
              Authorization: `token ${accessToken}`,
            },
          }))
        })
      )

      // Create tree path
      const treeItems = blobs.map((item, index) => {
        return {
          path: notes?.[index]?.id,
          sha: item.data.sha,
          mode: '100644',
          type: 'blob',
        }
      })

      // Create tree
      // https://docs.github.com/en/free-pro-team@latest/rest/reference/git#create-a-tree
      const tree = await firstValueFrom(this.httpService.post(`https://api.github.com/repos/${username}/${dataRepoName}/git/trees`, {
        tree: treeItems,
        base_tree: ref.data.object.sha,
      }, {
        headers: {
          Authorization: `token ${accessToken}`,
        }
      }))

      // Create commit
      // https://docs.github.com/en/free-pro-team@latest/rest/reference/git#create-a-commit
      const commit = await firstValueFrom(this.httpService.post(`https://api.github.com/repos/${username}/${dataRepoName}/git/commits`, {
        message: 'notes app update' + dayjs(Date.now()).format('h:mm A M/D/YYYY'),
        tree: tree.data.sha,
        parents: [ref.data.object.sha],
      }, {
        headers: {
          Authorization: `token ${accessToken}`,
        }
      }))

      // Update a reference
      // https://docs.github.com/en/free-pro-team@latest/rest/reference/git#update-a-reference
      await firstValueFrom(this.httpService.post(`https://api.github.com/repos/${username}/${dataRepoName}/git/refs/heads/master`, {
        sha: commit.data.sha,
        force: true,
      }, {
        headers: {
          Authorization: `token ${accessToken}`,
        }
      }))
    } catch (err) {
      console.log(err)
    }
  }

  async getNotes(accessToken, userData) {
    const username = userData.login

    try {
      const { data } = await firstValueFrom(this.httpService.get(`https://api.github.com/repos/${username}/${dataRepoName}/contents/notes.json`, {
        headers: {
          Authorization: `token ${accessToken}`,
        }
      }))

      const notes = Buffer.from(data.content, 'base64').toString()

      try {
        JSON.parse(notes)
      } catch (error) {
        throw new Error(error.message || 'Must be valid JSON.')
      }

      return notes;
    } catch (error) {
      throw new Error(error.message || 'Something went wrong while fetching note data')
    }
  }

  async getCategories(accessToken, userData) {
    const username = userData.login

    try {
      const { data } = await firstValueFrom(this.httpService.get(`https://api.github.com/repos/${username}/${dataRepoName}/contents/categories.json`, {
        headers: {
          Authorization: `token ${accessToken}`,
        }
      }))

      const categories = Buffer.from(data.content, 'base64').toString()

      try {
        JSON.parse(categories)
      } catch (error) {
        throw new Error(error.message || 'Must be valid JSON.')
      }

      return categories;
    } catch (error) {
      throw new Error(error.message || 'Something went wrong while fetching note data')
    }
  }
}
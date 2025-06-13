import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { Octokit } from '@octokit/core';
import * as dayjs from "dayjs";
import { firstValueFrom } from "rxjs";
import { User } from "./sync.interface";

const dataRepoName = 'notes-data';

@Injectable()
export class SyncService {
  constructor(private httpService: HttpService) { }

  async sync(userData: User, accessToken: string, notes) {
    const username = userData.login;

    try {
      const ref = await firstValueFrom(this.httpService.get(`https://api.github.com/repos/${username}/${dataRepoName}/git/refs/heads/master`, {
        headers: {
          Authorization: `token ${accessToken}`,
        }
      }));

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

    const oc = new Octokit({
      auth: accessToken
    })

    try {
      const { data: dd } = await oc.request(`GET /repos/{owner}/{repo}/contents`, {
        owner: username,
        repo: dataRepoName,
      })

      console.log(dd, 'hereisdd')

      const fileList: any[] = [];

      if (Array.isArray(dd)) {
        for (const item of dd) {
          const { data } = await oc.request(`GET /repos/{owner}/{repo}/contents/{path}`, {
            owner: username,
            repo: dataRepoName,
            path: item.path,
          });
          console.log(data, 'here data')
          if ('content' in data) {
            fileList.push({
              id: item.sha,
              name: item.name,
              content: Buffer.from(data.content || '', 'base64').toString('utf-8'),
            })
          }
        }
      }

      return fileList;
    } catch (error) {
      throw new Error(error.message || 'Something went wrong while fetching note data')
    }
  }

  async getRepos(accessToken: string, pageNum: number, pageSize: number) {
    const oc = new Octokit({
      auth: accessToken
    })

    try {
      const { data } = await oc.request("GET /user/repos", {
        page: pageNum,
        per_page: pageSize, // 每页数量（最大 100）
        sort: "updated", // 按更新时间排序（可选：created, pushed, full_name）
        direction: "desc", // 降序排列
      });

      return data.map(item => {
        return {
          name: item.name,
          fullName: item.full_name,
          id: item.id,
          desc: item.description,
        }
      })
    } catch (error) {
      throw new Error(error.message || 'Something went wrong while fetching note data')
    }
  }

  async getRepoPath(accessToken: string, userData: any, repo: string, path: string) {
    const username = userData.login

    const oc = new Octokit({
      auth: accessToken,
    })

    const { data } = await oc.request(`GET /repos/{owner}/{repo}/contents/{path}`, {
      owner: username,
      repo,
      path,
    });

    if (!Array.isArray(data)) return [];

    console.log(data, 'sddd')
    return data
      .filter(item => item.type === 'dir')
      .map(item => {
        return {
          name: item.name,
          path: item.path,
          type: item.type,
          repo,
        }
      })
  }

  saveDataRepo(
   path: string
  ) {
    return {
      name: 'githubDataRepoPath',
      value: path,
      options: {
        httpOnly: true,
        maxAge: 86400000,
        secure: process.env.NODE_ENV === 'production',
      },
    };
  }
}
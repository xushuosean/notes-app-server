import { HttpService } from "@nestjs/axios";
import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { firstValueFrom } from "rxjs";

@Injectable()
export class UserMiddleware implements NestMiddleware {
  constructor(private readonly httpService: HttpService) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const accessToken = req.cookies.githubAccessToken
    try {
      // const { data } = await SDK(Method.GET, '/user', accessToken)
      // res.locals.userData = data

      const { data } = await firstValueFrom(this.httpService.get('https://api.github.com/user', {
        headers: {
          Authorization: `token ${accessToken}`
        }
      }));

      res.locals.userData = data;
      next()
    } catch (error) {
      // console.log('error', error)
      res.status(403).send({ message: 'Forbidden Resource', status: 403 })
    }
  }
}
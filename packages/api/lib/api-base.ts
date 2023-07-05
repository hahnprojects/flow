import { HttpClient } from './http.service';

export class APIBase {
  constructor(
    protected readonly httpClient: HttpClient,
    protected readonly basePath: string,
  ) {}
}

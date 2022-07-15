import { mix } from 'ts-mixer';

import { APIBase } from './api-base';
import { DataService } from './data.service';
import { HttpClient } from './http.service';
import { Task } from './task.interface';
import { TrashService } from './trash.service';

interface BaseService extends DataService<Task>, TrashService<Task> {}
@mix(DataService, TrashService)
class BaseService extends APIBase {}

export class TaskService extends BaseService {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/tasks');
  }

  // we may not need this method (already have the addOne method from DataService)
  createTaskAttachedToAsset(dto: any) {
    return this.httpClient.post<Task>(this.basePath, dto);
  }
}

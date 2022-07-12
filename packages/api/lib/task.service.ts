import { mix } from 'ts-mixer';

import { APIBase } from './api-base';
import { DataService } from './data.service';
import { HttpClient } from './http.service';
import { Task } from './task.interface';
import { TrashService } from './trash.service';

interface MixedClass extends DataService<Task>, TrashService<Task> {}

@mix(DataService, TrashService)
class MixedClass extends APIBase {
  constructor(httpClient: HttpClient, basePath: string) {
    super(httpClient, basePath);
  }
}

export class TaskService extends MixedClass {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/tasks');
  }

  // we may not need this method (already have the addOne method from DataService)
  createTaskAttachedToAsset(dto: any) {
    return this.httpClient.post<Task>(this.basePath, dto);
  }
}

import { DataService } from './data.service';
import { HttpClient } from './http.service';
import { Task } from './task.interface';
import { TrashService } from './trash.service';
import { mix } from 'ts-mixer';

interface MixedClass extends DataService<Task>, TrashService<Task> {}

@mix(DataService, TrashService)
class MixedClass {
  constructor(httpClient: HttpClient, basePath) {}
}

export class TaskService extends MixedClass {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/tasks');
    this.initTrash(httpClient, '/tasks');
    this.initData(httpClient, '/tasks');
  }

  // we may not need this method (already have the addOne method from DataService)
  createTaskAttachedToAsset(dto: any) {
    return this.httpClient.post<Task>(this.basePath, dto);
  }
}

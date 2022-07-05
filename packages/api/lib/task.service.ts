import { DataService } from './data.service';
import { HttpClient } from './http.service';
import { Task } from './task.interface';
import { TrashService } from './trash.service';
import { mix } from 'ts-mixer';

export interface TaskService extends DataService<Task>, TrashService<Task> {}

@mix(DataService, TrashService)
export class TaskService {
  constructor(httpClient: HttpClient) {
  }

  // we may not need this method (already have the addOne method from DataService)
  createTaskAttachedToAsset(dto: any) {
    return this.httpClient.post<Task>(this.basePath, dto);
  }
}

import { DataService } from './data.service';
import { HttpClient } from './http.service';
import { Task, TaskInterface } from './task.interface';

export class TaskService extends DataService<Task> implements TaskInterface {
  constructor(httpClient: HttpClient) {
    super(httpClient, process.env.DEBUG_TSK_URL || 'api/tasks');
  }

  // we may not need this method (already have the addOne method from DataService)
  createTaskAttachedToAsset(dto: any) {
    return this.httpClient.post<Task>(this.basePath, dto);
  }
}

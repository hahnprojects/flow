import { DataService } from './data.service';
import { HttpClient } from './http.service';
import { Task } from './task.interface';

export class TaskService extends DataService<Task> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/tasks');
  }

  // we may not need this method (already have the addOne method from DataService)
  createTaskAttachedToAsset(dto: any) {
    return this.httpClient.post<Task>(this.basePath, dto);
  }
}
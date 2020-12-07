import { MockAPI } from './api.mock';
import { DataMockService } from './data.mock.service';
import { Task, TaskInterface } from '../task.interface';

export class TaskMockService extends DataMockService<Task> implements TaskInterface {
  private api: MockAPI;

  constructor(api: MockAPI, tasks: Task[]) {
    super();
    this.api = api;
    this.data = tasks;
  }

  async createTaskAttachedToAsset(dto: any): Promise<Task> {
    this.data.push(dto as Task);
    return Promise.resolve(dto as Task);
  }
}

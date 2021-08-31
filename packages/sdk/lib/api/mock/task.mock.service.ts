import { Task } from '../task.interface';
import { TaskService } from '../task.service';
import { DataMockService } from './data.mock.service';

export class TaskMockService extends DataMockService<Task> implements TaskService {
  constructor(tasks: Task[]) {
    super();
    this.data = tasks;
  }

  async createTaskAttachedToAsset(dto: any): Promise<Task> {
    this.data.push(dto as Task);
    return Promise.resolve(dto as Task);
  }
}

import { mix } from 'ts-mixer';

import { Paginated, RequestParameter } from '../data.interface';
import { Task } from '../task.interface';
import { TaskService } from '../task.service';
import { APIBaseMock } from './api-base.mock';
import { DataMockService } from './data.mock.service';
import { TrashMockService } from './trash.mock.service';

interface BaseService extends DataMockService<Task>, TrashMockService<Task> {}
@mix(DataMockService, TrashMockService)
class BaseService extends APIBaseMock<Task> {}

export class TaskMockService extends BaseService implements TaskService {
  constructor(tasks: Task[]) {
    super(tasks);
  }

  async createTaskAttachedToAsset(dto: any): Promise<Task> {
    this.data.push(dto as Task);
    return Promise.resolve(dto as Task);
  }

  deleteOne(taskId: string, force = false): Promise<Task> {
    const task = this.data.find((v) => v.id === taskId);
    if (!task?.deletedAt && !force) {
      // put content in paper bin by setting deletedAt prop
      task.deletedAt = new Date().toISOString();
      return Promise.resolve(task);
    }
    return super.deleteOne(taskId);
  }

  getMany(params?: RequestParameter): Promise<Paginated<Task[]>> {
    const page = this.getItems(params, false);
    return Promise.resolve(page);
  }
}

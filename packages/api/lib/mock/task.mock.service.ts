import { Task } from '../task.interface';
import { DataMockService } from './data.mock.service';
import { TrashMockService } from './trash.mock.service';
import { mix, settings } from 'ts-mixer';
import { Paginated, RequestParameter } from '../data.interface';

settings.initFunction = 'initMock';

interface MixedClass extends DataMockService<Task>, TrashMockService<Task> {}

@mix(DataMockService, TrashMockService)
class MixedClass {}

export class TaskMockService extends MixedClass {
  constructor(tasks: Task[]) {
    super();
    this.data = tasks;
    this.initMock(tasks);
  }

  public initMock(tasks: Task[]) {
    this.data = tasks;
    this.initData(null, null);
    this.initTrash(null, null, tasks, this.deleteOne);
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

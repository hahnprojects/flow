import { APIBase } from '../api-base';

export class APIBaseMock<T> extends APIBase {
  constructor(public data: T[] = []) {
    super(null, null);
  }
}

import { DataService } from '../lib/data.service';

describe('DataService test', () => {
  test('getFilterString', async () => {
    const getFilterString = new DataService(null, '')['getFilterString'];
    let filterString = getFilterString({ tags: ['test'], parent: null, type: undefined, foo: 'bar' });
    expect(filterString).toBe('tags=@test;foo==bar');

    filterString = getFilterString({ tags: null, parent: '', type: undefined, foo: '0', bar: 'true' });
    expect(filterString).toBe('foo==0;bar==true');
  });
});

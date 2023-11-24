import { Filter } from '../lib';

export async function testTrash(itemId: string, service) {
  // test trash
  const deleted = await service.deleteOne(itemId);
  expect(deleted.id).toEqual(itemId);
  expect(deleted.deletedAt).toBeDefined();

  let items = await service.getMany();
  expect(items).toBeDefined();
  expect(items.docs.includes(deleted)).toBe(false);

  let trash = await service.getTrash();
  expect(trash.docs[0]).toBe(deleted);
  expect(trash.docs.includes(deleted)).toBe(true);

  await service.trashRestoreOne(trash.docs[0].id);

  trash = await service.getTrash();
  items = await service.getMany();
  expect(trash.docs.includes(deleted)).toBe(false);
  expect(items.docs.includes(deleted)).toBe(true);

  await service.deleteOne(itemId, true);

  trash = await service.getTrash();
  items = await service.getMany();
  expect(trash.docs.includes(deleted)).toBe(false);
  expect(items.docs.includes(deleted)).toBe(false);
}

/**
 * Tests the getManyFiltered() function.
 * @param filter The passed filter object.
 * @param service The service to test.
 * @param checkFor The property to check the received item for.
 * @param expected The expected value of the property declared in checkFor.
 */
export async function testFilter(filter: Filter, service, checkFor: string, expected: string) {
  const items = await service.getManyFiltered(filter);
  expect(items).toBeDefined();
  expect(Array.isArray(items.docs)).toBeTruthy();
  expect(items.docs.length).toBeGreaterThan(0);

  const item = items.docs[0];
  expect(item).toBeDefined();
  expect(item[checkFor]).toBe(expected);
}

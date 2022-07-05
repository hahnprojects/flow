

export async function testTrash(itemId, service) {
  // test trash for contents
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

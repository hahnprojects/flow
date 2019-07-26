import { hpc } from '../src/hpc';

describe('HPC SDK test', () => {
  it('should open a session', async (done) => {
    const assets = await hpc.assetManager.getMany().catch((err) => console.log(err));
    if (assets) {
      console.log(assets);
      expect(assets.docs.length).toBeGreaterThan(0);
    }
    done();
  });
});

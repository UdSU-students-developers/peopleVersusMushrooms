import Common from './Common';

describe('Common', () => {
  it('should create guid as non-empty string', () => {
    const common = new Common();
    const guid = common.guid();

    expect(typeof guid).toBe('string');
    expect(guid.length).toBeGreaterThan(0);
  });
});
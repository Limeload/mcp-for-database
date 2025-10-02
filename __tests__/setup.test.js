// Simple test to verify Jest is working
describe('Jest Setup', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true);
  });

  it('should have access to testing utilities', () => {
    expect(jest).toBeDefined();
    expect(global.fetch).toBeDefined();
  });
});

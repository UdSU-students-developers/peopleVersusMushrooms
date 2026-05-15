import Store from './Store';

describe('Store', () => {
  test('has null defaults for token and user', () => {
    const store = new Store();

    expect(store.get('token')).toBeNull();
    expect(store.get('user')).toBeNull();
  });

  test('returns undefined for unknown key before set', () => {
    const store = new Store();

    expect(store.get('unknownKey')).toBeUndefined();
  });

  test('saves and reads value by key', () => {
    const store = new Store();
    const payload = { id: 1, name: 'Player' };

    store.set('player', payload);

    expect(store.get('player')).toEqual(payload);
  });

  test('overwrites previously stored value for the same key', () => {
    const store = new Store();

    store.set('stage', 'init');
    store.set('stage', 'ready');

    expect(store.get('stage')).toBe('ready');
  });

  test('clear sets existing key value to null', () => {
    const store = new Store();

    store.set('token', 'abc123');
    store.clear('token');

    expect(store.get('token')).toBeNull();
  });

  test('clear sets unknown key to null', () => {
    const store = new Store();

    store.clear('newField');

    expect(store.get('newField')).toBeNull();
  });
});

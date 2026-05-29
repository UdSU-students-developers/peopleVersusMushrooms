import Store from './Store';

jest.mock('../Server/types', () => ({}));

describe('Store', () => {
  let store: Store;

  beforeEach(() => {
    store = new Store();
  });

  describe('начальное состояние', () => {
    it('должен иметь null token, user, guid и пустой массив messages в данных', () => {
      expect(store.get('token')).toBeNull();
      expect(store.get('user')).toBeNull();
      expect(store.get('guid')).toBeNull();
      expect(store.get('messages')).toEqual([]);
    });

    it('должен иметь публичные сообщения, инициализированные как пустой массив', () => {
      expect(store.messages).toEqual([]);
    });

    it('должен иметь chatHash по умолчанию', () => {
      expect(store.chatHash).toBe('empty chat hash');
    });
  });

  describe('set() и get()', () => {
    it('должен сохранять и извлекать строковое значение', () => {
      store.set('token', 'abc123');
      expect(store.get('token')).toBe('abc123');
    });

    it('должен сохранять и извлекать объект', () => {
      const user = { id: 1, name: 'John' };
      store.set('user', user);
      expect(store.get('user')).toEqual(user);
    });

    it('должен сохранять и извлекать массив', () => {
      const msgs = [{ text: 'hello' }];
      store.set('messages', msgs);
      expect(store.get('messages')).toEqual(msgs);
    });

    it('должен перезаписывать существующее значение', () => {
      store.set('token', 'first');
      store.set('token', 'second');
      expect(store.get('token')).toBe('second');
    });

    it('должен обрабатывать динамические ключи', () => {
      store.set('customKey', 42);
      expect(store.get('customKey')).toBe(42);
    });
  });

  describe('clear()', () => {
    it('должен устанавливать значение в null', () => {
      store.set('token', 'abc');
      store.clear('token');
      expect(store.get('token')).toBeNull();
    });

    it('не должен влиять на другие ключи', () => {
      store.set('user', { name: 'Alice' });
      store.clear('token');
      expect(store.get('user')).toEqual({ name: 'Alice' });
      expect(store.get('token')).toBeNull();
    });
  });

  describe('getMessages()', () => {
    it('должен возвращать массив публичных сообщений, а не data.messages', () => {
      store.messages.push({ text: 'public msg' } as any);
      store.set('messages', [{ text: 'private msg' }]);

      const result = store.getMessages();
      expect(result).toEqual([{ text: 'public msg' }]);
      expect(result).not.toEqual([{ text: 'private msg' }]);
    });

    it('должен возвращать пустой массив изначально', () => {
      expect(store.getMessages()).toEqual([]);
    });
  });
});
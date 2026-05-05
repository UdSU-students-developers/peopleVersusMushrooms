import { authStorage } from './authStorage';
import { TUser } from '../services/server/types';

describe('authStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save token and user to localStorage', () => {
    const user: TUser = {
      token: 'test-token',
      name: 'test-user',
      guid: 'user-guid',
    };

    authStorage.setAuth('test-token', user);

    expect(localStorage.getItem('token')).toBe('test-token');
    expect(localStorage.getItem('user')).toBe(JSON.stringify(user));
  });

  it('should return saved token and user from localStorage', () => {
    const user: TUser = {
      token: 'saved-token',
      name: 'test-user',
      guid: 'saved-guid',
    };

    localStorage.setItem('token', 'saved-token');
    localStorage.setItem('user', JSON.stringify(user));

    const result = authStorage.getAuth();

    expect(result.token).toBe('saved-token');
    expect(result.user).toEqual(user);
  });

  it('should return null user and null token when storage is empty', () => {
    const result = authStorage.getAuth();

    expect(result.token).toBeNull();
    expect(result.user).toBeNull();
  });

  it('should return token and null user when token exists but user does not', () => {
    localStorage.setItem('token', 'only-token');

    const result = authStorage.getAuth();

    expect(result.token).toBe('only-token');
    expect(result.user).toBeNull();
  });

  it('should clear token and user from localStorage', () => {
    const user: TUser = {
      token: 'clear-token',
      name: 'test-user',
      guid: 'clear-guid',
    };

    authStorage.setAuth('clear-token', user);
    authStorage.clearAuth();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('should return null user when localStorage contains invalid JSON', () => {
    localStorage.setItem('token', 'broken-token');
    localStorage.setItem('user', '{invalid json');

    const result = authStorage.getAuth();

    expect(result.token).toBe('broken-token');
    expect(result.user).toBeNull();
  });

  it('should remove undefined fields when saving user', () => {
    const user = {
      token: 'test-token',
      name: 'test-user',
      guid: undefined,
    } as unknown as TUser;

    authStorage.setAuth('test-token', user);

    expect(localStorage.getItem('user')).toBe(
      JSON.stringify({
        token: 'test-token',
        name: 'test-user',
      })
    );
  });

  it('should convert NaN to null when saving user', () => {
    const user = {
      token: 'test-token',
      name: 'test-user',
      id: NaN,
    } as unknown as TUser;

    authStorage.setAuth('test-token', user);

    expect(localStorage.getItem('user')).toBe(
      JSON.stringify({
        token: 'test-token',
        name: 'test-user',
        id: null,
      })
    );
  });

  it('should convert Infinity to null when saving user', () => {
    const user = {
      token: 'test-token',
      name: 'test-user',
      id: Infinity,
    } as unknown as TUser;

    authStorage.setAuth('test-token', user);

    expect(localStorage.getItem('user')).toBe(
      JSON.stringify({
        token: 'test-token',
        name: 'test-user',
        id: null,
      })
    );
  });
});
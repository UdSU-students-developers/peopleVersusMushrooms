import { validateLogin } from './validation';

describe('validateLogin', () => {
  test('returns error when login is empty string', () => {
    expect(validateLogin('')).toEqual({
      isValid: false,
      error: 'Логин обязателен для заполнения',
    });
  });

  test('returns error when login is undefined/null (runtime guard)', () => {
    expect(validateLogin(undefined as unknown as string)).toEqual({
      isValid: false,
      error: 'Логин обязателен для заполнения',
    });
    expect(validateLogin(null as unknown as string)).toEqual({
      isValid: false,
      error: 'Логин обязателен для заполнения',
    });
  });

  test('returns error when login is shorter than 3 chars', () => {
    expect(validateLogin('ab')).toEqual({
      isValid: false,
      error: 'Логин слишком короткий (минимум 3 символа)',
    });
  });

  test('returns error when login is longer than 20 chars', () => {
    const longLogin = 'a'.repeat(21);
    expect(validateLogin(longLogin)).toEqual({
      isValid: false,
      error: 'Логин слишком длинный (максимум 20 символов)',
    });
  });

  test('returns error when login contains invalid characters', () => {
    expect(validateLogin('ab-1')).toEqual({
      isValid: false,
      error: 'Только латинские буквы, цифры, «_» и «.»',
    });
    expect(validateLogin('тест')).toEqual({
      isValid: false,
      error: 'Только латинские буквы, цифры, «_» и «.»',
    });
    expect(validateLogin('a b')).toEqual({
      isValid: false,
      error: 'Только латинские буквы, цифры, «_» и «.»',
    });
  });

  test('returns error when login starts or ends with a dot', () => {
    expect(validateLogin('.abc')).toEqual({
      isValid: false,
      error: 'Логин не может начинаться или заканчиваться точкой',
    });
    expect(validateLogin('abc.')).toEqual({
      isValid: false,
      error: 'Логин не может начинаться или заканчиваться точкой',
    });
  });

  test('returns error when login contains two dots in a row', () => {
    expect(validateLogin('ab..cd')).toEqual({
      isValid: false,
      error: 'Логин не может содержать две точки подряд',
    });
  });

  test('accepts valid logins', () => {
    expect(validateLogin('abc')).toEqual({ isValid: true });
    expect(validateLogin('a_b')).toEqual({ isValid: true });
    expect(validateLogin('a.b')).toEqual({ isValid: true });
    expect(validateLogin('A1_b.C2')).toEqual({ isValid: true });
    expect(validateLogin('a'.repeat(20))).toEqual({ isValid: true });
  });
});
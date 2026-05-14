import { validateLogin, validatePassword, validateRegistration } from './validation';

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

//тесты для функции проверки самого пароля
describe('validatePassword', () => {
  test('возвращает ошибку, если пароль — пустая строка', () => {
    expect(validatePassword('')).toEqual({
      isValid: false,
      error: 'Пароль обязателен для заполнения',
    });
  });

  test('возвращает ошибку, если пароль слишком короткий (меньше 6 символов)', () => {
    expect(validatePassword('12345')).toEqual({
      isValid: false,
      error: 'Пароль слишком короткий (минимум 6 символов)',
    });
  });

  test('возвращает ошибку, если пароль слишком длинный (больше 50 символов)', () => {
    const longPassword = 'a'.repeat(51);
    expect(validatePassword(longPassword)).toEqual({
      isValid: false,
      error: 'Пароль слишком длинный (максимум 50 символов)',
    });
  });

  test('принимает пароли длиной ровно 6 и ровно 50 символов', () => {
    expect(validatePassword('123456')).toEqual({ isValid: true });
    expect(validatePassword('p'.repeat(50))).toEqual({ isValid: true });
  });

  test('возвращает ошибку, если пароль null или undefined (защита рантайма)', () => {
  expect(validatePassword(null as unknown as string)).toEqual({
    isValid: false,
    error: 'Пароль обязателен для заполнения',
  });
  expect(validatePassword(undefined as unknown as string)).toEqual({
    isValid: false,
    error: 'Пароль обязателен для заполнения',
  });
  
});

});

//тестф для полной проверки регистрации
describe('validateRegistration', () => {
  test('возвращает ошибку, если пароли не совпадают', () => {
    const result = validateRegistration('MushroomLover', 'password123', 'different-pass');
    expect(result.passwordRepeat).toBe('Пароли не совпадают');
  });

  test('возвращает ошибку, если пароль совпадает с логином', () => {
    const result = validateRegistration('Gribok2026', 'Gribok2026', 'Gribok2026');
    expect(result.password).toBe('Пароль не должен совпадать с логином');
  });

  test('возвращает пустой объект ошибок при полностью валидных данных', () => {
    const result = validateRegistration('HumanWarrior', 'SuperSecure123', 'SuperSecure123');
    expect(result).toEqual({});
  });
});
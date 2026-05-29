import useStore from './useStore';
import Mediator from '../Mediator/Mediator';
import Store from './Store';

jest.mock('../../config', () => ({
  __esModule: true,
  default: {
    MEDIATOR: {
      TRIGGERS: {
        SET_STORE: 'SET_STORE',
        GET_STORE: 'GET_STORE',
        CLEAR_STORE: 'CLEAR_STORE',
      },
    },
  },
}));

jest.mock('./Store');

describe('useStore', () => {
  let mediatorMock: Mediator;

  beforeEach(() => {
    jest.clearAllMocks();
    mediatorMock = {
      set: jest.fn(),
    } as unknown as Mediator;
  });

  it('должен создать экземпляр Store', () => {
    useStore(mediatorMock);
    expect(Store).toHaveBeenCalledTimes(1);
  });

  it('должен зарегистрировать триггер SET_STORE и корректно вызывать store.set', () => {
    const storeInstance = useStore(mediatorMock);

    const setCalls = (mediatorMock.set as jest.Mock).mock.calls;
    const setStoreCall = setCalls.find(
      ([trigger]) => trigger === 'SET_STORE'
    );
    expect(setStoreCall).toBeDefined();

    const setStoreCallback = setStoreCall[1];
    expect(typeof setStoreCallback).toBe('function');

    setStoreCallback({ name: 'testKey', value: 'testValue' });

    expect(storeInstance.set).toHaveBeenCalledWith('testKey', 'testValue');
  });

  it('должен зарегистрировать триггер GET_STORE и возвращать значение из store.get', () => {
    const storeInstance = useStore(mediatorMock);

    const setCalls = (mediatorMock.set as jest.Mock).mock.calls;
    const getStoreCall = setCalls.find(
      ([trigger]) => trigger === 'GET_STORE'
    );
    expect(getStoreCall).toBeDefined();

    const getStoreCallback = getStoreCall[1];

    (storeInstance.get as jest.Mock).mockReturnValueOnce('mockedValue');

    const result = getStoreCallback('testKey');
    expect(result).toBe('mockedValue');
    expect(storeInstance.get).toHaveBeenCalledWith('testKey');
  });

  it('должен зарегистрировать триггер CLEAR_STORE и вызывать store.clear', () => {
    const storeInstance = useStore(mediatorMock);

    const setCalls = (mediatorMock.set as jest.Mock).mock.calls;
    const clearStoreCall = setCalls.find(
      ([trigger]) => trigger === 'CLEAR_STORE'
    );
    expect(clearStoreCall).toBeDefined();

    const clearStoreCallback = clearStoreCall[1];
    clearStoreCallback('testKey');

    expect(storeInstance.clear).toHaveBeenCalledWith('testKey');
  });

  it('должен вернуть тот же экземпляр Store, что был создан', () => {
    const result = useStore(mediatorMock);
    const storeInstance = (Store as jest.Mock).mock.instances[0];
    expect(result).toBe(storeInstance);
  });

  it('должен зарегистрировать ровно три триггера', () => {
    useStore(mediatorMock);
    expect(mediatorMock.set).toHaveBeenCalledTimes(3);
  });
});
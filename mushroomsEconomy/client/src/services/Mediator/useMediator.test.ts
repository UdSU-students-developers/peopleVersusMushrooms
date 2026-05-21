import useMediator from './useMediator';
import Mediator from './Mediator';

jest.mock('../../config', () => ({
  __esModule: true,
  default: {
    MEDIATOR: {
      EVENTS: { EVENT_A: 'EVENT_A', EVENT_B: 'EVENT_B' },
      TRIGGERS: { TRIGGER_X: 'TRIGGER_X' },
    },
    SOCKET: { SOCKET_OPEN: 'SOCKET_OPEN', EVENT_A: 'SOCKET_EVENT_A' },
  },
}));

jest.mock('./Mediator'); 

describe('useMediator', () => {
  it('должен создать Mediator с объединёнными EVENTS и TRIGGERS', () => {
    const mediatorInstance = useMediator();

    expect(Mediator).toHaveBeenCalledTimes(1);
    const constructorArgs = (Mediator as jest.Mock).mock.calls[0][0];

    expect(constructorArgs).toEqual({
      EVENTS: {
        EVENT_A: 'SOCKET_EVENT_A', 
        EVENT_B: 'EVENT_B',
        SOCKET_OPEN: 'SOCKET_OPEN',
      },
      TRIGGERS: { TRIGGER_X: 'TRIGGER_X' },
    });

    expect(mediatorInstance).toBeInstanceOf(Mediator);
  });
});
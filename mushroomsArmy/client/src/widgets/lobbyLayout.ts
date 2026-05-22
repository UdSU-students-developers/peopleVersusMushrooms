// lobbyLayout.ts

export const LOBBY_LAYOUT = {
  S: {
    paddingTop: 80,          // Отступ сверху от хедера
    modalWidth: 320,         // Ширина окон "создать комнату"
    inputHeight: 32,         // Высота инпутов внутри окон
    roomCardMinWidth: 240,   // Базовый размер карточки комнаты
    actionsMarginTop: 20,    // Отступы кнопок
  },

  SM: {
    paddingTop: 110,
    modalWidth: 370,
    inputHeight: 35,
    roomCardMinWidth: 270,
    actionsMarginTop: 30,
  },

  M: { // Твои текущие актуальные размеры
    paddingTop: 150,
    modalWidth: 420,
    inputHeight: 38,
    roomCardMinWidth: 300,
    actionsMarginTop: 40,
  },

  ML: {
    paddingTop: 180,
    modalWidth: 480,
    inputHeight: 44,
    roomCardMinWidth: 350,
    actionsMarginTop: 50,
  },

  L: {
    paddingTop: 210,
    modalWidth: 540,
    inputHeight: 50,
    roomCardMinWidth: 400,
    actionsMarginTop: 60,
  },
} as const;
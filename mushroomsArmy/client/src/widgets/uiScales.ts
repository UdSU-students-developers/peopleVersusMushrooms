// titleFont: 8,  название игры
// baseFont: 12,   ник
// smallFont: 10,   текст на кнопках/мелкие детали

export const UI_SCALES = {
  S: {
    headerHeight: 24,
    titleFont: 14,
    baseFont: 12,
    smallFont: 15,
  },

  SM: {
    headerHeight: 28,

    titleFont: 17,
    baseFont: 14,
    smallFont: 18,
  },

  M: {//по умолчанию
    headerHeight: 32,

    titleFont: 21,
    baseFont: 18,
    smallFont: 20,
  },

  ML: {
    headerHeight: 40,
    titleFont: 27,
    baseFont: 20,
    smallFont: 25,
  },

  L: {
    headerHeight: 48,
    titleFont: 28,
    baseFont: 20,
    smallFont: 27,
  },
} as const;
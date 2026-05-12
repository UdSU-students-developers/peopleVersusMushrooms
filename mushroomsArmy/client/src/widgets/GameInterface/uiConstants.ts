//константы для маасштабирования игрвого простанства (HUD)

export const HUD_SCALE_STEPS = [
  //minimapBox  размер подложки под миникарту
  //minimapCanvas размер живой карты внутри
  { id: 0, label: 'S',  
    minimapBox: 180, minimapCanvas: 164, 
    footer: 80, header: 24,
    titleFont: 8,  //азвание игры
    baseFont: 12,   //ник
    smallFont: 10,   //текст на кнопках/мелкие детали
  },


  { id: 1, 
    label: 'SM',
    minimapBox: 210,
    minimapCanvas: 192,
    footer: 94,
    header: 28,
    titleFont: 9, baseFont: 14, smallFont: 13,
  },


  { id: 2,
    label: 'M',
    minimapBox: 240,
    minimapCanvas: 228,
    footer: 112,
    header: 32,
    titleFont: 10, baseFont: 14, smallFont: 14,
  }, //база
  

  { id: 3,
    label: 'ML',
    minimapBox: 290,
    minimapCanvas: 266,
    footer: 124,
    header: 42,
    titleFont: 15, baseFont: 16, smallFont: 15,
  },

  { id: 4,
    label: 'L',
    minimapBox: 330,
    minimapCanvas: 302,
    footer: 136,
    header: 40,
    titleFont: 17, baseFont: 18, smallFont: 16,
  }



];    

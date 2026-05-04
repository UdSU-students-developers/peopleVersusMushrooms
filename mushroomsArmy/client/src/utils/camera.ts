export const camera = {
  scale: 1.0,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0,
};

camera.offsetX = window.innerWidth / 2 - (50 * 50) / 2;
camera.offsetY = window.innerHeight / 2 - (50 * 50) / 2;

export const MIN_SCALE = 1.0;
export const MAX_SCALE = 20;
export const VZRYVOMOR_FRAME_MS = 80;

export type BuildingAnimEntry = {
  frame: number;
  lastFrameTime: number;
};

/** Ключ кадра взрывомора для кэша (0 … frameCount-1). */
export function getVzryvomorFrameKey(frameIndex: number): string {
  return `vzryvomor:frame_${frameIndex}`;
}

/**
 * Один шаг логики анимации взрывомора (без привязки к canvas).
 * При isExploding=false состояние сбрасывается (undefined), кадр для отрисовки — 0.
 */
export function stepVzryvomorAnimation(
  prev: BuildingAnimEntry | undefined,
  isExploding: boolean,
  now: number,
  frameCount: number,
  frameMs: number
): { next: BuildingAnimEntry | undefined; frameIndex: number } {
  if (!isExploding) {
    return { next: undefined, frameIndex: 0 };
  }
  if (!prev) {
    return { next: { frame: 0, lastFrameTime: now }, frameIndex: 0 };
  }
  let frame = prev.frame;
  let lastFrameTime = prev.lastFrameTime;
  if (now - lastFrameTime >= frameMs) {
    if (frame < frameCount - 1) {
      frame += 1;
    }
    lastFrameTime = now;
  }
  return { next: { frame, lastFrameTime }, frameIndex: frame };
}

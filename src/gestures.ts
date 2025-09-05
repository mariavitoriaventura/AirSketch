import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
export type Handed = "Left" | "Right";
export const PINCH_ON = 0.03; export const PINCH_OFF = 0.08;
export function pickActiveHand(landmarks: NormalizedLandmark[][], handedness: { categoryName: string }[][], preferred: Handed | "auto" = "auto"): { idx: number, hand: Handed } | null {
  if (!landmarks.length) return null;
  if (preferred !== "auto") { const idx = handedness.findIndex(h => h[0]?.categoryName === preferred); if (idx >= 0) return { idx, hand: preferred }; }
  const hand = (handedness[0]?.[0]?.categoryName ?? "Right") as Handed; return { idx: 0, hand };
}
export function pinchDistance(hand: NormalizedLandmark[]): number { const t = hand[4], i = hand[8]; const dx = t.x - i.x, dy = t.y - i.y; return Math.hypot(dx, dy); }
export type DrawState = "idle" | "pinch_down" | "drawing";
export function nextState(state: DrawState, d: number): DrawState {
  switch (state) { case "idle": return d < PINCH_ON ? "pinch_down" : "idle";
    case "pinch_down": return d < PINCH_ON ? "drawing" : "idle";
    case "drawing": return d > PINCH_OFF ? "idle" : "drawing"; }
}
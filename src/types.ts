export type Point = { x: number; y: number };
export type Stroke = { tool: "pen" | "eraser"; color: string; width: number; points: Point[]; };
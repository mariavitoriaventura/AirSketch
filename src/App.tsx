import React, { useCallback, useMemo, useRef, useState } from "react";
import { useHandLandmarker } from "./lib/useHandLandmarker";
import { OneEuro } from "./lib/oneEuro";
import type { Stroke, Point } from "./types";
import { DrawState, nextState, pickActiveHand, pinchDistance } from "./gestures";
import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";

export default function App() {
  const [color, setColor] = useState("#0ea5e9");
  const [width, setWidth] = useState(8);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [handPref, setHandPref] = useState<"auto" | "Left" | "Right">("auto");
  const [showBg, setShowBg] = useState(true); 
  const [cursor, setCursor] = useState<{ x: number; y: number; drawing: boolean } | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoElRef = useRef<HTMLVideoElement|null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const undoneRef = useRef<Stroke[]>([]);
  const curStrokeRef = useRef<Stroke | null>(null);

  const fx = useMemo(() => new OneEuro(30, 1.2, 0.02), []);
  const fy = useMemo(() => new OneEuro(30, 1.2, 0.02), []);
  const stateRef = useRef<DrawState>("idle");

  const drawSegment = (from: Point, to: Point, s: Stroke) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.save();
    if (s.tool === "eraser") ctx.globalCompositeOperation = "destination-out";
    else { ctx.globalCompositeOperation = "source-over"; ctx.strokeStyle = s.color; }
    ctx.lineWidth = s.width; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke(); ctx.restore();
  };

  const fullRedraw = () => {
    const canvas = canvasRef.current!; const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0,0,canvas.width, canvas.height);
    for (const s of strokesRef.current) {
      if (s.points.length < 2) continue;
      ctx.save();
      if (s.tool === "eraser") ctx.globalCompositeOperation = "destination-out";
      else { ctx.globalCompositeOperation = "source-over"; ctx.strokeStyle = s.color; }
      ctx.lineWidth = s.width; ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i=1;i<s.points.length;i++) ctx.lineTo(s.points[i].x, s.points[i].y);
      ctx.stroke(); ctx.restore();
    }
  };

  const toCanvasPoint = (nx: number, ny: number): Point => {
    const c = canvasRef.current!; const x = (1 - nx) * c.width; const y = ny * c.height; return { x, y };
  };

const ensureCanvasSize = (video: HTMLVideoElement) => {
  const c = canvasRef.current!;
  const targetW = 960;
  const aspect = video.videoHeight ? (video.videoWidth / video.videoHeight) : (16 / 9);
  const targetH = Math.round(targetW / aspect);

  if (c.width !== targetW || c.height !== targetH) {
    c.width = targetW; c.height = targetH;
    c.style.width = `${targetW}px`; c.style.height = `${targetH}px`;
    fullRedraw();
  }

  if (showBg) {
    // cria o <video> de fundo se ainda não existir
    if (!videoElRef.current) {
      const ve = document.createElement("video");
      ve.muted = true; ve.autoplay = true; ve.playsInline = true;
      // @ts-ignore – reaproveita o stream já em uso pelo MediaPipe
      ve.srcObject = video.srcObject;
      ve.style.position = "absolute";
      ve.style.inset = "0";
      ve.style.width = "100%";
      ve.style.height = "100%";
      ve.style.objectFit = "cover";
      ve.style.transform = "scaleX(-1)"; // espelha para bater com (1 - nx)
      ve.style.zIndex = "0";             // atrás do canvas
      ve.style.pointerEvents = "none";
      videoElRef.current = ve;
      // insere como fundo (antes do canvas) no mesmo container
      c.parentElement!.insertBefore(ve, c);
    }
  } else {
    // remove se toggle desativar
    if (videoElRef.current) {
      videoElRef.current.remove();
      videoElRef.current = null;
    }
  }
};


  const onResults = useCallback((res: HandLandmarkerResult, video: HTMLVideoElement) => {
    const canvas = canvasRef.current; if (!canvas) return;
    ensureCanvasSize(video);
    if (!res.landmarks?.length) { stateRef.current = "idle"; curStrokeRef.current = null; return; }
    const pick = pickActiveHand(res.landmarks as any, res.handedness as any, handPref);
    if (!pick) { stateRef.current = "idle"; curStrokeRef.current = null; return; }
    const hand = (res.landmarks as any)[pick.idx];
    const d = pinchDistance(hand as any);
    const ns = nextState(stateRef.current, d);
    const tip = hand[8];
    const px = fx.filter(tip.x); const py = fy.filter(tip.y);
    const pt = toCanvasPoint(px, py);
    // atualiza posição do cursor e se está desenhando (pinch_down/drawing)
    const isDrawing = ns !== "idle";
    setCursor({ x: pt.x, y: pt.y, drawing: isDrawing });

    if (stateRef.current === "idle" && ns === "pinch_down") {
      curStrokeRef.current = { tool, color, width, points: [pt] }; undoneRef.current = [];
    } else if (ns === "drawing" && curStrokeRef.current) {
      const last = curStrokeRef.current.points.at(-1)!;
      const dist = Math.hypot(pt.x - last.x, pt.y - last.y);
      if (dist > 1.5 && dist < 60) { curStrokeRef.current.points.push(pt); drawSegment(last, pt, curStrokeRef.current); }
    } else if (stateRef.current === "drawing" && ns === "idle" && curStrokeRef.current) {
      if (curStrokeRef.current.points.length > 1) strokesRef.current.push(curStrokeRef.current);
      curStrokeRef.current = null;
    }
    stateRef.current = ns;
  }, [handPref, tool, color, width, showBg]);

  useHandLandmarker(onResults, { numHands: 1 });

  const undo = () => { const s = strokesRef.current.pop(); if (s) { undoneRef.current.push(s); fullRedraw(); } };
  const redo = () => { const s = undoneRef.current.pop(); if (s) { strokesRef.current.push(s); fullRedraw(); } };
  const clearAll = () => { strokesRef.current = []; curStrokeRef.current = null; undoneRef.current = []; fullRedraw(); };
  const savePNG = () => { const c = canvasRef.current!; const url = c.toDataURL("image/png"); const a = document.createElement("a"); a.href = url; a.download = `handdraw-${Date.now()}.png`; a.click(); };



  return (<div className="h-full bg-slate-950 text-slate-100 flex items-center justify-center">
    <div className="relative rounded-2xl overflow-hidden shadow-2xl">
     <canvas
  ref={canvasRef}
  className={showBg ? "bg-transparent relative z-0" : "bg-black/60 relative z-0"}
/>

      
      {cursor && (
  <div
    className={`
      pointer-events-none absolute rounded-full
      ${cursor.drawing ? "ring-2 ring-sky-400 bg-sky-400/40" : "ring-2 ring-sky-400 bg-sky-400/40"}
    `}
    style={{
      // como o canvas usa escala 1:1 na v2, pt.x/pt.y já estão em px do container
      left: `${cursor.x}px`,
      top: `${cursor.y}px`,
      width: cursor.drawing ? 16 : 12,
      height: cursor.drawing ? 16 : 12,
      transform: "translate(-50%, -50%)",
      boxShadow: cursor.drawing ? "0 0 8px rgba(56, 191, 248, 1)" : "none",
    }}
  />
)}

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 items-center rounded-xl bg-slate-900/80 backdrop-blur px-3 py-2">
        <button onClick={() => setTool("pen")} className={`px-3 py-1 rounded-lg border ${tool==="pen"?"border-sky-400":"border-slate-700"}`}>✏️ Pen</button>
        <button onClick={() => setTool("eraser")} className={`px-3 py-1 rounded-lg border ${tool==="eraser"?"border-sky-400":"border-slate-700"}`}>🧽 Erase</button>
        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-8 rounded border border-slate-700" />
        <input type="range" min={2} max={24} value={width} onChange={e => setWidth(parseInt(e.target.value))} className="w-28" />
        <select value={handPref} onChange={e => setHandPref(e.target.value as any)} className="bg-slate-800/80 rounded px-2 py-1 border border-slate-700">
          <option value="auto">Auto</option><option value="Left">Left</option><option value="Right">Right</option>
        </select>
        <label className="text-xs flex items-center gap-1 border border-slate-700 px-2 py-1 rounded">
  <input type="checkbox" checked={showBg} onChange={e=>setShowBg(e.target.checked)} />
  Webcam como fundo
</label>

        <button onClick={undo} className="px-2 py-1 rounded border border-slate-700">↶ Undo</button>
        <button onClick={redo} className="px-2 py-1 rounded border border-slate-700">↷ Redo</button>
        <button onClick={clearAll} className="px-2 py-1 rounded border border-slate-700">🗑 Clear</button>
        <button onClick={savePNG} className="px-2 py-1 rounded border border-slate-700">💾 PNG</button>

      </div>
    </div>
  </div>);
}
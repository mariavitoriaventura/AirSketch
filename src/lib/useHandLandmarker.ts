import { useEffect, useRef } from "react";
import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from "@mediapipe/tasks-vision";

type CB = (res: HandLandmarkerResult, video: HTMLVideoElement) => void;

export function useHandLandmarker(onResults: CB, { numHands = 1 } = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lmRef = useRef<HandLandmarker | null>(null);
  const loopRef = useRef<number | null>(null);

  // >>> guarda o callback num ref, sem reinit do pipeline
  const cbRef = useRef<CB>(onResults);
  useEffect(() => { cbRef.current = onResults; }, [onResults]);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      const lm = await HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: "/models/hand_landmarker.task" },
        numHands,
        runningMode: "VIDEO",
      });
      if (disposed) { lm.close(); return; }
      lmRef.current = lm;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 480, height: 360 }, audio: false
      });
      const v = document.createElement("video");
      v.srcObject = stream; v.autoplay = true; v.playsInline = true;
      await v.play();
      videoRef.current = v;

      const tick = () => {
        if (!lmRef.current || v.readyState < 2) {
          loopRef.current = requestAnimationFrame(tick); return;
        }
        const ts = performance.now();
        const res = lmRef.current.detectForVideo(v, ts);
        // >>> usa o callback mais recente sem reinicializar
        cbRef.current(res, v);
        loopRef.current = requestAnimationFrame(tick);
      };
      tick();
    })();

    return () => {
      disposed = true;
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
      const v = videoRef.current;
      if (v?.srcObject) (v.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      lmRef.current?.close();
    };
  }, [numHands]); // <<< só reinit se mudar numHands

  return { videoRef };
}

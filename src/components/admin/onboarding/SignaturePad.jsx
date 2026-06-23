import { useRef, useEffect, useState } from "react";
import { Eraser, CheckCircle } from "lucide-react";

export default function SignaturePad({ onSign }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const start = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    if (!hasSignature) setHasSignature(true);
  };

  const stop = () => setIsDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSign(false);
  };

  const confirm = () => {
    if (hasSignature) onSign(true);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={600}
        height={180}
        onMouseDown={start}
        onMouseMove={draw}
        onMouseUp={stop}
        onMouseLeave={stop}
        onTouchStart={start}
        onTouchMove={draw}
        onTouchEnd={stop}
        className="w-full bg-black border border-[#A8A9AD]/30 touch-none cursor-crosshair"
      />
      <div className="flex gap-2 mt-3">
        <button onClick={clear} className="flex items-center gap-2 px-4 py-2 border border-[#A8A9AD]/30 text-sm text-[#A8A9AD] hover:text-white transition-colors">
          <Eraser size={14} /> Clear
        </button>
        <button onClick={confirm} disabled={!hasSignature} className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-black font-bold text-sm hover:bg-[#E0C97A] transition-colors disabled:opacity-40">
          <CheckCircle size={14} /> Confirm Signature
        </button>
      </div>
    </div>
  );
}
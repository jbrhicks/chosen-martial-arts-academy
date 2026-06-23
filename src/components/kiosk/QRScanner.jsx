import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

export default function QRScanner({ onScan, active = true }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!active) return;
    let stream = null;
    let animationId = null;

    const scanFrame = () => {
      if (!videoRef.current || !canvasRef.current) {
        animationId = requestAnimationFrame(scanFrame);
        return;
      }
      const video = videoRef.current;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          onScan(code.data);
          return;
        }
      }
      animationId = requestAnimationFrame(scanFrame);
    };

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          await videoRef.current.play();
          setScanning(true);
          scanFrame();
        }
      } catch (e) {
        setError("Camera access denied. Please use PIN or name search instead.");
      }
    };

    startCamera();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [active]);

  return (
    <div className="relative">
      {error ? (
        <div className="text-center py-8">
          <p className="text-[#A8A9AD] text-sm">{error}</p>
        </div>
      ) : (
        <>
          <div className="relative aspect-square max-w-sm mx-auto overflow-hidden border-2 border-[#C9A84C]/30 bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-[#C9A84C]" />
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <p className="text-center text-sm text-[#A8A9AD] mt-4">
            {scanning ? "Position your QR code within the frame..." : "Starting camera..."}
          </p>
        </>
      )}
    </div>
  );
}
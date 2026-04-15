import { useRef, useState, useEffect, useCallback } from 'react';

interface CircularCropModalProps {
  imageFile: File;
  onCrop: (dataUrl: string) => void;
  onCancel: () => void;
  title: string;
}

const CROP_SIZE = 240;

const CircularCropModal = ({ imageFile, onCrop, onCancel, title }: CircularCropModalProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const lastTouchDist = useRef<number | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    const image = new Image();
    image.onload = () => {
      setImg(image);
      // Fit image so shortest side matches crop size
      const minDim = Math.min(image.width, image.height);
      setScale(CROP_SIZE / minDim);
      setOffset({
        x: -(image.width * (CROP_SIZE / minDim) - CROP_SIZE) / 2,
        y: -(image.height * (CROP_SIZE / minDim) - CROP_SIZE) / 2,
      });
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Draw preview
  useEffect(() => {
    if (!img || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const size = CROP_SIZE * 2; // retina
    canvasRef.current.width = size;
    canvasRef.current.height = size;

    ctx.clearRect(0, 0, size, size);

    // Draw dimmed background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);

    // Clip to circle and draw image
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(
      img,
      offset.x * 2,
      offset.y * 2,
      img.width * scale * 2,
      img.height * scale * 2
    );
    ctx.restore();

    // Draw circle border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
  }, [img, scale, offset]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: offset.x,
      origY: offset.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [offset]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset({
      x: dragRef.current.origX + dx,
      y: dragRef.current.origY + dy,
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Touch pinch zoom
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (lastTouchDist.current !== null) {
        const delta = dist - lastTouchDist.current;
        setScale(s => Math.max(0.1, Math.min(5, s + delta * 0.002)));
      }
      lastTouchDist.current = dist;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastTouchDist.current = null;
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => Math.max(0.1, Math.min(5, s - e.deltaY * 0.001)));
  }, []);

  const handleCrop = useCallback(() => {
    if (!img) return;
    const outCanvas = document.createElement('canvas');
    const outSize = CROP_SIZE;
    outCanvas.width = outSize;
    outCanvas.height = outSize;
    const ctx = outCanvas.getContext('2d')!;

    ctx.beginPath();
    ctx.arc(outSize / 2, outSize / 2, outSize / 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.drawImage(
      img,
      offset.x,
      offset.y,
      img.width * scale,
      img.height * scale
    );

    onCrop(outCanvas.toDataURL('image/png'));
  }, [img, offset, scale, onCrop]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="flex flex-col items-center gap-4 bg-foreground/90 rounded-2xl p-6 max-w-sm w-full">
        <h3 className="text-game-ui font-game text-xs text-center">{title}</h3>
        <p className="text-muted-foreground text-xs text-center">
          드래그로 위치 이동, 스크롤/핀치로 확대/축소
        </p>

        <div
          className="relative overflow-hidden rounded-full touch-none"
          style={{ width: CROP_SIZE, height: CROP_SIZE }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          <canvas
            ref={canvasRef}
            style={{ width: CROP_SIZE, height: CROP_SIZE }}
            className="cursor-grab active:cursor-grabbing"
          />
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-muted text-muted-foreground font-game text-[10px] rounded-lg active:scale-95 transition-all"
          >
            취소
          </button>
          <button
            onClick={handleCrop}
            className="flex-1 px-4 py-3 bg-primary text-primary-foreground font-game text-[10px] rounded-lg active:scale-95 transition-all"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
};

export default CircularCropModal;

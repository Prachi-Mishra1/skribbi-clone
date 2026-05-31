import { useEffect, useRef, useCallback } from 'react';

interface Props {
  isDrawer: boolean;
  drawData: any;
  shouldClearCanvas: boolean;
  undoStrokes: any[][];
  onDrawStart: (x: number, y: number, color: string, size: number) => void;
  onDrawMove: (x: number, y: number) => void;
  onDrawEnd: () => void;
  onClear: () => void;
  onUndo: () => void;
  color: string;
  brushSize: number;
}

export default function DrawingCanvas({
  isDrawer, drawData, shouldClearCanvas, undoStrokes,
  onDrawStart, onDrawMove, onDrawEnd,
  onClear, onUndo, color, brushSize
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const currentColor = useRef(color);
  const currentSize = useRef(brushSize);

  useEffect(() => { currentColor.current = color; }, [color]);
  useEffect(() => { currentSize.current = brushSize; }, [brushSize]);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, from: any, to: any, color: string, size: number) => {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, []);

  // Handle incoming draw data from other players
  useEffect(() => {
    if (!drawData) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    if (drawData.type === 'start') {
      lastPos.current = { x: drawData.x, y: drawData.y };
    } else if (drawData.type === 'move') {
      drawStroke(ctx, lastPos.current, { x: drawData.x, y: drawData.y }, drawData.color || '#000', drawData.size || 4);
      lastPos.current = { x: drawData.x, y: drawData.y };
    }
  }, [drawData]);

  // Handle clear canvas
  useEffect(() => {
    if (!shouldClearCanvas) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [shouldClearCanvas]);

  // Handle undo — redraw all strokes
  useEffect(() => {
    if (!undoStrokes || undoStrokes.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let prev: any = null;
    for (const stroke of undoStrokes) {
      prev = null;
      for (const pt of stroke) {
        if (pt.type === 'start') { prev = pt; }
        else if (pt.type === 'move' && prev) {
          drawStroke(ctx, prev, pt, pt.color || '#000', pt.size || 4);
          prev = pt;
        }
      }
    }
  }, [undoStrokes]);

  // Mouse events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isDrawer) return;
    const ctx = canvas.getContext('2d')!;

    const onMouseDown = (e: MouseEvent) => {
      isDrawing.current = true;
      const pos = getPos(e, canvas);
      lastPos.current = pos;
      onDrawStart(pos.x, pos.y, currentColor.current, currentSize.current);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDrawing.current) return;
      const pos = getPos(e, canvas);
      drawStroke(ctx, lastPos.current, pos, currentColor.current, currentSize.current);
      lastPos.current = pos;
      onDrawMove(pos.x, pos.y);
    };

    const onMouseUp = () => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      onDrawEnd();
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      isDrawing.current = true;
      const pos = getPos(e, canvas);
      lastPos.current = pos;
      onDrawStart(pos.x, pos.y, currentColor.current, currentSize.current);
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isDrawing.current) return;
      const pos = getPos(e, canvas);
      drawStroke(ctx, lastPos.current, pos, currentColor.current, currentSize.current);
      lastPos.current = pos;
      onDrawMove(pos.x, pos.y);
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onMouseUp);
    };
  }, [isDrawer]);

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className={`drawing-canvas ${isDrawer ? 'can-draw' : ''}`}
      />
      {isDrawer && (
        <div className="canvas-controls">
          <button onClick={onUndo} title="Undo">↩️ Undo</button>
          <button onClick={onClear} title="Clear">🗑️ Clear</button>
        </div>
      )}
    </div>
  );
}
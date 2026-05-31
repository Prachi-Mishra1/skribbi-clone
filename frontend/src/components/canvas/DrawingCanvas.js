import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useCallback } from 'react';
export default function DrawingCanvas({ isDrawer, drawData, shouldClearCanvas, undoStrokes, onDrawStart, onDrawMove, onDrawEnd, onClear, onUndo, color, brushSize }) {
    const canvasRef = useRef(null);
    const isDrawing = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const currentColor = useRef(color);
    const currentSize = useRef(brushSize);
    useEffect(() => { currentColor.current = color; }, [color]);
    useEffect(() => { currentSize.current = brushSize; }, [brushSize]);
    const getPos = (e, canvas) => {
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
    const drawStroke = useCallback((ctx, from, to, color, size) => {
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
        if (!drawData)
            return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas)
            return;
        if (drawData.type === 'start') {
            lastPos.current = { x: drawData.x, y: drawData.y };
        }
        else if (drawData.type === 'move') {
            drawStroke(ctx, lastPos.current, { x: drawData.x, y: drawData.y }, drawData.color || '#000', drawData.size || 4);
            lastPos.current = { x: drawData.x, y: drawData.y };
        }
    }, [drawData]);
    // Handle clear canvas
    useEffect(() => {
        if (!shouldClearCanvas)
            return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas)
            return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, [shouldClearCanvas]);
    // Handle undo — redraw all strokes
    useEffect(() => {
        if (!undoStrokes || undoStrokes.length === 0)
            return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas)
            return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let prev = null;
        for (const stroke of undoStrokes) {
            prev = null;
            for (const pt of stroke) {
                if (pt.type === 'start') {
                    prev = pt;
                }
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
        if (!canvas || !isDrawer)
            return;
        const ctx = canvas.getContext('2d');
        const onMouseDown = (e) => {
            isDrawing.current = true;
            const pos = getPos(e, canvas);
            lastPos.current = pos;
            onDrawStart(pos.x, pos.y, currentColor.current, currentSize.current);
        };
        const onMouseMove = (e) => {
            if (!isDrawing.current)
                return;
            const pos = getPos(e, canvas);
            drawStroke(ctx, lastPos.current, pos, currentColor.current, currentSize.current);
            lastPos.current = pos;
            onDrawMove(pos.x, pos.y);
        };
        const onMouseUp = () => {
            if (!isDrawing.current)
                return;
            isDrawing.current = false;
            onDrawEnd();
        };
        const onTouchStart = (e) => {
            e.preventDefault();
            isDrawing.current = true;
            const pos = getPos(e, canvas);
            lastPos.current = pos;
            onDrawStart(pos.x, pos.y, currentColor.current, currentSize.current);
        };
        const onTouchMove = (e) => {
            e.preventDefault();
            if (!isDrawing.current)
                return;
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
    return (_jsxs("div", { className: "canvas-wrapper", children: [_jsx("canvas", { ref: canvasRef, width: 800, height: 500, className: `drawing-canvas ${isDrawer ? 'can-draw' : ''}` }), isDrawer && (_jsxs("div", { className: "canvas-controls", children: [_jsx("button", { onClick: onUndo, title: "Undo", children: "\u21A9\uFE0F Undo" }), _jsx("button", { onClick: onClear, title: "Clear", children: "\uD83D\uDDD1\uFE0F Clear" })] }))] }));
}

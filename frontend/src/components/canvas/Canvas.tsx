import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'

export interface CanvasHandle {
  receiveDrawData: (data: any) => void
  clearCanvas: () => void
  undoStrokes: (strokes: any[]) => void
}

interface Props {
  isDrawer: boolean
  color: string
  size: number
  tool: 'pen' | 'eraser'
  onDrawStart: (d: any) => void
  onDrawMove: (d: any) => void
  onDrawEnd: () => void
  onClear: () => void
  onUndo: () => void
}

const Canvas = forwardRef<CanvasHandle, Props>(
  ({ isDrawer, color, size, tool, onDrawStart, onDrawMove, onDrawEnd }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isDrawing = useRef(false)
    const lastPos = useRef({ x: 0, y: 0 })

    useImperativeHandle(ref, () => ({
      receiveDrawData(data: any) {
        const ctx = getCtx()
        if (!ctx) return
        if (data.type === 'start') {
          ctx.beginPath()
          ctx.strokeStyle = data.color
          ctx.lineWidth = data.size
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.moveTo(data.x, data.y)
        } else if (data.type === 'move') {
          ctx.lineTo(data.x, data.y)
          ctx.stroke()
        }
      },
      clearCanvas() {
        const ctx = getCtx()
        const canvas = canvasRef.current
        if (!ctx || !canvas) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      },
      undoStrokes(strokes: any[]) {
        const ctx = getCtx()
        const canvas = canvasRef.current
        if (!ctx || !canvas) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        strokes.forEach(s => {
          if (s.type === 'start') {
            ctx.beginPath()
            ctx.strokeStyle = s.color
            ctx.lineWidth = s.size
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.moveTo(s.x, s.y)
          } else if (s.type === 'move') {
            ctx.lineTo(s.x, s.y)
            ctx.stroke()
          }
        })
      }
    }))

    function getCtx() {
      return canvasRef.current?.getContext('2d') ?? null
    }

    function getPos(e: React.MouseEvent) {
      const canvas = canvasRef.current!
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      }
    }

    function handleMouseDown(e: React.MouseEvent) {
      if (!isDrawer) return
      e.preventDefault()
      const pos = getPos(e)
      isDrawing.current = true
      lastPos.current = pos
      const ctx = getCtx()!
      const drawColor = tool === 'eraser' ? '#ffffff' : color
      const drawSize = tool === 'eraser' ? size * 3 : size
      ctx.beginPath()
      ctx.strokeStyle = drawColor
      ctx.lineWidth = drawSize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.moveTo(pos.x, pos.y)
      onDrawStart({ x: pos.x, y: pos.y, color: drawColor, size: drawSize, type: 'start' })
    }

    function handleMouseMove(e: React.MouseEvent) {
      if (!isDrawer || !isDrawing.current) return
      e.preventDefault()
      const pos = getPos(e)
      const ctx = getCtx()!
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      onDrawMove({ x: pos.x, y: pos.y, type: 'move' })
      lastPos.current = pos
    }

    function handleMouseUp(e: React.MouseEvent) {
      if (!isDrawing.current) return
      e.preventDefault()
      isDrawing.current = false
      onDrawEnd()
    }

    function handleMouseLeave() {
      if (isDrawing.current) {
        isDrawing.current = false
        onDrawEnd()
      }
    }

    useEffect(() => {
      const canvas = canvasRef.current!
      canvas.width = 800
      canvas.height = 500
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 800, 500)
    }, [])

    return (
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '12px',
          border: '2px solid #2d2d4e',
          background: '#ffffff',
          cursor: isDrawer ? (tool === 'eraser' ? 'cell' : 'crosshair') : 'default',
          display: 'block',
          touchAction: 'none'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    )
  }
)

Canvas.displayName = 'Canvas'
export default Canvas
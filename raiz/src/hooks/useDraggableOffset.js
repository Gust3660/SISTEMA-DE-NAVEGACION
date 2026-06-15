import { useState } from 'react';

export function useDraggableOffset({ min = -220, max = 260 } = {}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const startDrag = (event) => {
    const startY = event.clientY;
    const startOffset = offset;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);

    const handleMove = (moveEvent) => {
      const nextOffset = Math.min(Math.max(startOffset + startY - moveEvent.clientY, min), max);
      setOffset(nextOffset);
    };

    const handleEnd = () => {
      setDragging(false);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleEnd);
      window.removeEventListener('pointercancel', handleEnd);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleEnd);
    window.addEventListener('pointercancel', handleEnd);
  };

  return {
    offset,
    dragging,
    startDrag
  };
}

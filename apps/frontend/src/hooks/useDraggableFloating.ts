import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

type FloatingPosition = { x: number; y: number };

type UseDraggableFloatingOptions = {
  storageKey: string;
  defaultRight?: number;
  defaultBottom?: number;
  margin?: number;
};

const readStoredPosition = (storageKey: string): FloatingPosition | null => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FloatingPosition;
    return Number.isFinite(parsed.x) && Number.isFinite(parsed.y) ? parsed : null;
  } catch {
    return null;
  }
};

const clampPosition = (position: FloatingPosition, element: HTMLElement | null, margin: number): FloatingPosition => {
  const width = element?.offsetWidth ?? 56;
  const height = element?.offsetHeight ?? 56;
  const maxX = Math.max(margin, window.innerWidth - width - margin);
  const maxY = Math.max(margin, window.innerHeight - height - margin);

  return {
    x: Math.min(Math.max(position.x, margin), maxX),
    y: Math.min(Math.max(position.y, margin), maxY),
  };
};

export function useDraggableFloating<T extends HTMLElement>({
  storageKey,
  defaultRight = 24,
  defaultBottom = 24,
  margin = 12,
}: UseDraggableFloatingOptions): {
  ref: RefObject<T | null>;
  style: CSSProperties;
  position: FloatingPosition | null;
  dragHandleProps: {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  };
  consumeDragClick: () => boolean;
} {
  const ref = useRef<T>(null);
  const [position, setPosition] = useState<FloatingPosition | null>(() => readStoredPosition(storageKey));
  const dragStartRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const draggedRef = useRef(false);

  useEffect(() => {
    const element = ref.current;
    setPosition((current) => {
      const defaultPosition = {
        x: window.innerWidth - (element?.offsetWidth ?? 56) - defaultRight,
        y: window.innerHeight - (element?.offsetHeight ?? 56) - defaultBottom,
      };
      return clampPosition(current ?? defaultPosition, element, margin);
    });
  }, [defaultBottom, defaultRight, margin]);

  useEffect(() => {
    const handleResize = () => {
      setPosition((current) => current ? clampPosition(current, ref.current, margin) : current);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [margin]);

  useEffect(() => {
    if (!position) return;
    localStorage.setItem(storageKey, JSON.stringify(position));
  }, [position, storageKey]);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0 || !position) return;

    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragStartRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    };
    draggedRef.current = false;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const start = dragStartRef.current;
      if (!start || moveEvent.pointerId !== start.pointerId) return;

      const deltaX = moveEvent.clientX - start.startX;
      const deltaY = moveEvent.clientY - start.startY;
      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) draggedRef.current = true;

      setPosition(clampPosition({ x: start.originX + deltaX, y: start.originY + deltaY }, ref.current, margin));
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      if (dragStartRef.current?.pointerId !== upEvent.pointerId) return;
      dragStartRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [margin, position]);

  const consumeDragClick = useCallback(() => {
    if (!draggedRef.current) return false;
    draggedRef.current = false;
    return true;
  }, []);

  return {
    ref,
    style: position ? { left: position.x, top: position.y } : { right: defaultRight, bottom: defaultBottom },
    position,
    dragHandleProps: { onPointerDown },
    consumeDragClick,
  };
}

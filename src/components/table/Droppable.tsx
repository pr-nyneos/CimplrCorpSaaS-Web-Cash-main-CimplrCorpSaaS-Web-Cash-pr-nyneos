import { useDroppable } from '@dnd-kit/core';

export function Droppable({ id, children }: Readonly<{ id: string; children: React.ReactNode }>) {
  const { setNodeRef } = useDroppable({ id });

  return <div ref={setNodeRef}>{children}</div>;
}

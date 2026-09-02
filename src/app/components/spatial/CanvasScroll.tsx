import { ReactNode } from 'react';

/**
 * Scrollable region inside the dark canvas. `.right-panel` clips overflow so
 * the floating chrome stays put; content needs its own scroll container.
 */
export function CanvasScroll({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="absolute inset-0 dot-grid pointer-events-none" />
      <div className={`relative px-8 pt-24 pb-28 ${className}`}>{children}</div>
    </div>
  );
}

/** Grid of floating cards on the dark canvas. */
export function CanvasGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">{children}</div>;
}

/** Empty state centred in the canvas. */
export function CanvasEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="col-span-full py-20 text-center text-sm text-[#A3A3A3]">{children}</div>
  );
}

import { ReactNode } from 'react';
import { SpatialLayout } from './SpatialLayout';
import { LeftPanel } from './LeftPanel';
import { TopActionBar } from './TopActionBar';

interface SpatialPageProps {
  /** Light-theme panel: breadcrumb, title, controls, summary numbers */
  left: ReactNode;
  /** Dark-theme canvas: floating cards, grids, maps */
  right: ReactNode;
  /** Short label shown next to the live dot, top-right of the canvas */
  status?: string;
}

/**
 * Shell for every page other than the dashboard: light control panel on the
 * left third, dark data canvas on the right two thirds. Server-component safe —
 * the interactive pieces are client leaves.
 */
export function SpatialPage({ left, right, status }: SpatialPageProps) {
  return (
    <SpatialLayout
      leftContent={<LeftPanel>{left}</LeftPanel>}
      rightContent={
        <>
          <TopActionBar status={status} />
          {right}
        </>
      }
    />
  );
}

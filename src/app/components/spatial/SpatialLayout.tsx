"use client";

import { ReactNode } from 'react';

interface SpatialLayoutProps {
  leftContent: ReactNode;
  rightContent: ReactNode;
  floatingCards?: ReactNode;
}

export function SpatialLayout({ leftContent, rightContent, floatingCards }: SpatialLayoutProps) {
  return (
    <div className="spatial-container">
      <div className="spatial-wrapper">
        {/* Left Panel (Light Mode) */}
        <aside className="left-panel">
          {leftContent}
        </aside>

        {/* Right Panel (Dark Mode) */}
        <main className="right-panel">
          {rightContent}
          {floatingCards}
        </main>
      </div>
    </div>
  );
}

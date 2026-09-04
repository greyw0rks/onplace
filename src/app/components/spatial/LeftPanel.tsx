"use client";

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart2, Compass, Boxes, GitCompare, Swords } from 'lucide-react';

interface LeftPanelProps {
  children: ReactNode;
}

const NAV = [
  { href: '/', label: 'Dashboard', Icon: BarChart2 },
  { href: '/discover', label: 'Discover', Icon: Compass },
  { href: '/agents', label: 'Agents', Icon: Boxes },
  { href: '/compare', label: 'Compare', Icon: GitCompare },
  { href: '/battles', label: 'Battles', Icon: Swords },
];

export function LeftPanel({ children }: LeftPanelProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Top Navigation Strip */}
      <div className="px-8 pt-8 pb-4 border-b border-black/10">
        <Link href="/" aria-label="Onplaced home" className="inline-flex items-center gap-2 text-[#111111] mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span className="text-xs font-semibold tracking-tight">Onplaced</span>
        </Link>

        {/* Labels are rendered, not just title attributes: an icon-only strip
            reads as decoration and left four of the five pages undiscoverable. */}
        <nav className="flex flex-wrap items-center gap-x-1 gap-y-1">
          {NAV.map(({ href, label, Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-1.5 px-2 py-1.5 border-b-2 text-[10px] uppercase tracking-wider transition ${
                  active
                    ? 'bg-[#FF7A00]/10 border-[#FF7A00] text-[#FF7A00]'
                    : 'border-transparent text-[#808080] hover:text-[#111111]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="px-8 py-6 flex flex-col flex-1 min-h-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

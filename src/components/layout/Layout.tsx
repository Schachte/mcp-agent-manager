import { ReactNode } from 'react';
import SideNavigation from './SideNavigation';
import TitleBar from '@/components/TitleBar';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen min-h-screen w-full flex-col overflow-hidden bg-background">
      <TitleBar />
      <div className="flex h-full min-h-0 w-full">
        <SideNavigation />
        <main className="flex flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

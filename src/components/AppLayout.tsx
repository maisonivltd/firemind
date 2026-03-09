import { ReactNode } from "react";
import BottomNav from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showNav?: boolean;
}

const AppLayout = ({ children, title, showNav = true }: AppLayoutProps) => {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-background">
      {title && (
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md px-5 py-4">
          <h1 className="font-display text-xl font-bold text-foreground">{title}</h1>
        </header>
      )}
      <main className={`px-5 py-4 ${showNav ? "pb-24" : ""}`}>{children}</main>
      {showNav && <BottomNav />}
    </div>
  );
};

export default AppLayout;

import { NavLink as RouterNavLink } from "react-router-dom";
import { Home, Bell, StickyNote, MessageCircle } from "lucide-react";

const navItems = [
  { to: "/home", icon: Home, label: "Home" },
  { to: "/reminders", icon: Bell, label: "Promemoria" },
  { to: "/notes", icon: StickyNote, label: "Note" },
  { to: "/messages", icon: MessageCircle, label: "Messaggi" },
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <RouterNavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </RouterNavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;

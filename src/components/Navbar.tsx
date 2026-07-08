import { HeartPulse, LogOut, User as UserIcon, Server, Sparkles } from "lucide-react";
import { User } from "../types.js";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

export function Navbar({ user, onLogout, onNavigate }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-teal-50 bg-white px-6 shadow-xs">
      {/* Brand logo */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-100">
          <HeartPulse className="h-6 w-6" id="brand-logo-icon" />
        </div>
        <div>
          <span className="font-display text-lg font-bold tracking-tight text-gray-900 block leading-tight">
            PsoriCare <span className="text-teal-600 font-extrabold text-sm align-super font-sans">AI</span>
          </span>
          <span className="font-mono text-[9px] font-semibold text-teal-600 uppercase tracking-widest leading-none block">
            Dermatological screening
          </span>
        </div>
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-4">
        {/* Gemini API Status */}
        <div className="hidden items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs text-teal-700 md:flex">
          <Sparkles className="h-3 w-3 text-teal-600 animate-pulse" />
          <span className="font-mono font-semibold text-[11px]">Gemini 3.5: Active</span>
        </div>

        {user && (
          <>
            {/* Divider */}
            <div className="h-6 w-px bg-teal-100" />

            {/* Profile trigger */}
            <button 
              onClick={() => onNavigate("profile")}
              className="flex items-center gap-2.5 text-left hover:opacity-85 transition"
              id="btn-navbar-profile"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700 font-semibold text-sm border border-teal-100">
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="hidden lg:block">
                <p className="font-sans text-xs font-semibold text-gray-800 leading-none">
                  {user.username}
                </p>
                <p className="font-sans text-[10px] text-teal-600 font-medium mt-1">
                  Active Patient
                </p>
              </div>
            </button>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="ml-2 flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 text-xs font-medium text-red-600 hover:bg-red-100 active:scale-95 transition"
              title="Logout session"
              id="btn-logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}

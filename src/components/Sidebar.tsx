import { 
  LayoutGrid, 
  Camera, 
  Calculator, 
  FileText, 
  MessageSquare, 
  Settings,
  Heart,
  Calendar
} from "lucide-react";
import { User } from "../types.js";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  user: User | null;
}

export function Sidebar({ currentView, onNavigate, user }: SidebarProps) {
  if (!user) return null;

  const menuItems = [
    { id: "dashboard", label: "Overview", icon: LayoutGrid, desc: "Symptom trends & summary" },
    { id: "analysis", label: "Skin Assessment", icon: Camera, desc: "AI image screening tool" },
    { id: "pasi", label: "PASI Calculator", icon: Calculator, desc: "Psoriasis severity index" },
    { id: "symptoms", label: "Symptom Logger", icon: FileText, desc: "Track physical daily logs" },
    { id: "chat", label: "Consult AI", icon: MessageSquare, desc: "Specialist skin companion" },
    { id: "profile", label: "Profile Settings", icon: Settings, desc: "Account preferences" }
  ];

  return (
    <aside className="w-64 border-r border-teal-50 bg-white p-5 flex flex-col justify-between shrink-0 h-[calc(100vh-64px)] overflow-y-auto">
      <div className="space-y-6">
        <div>
          <p className="font-mono text-[9px] font-bold text-teal-500 uppercase tracking-widest pl-2">
            Clinical Tools
          </p>
          <nav className="mt-3 space-y-1.5" id="sidebar-nav">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  id={`nav-item-${item.id}`}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                    isActive
                      ? "bg-teal-600 text-white shadow-xs shadow-teal-100"
                      : "text-gray-500 hover:bg-teal-50/50 hover:text-teal-950"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-white" : "text-teal-500"}`} />
                  <div>
                    <span className="block text-xs font-semibold">{item.label}</span>
                    <span className={`block text-[10px] leading-tight ${isActive ? "text-teal-100" : "text-gray-400"}`}>
                      {item.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Safety medical notice */}
      <div className="rounded-xl bg-teal-50/50 border border-teal-100 p-3 mt-6">
        <div className="flex items-center gap-1.5 text-teal-600">
          <Heart className="h-3 w-3 text-teal-500 fill-teal-500" />
          <span className="font-mono text-[9px] font-bold text-teal-700 uppercase tracking-wider">
            Patient Companion
          </span>
        </div>
        <p className="font-sans text-[10px] text-teal-800 mt-1.5 leading-relaxed">
          Screenings are non-diagnostic. Consult your dermatologist for official clinical therapy.
        </p>
      </div>
    </aside>
  );
}

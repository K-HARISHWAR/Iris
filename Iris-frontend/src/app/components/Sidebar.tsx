import { Link, useLocation } from "react-router";
import { Home, FileText, PlusCircle, Eye } from "lucide-react";

export function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/new-analysis", icon: PlusCircle, label: "New Analysis" },
    { path: "/patient-history", icon: FileText, label: "Patient History" },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      {/* Logo/Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">IrisAI</h1>
            <p className="text-xs text-slate-400">Disease Prediction</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-500 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-slate-700">
        <div className="text-xs text-slate-400">
          <p>© 2026 IrisAI</p>
          <p className="mt-1">Version 1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
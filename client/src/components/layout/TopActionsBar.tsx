import { Tooltip } from "@heroui/react";
import { Sun, Moon, RotateCcw, LogOut } from "lucide-react";

type Props = {
  dark: boolean;
  collapsed: boolean;
  onToggleTheme: () => void;
  onReload: () => void;
  onLogout: () => void;
  hasToken: boolean;
};

export default function TopActionsBar({
  dark,
  collapsed,
  onToggleTheme,
  onReload,
  onLogout,
  hasToken,
}: Props) {
  const shell = dark
    ? "bg-[#0e1529]/80 ring-1 ring-[#1b2744] text-slate-100"
    : "bg-white/80 ring-1 ring-slate-200 text-slate-800";

  const btnBase = "h-11 w-11 rounded-xl flex items-center justify-center transition";
  const btnLight = "border border-slate-200 hover:bg-white";
  const btnDark = "border border-[#1b2744] hover:bg-[#15223a]";
  const btn = `${btnBase} ${dark ? btnDark : btnLight}`;

  return (
    <div
      className={`rounded-2xl ${shell} shadow-sm px-2 py-2 mb-4
                  flex items-center ${collapsed ? "justify-center" : "justify-between"} gap-2`}
    >
      <Tooltip content={dark ? "Light Mode" : "Dark Mode"} placement="right">
        <button className={btn} onClick={onToggleTheme} aria-label="Toggle Theme">
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </Tooltip>

      <Tooltip content="Reload" placement="right">
        <button className={btn} onClick={onReload} aria-label="Reload">
          <RotateCcw className="w-5 h-5" />
        </button>
      </Tooltip>

      {hasToken && (
        <Tooltip content="Logout" placement="right">
          <button
            className={`${btn} border-rose-200/60 bg-rose-100/70 hover:bg-rose-100 text-rose-700`}
            onClick={onLogout}
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </Tooltip>
      )}
    </div>
  );
}

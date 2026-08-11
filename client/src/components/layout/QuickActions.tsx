import { Button, Tooltip } from "@heroui/react";
import { LogOut, Moon, Sun } from "lucide-react";
import { useThemeStore } from "../../store/theme.store";
import { useAuthStore } from "../../store/auth.store";
import { useApi } from "../../hooks/useApi";
import { logout as logoutSvc } from "../../services/auth.service";
import { useNavigate } from "react-router-dom";

export default function QuickActions() {
  const { dark, toggle } = useThemeStore();
  const { reset } = useAuthStore();
  const api = useApi();
  const navigate = useNavigate();

  async function onLogout() {
    try { await logoutSvc(api); } catch (e) { console.log(e);
     }
    reset();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex items-center gap-2">
      <Tooltip content={dark ? "Light mode" : "Dark mode"}>
        <Button size="sm" variant="flat" onPress={toggle} isIconOnly aria-label="Toggle theme">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </Tooltip>

      <Tooltip content="Logout">
        <Button size="sm" color="danger" variant="flat" onPress={onLogout} isIconOnly aria-label="Logout">
          <LogOut className="w-4 h-4" />
        </Button>
      </Tooltip>
    </div>
  );
}

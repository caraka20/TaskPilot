import { KeyRound, ShieldCheck, UserRoundCog } from "lucide-react";

import { AccountPage } from "../../attendance/features/account/account-page";
import WorkspacePageHeader from "../../components/common/WorkspacePageHeader";
import { useAuthStore } from "../../store/auth.store";

export default function AccountSettingsPage() {
  const { role, username } = useAuthStore();
  const owner = role === "OWNER";

  return (
    <div data-workspace-page className="space-y-5 pb-8">
      <WorkspacePageHeader
        eyebrow="ARTECH • Personal workspace"
        title="Pengaturan akun"
        description="Kelola foto profil, identitas akun, dan keamanan sandi dari satu tempat."
        icon={UserRoundCog}
        metrics={[
          { label: "Username", value: `@${username}`, icon: UserRoundCog, tone: "cyan" },
          { label: "Hak akses", value: owner ? "Owner" : "User", icon: ShieldCheck, tone: "emerald" },
          { label: "Keamanan", value: "Profil & sandi", icon: KeyRound, tone: "indigo" },
        ]}
      />

      <AccountPage
        showHeader={false}
        user={{
          id: username,
          username,
          name: username,
          role: owner ? "ADMIN" : "USER",
          dailyRate: "0",
          isActive: true,
        }}
      />
    </div>
  );
}

import { Input, Select, SelectItem, Button, Card, CardBody } from "@heroui/react"
import { useAuthStore } from "../store/auth.store"
import type { Role } from "../store/auth.store"   // ⬅️ penting: type-only

export default function SettingsPage() {
  const { baseUrl, setBaseUrl, token, setToken, username, setUsername, role, setRole } = useAuthStore()

  return (
    <Card>
      <CardBody className="grid gap-4 max-w-xl">
        <Input label="Base URL" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
        <Input label="Token" value={token} onChange={(e) => setToken(e.target.value)} />
        <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />

        <Select
          label="Role"
          selectedKeys={role ? new Set([role]) : new Set()}   // ✅ NextUI expects a Set
          onChange={(e) => setRole(e.target.value as Role)}   // ✅ cast ke tipe Role
        >
          <SelectItem key="OWNER">OWNER</SelectItem>
          <SelectItem key="USER">USER</SelectItem>
        </Select>

        <Button color="primary">Simpan</Button>
      </CardBody>
    </Card>
  )
}

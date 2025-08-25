// src/pages/config/EffectiveConfigPage.tsx
import { useEffect, useState } from "react"
import { Card, CardBody, CardHeader, Chip, Spacer } from "@heroui/react"
import { useApi } from "../../hooks/useApi"
import { useAuthStore } from "../../store/auth.store"
import { getEffectiveConfig, type KonfigurasiResponse } from "../../services/config.service"

export default function EffectiveConfigPage() {
  const api = useApi()
  const { username } = useAuthStore()
  const [config, setConfig] = useState<KonfigurasiResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const c = await getEffectiveConfig(api, username || "")
        setConfig(c)
      } finally {
        setLoading(false)
      }
    })()
  }, [api, username])

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">Effective Config</h1>
      <Spacer y={4} />
      <Card>
        <CardHeader className="flex items-center gap-2">
          <span>Konfigurasi Efektif</span>
          <Chip size="sm" variant="flat">{username || "unknown"}</Chip>
        </CardHeader>
        <CardBody className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-foreground-500">Gaji per Jam</div>
            <div className="font-semibold">{loading ? "…" : (config?.gajiPerJam ?? "—")}</div>
          </div>
          <div>
            <div className="text-sm text-foreground-500">Batas Jeda (menit)</div>
            <div className="font-semibold">{loading ? "…" : (config?.batasJedaMenit ?? "—")}</div>
          </div>
          <div>
            <div className="text-sm text-foreground-500">Jeda Otomatis</div>
            <div className="font-semibold">
              {loading ? "…" : (config?.jedaOtomatisAktif ? "Aktif" : "Nonaktif")}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

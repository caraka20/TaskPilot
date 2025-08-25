import { useEffect, useState } from "react"
import { Input, Button, Card, CardBody, CardHeader, Chip, Spacer } from "@heroui/react"
import ConfigForm from "../../components/config/ConfigForm"
import { useApi } from "../../hooks/useApi"
import {
  getEffectiveConfig,
  putUserOverride,
  deleteUserOverride,
  type KonfigurasiResponse,
} from "../../services/config.service"
import BackButton from "../../components/common/BackButton"

export default function OverridesConfigPage() {
  const api = useApi()
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)

  const [effective, setEffective] = useState<KonfigurasiResponse | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function loadEffective() {
    if (!username) return
    setLoading(true)
    setMsg(null)
    try {
      const eff = await getEffectiveConfig(api, username)
      setEffective(eff)
      if (!eff) setMsg("Tidak ada konfigurasi untuk user ini (memakai global).")
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Gagal memuat konfigurasi")
    } finally {
      setLoading(false)
    }
  }

  async function upsertOverride(values: KonfigurasiResponse) {
    if (!username) return
    setLoading(true)
    setMsg(null)
    try {
      await putUserOverride(api, username, values) // PUT /api/konfigurasi/override/:username
      await loadEffective()
      setMsg("Override berhasil disimpan")
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Gagal menyimpan override")
    } finally {
      setLoading(false)
    }
  }

  async function removeOverride() {
    if (!username) return
    setLoading(true)
    setMsg(null)
    try {
      await deleteUserOverride(api, username) // DELETE /api/konfigurasi/override/:username
      await loadEffective()
      setMsg("Override dihapus. User kembali memakai global.")
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Gagal menghapus override")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setEffective(null)
    setMsg(null)
  }, [username])

  return (
    <div className="p-4 max-w-4xl mx-auto">
    <BackButton className="mb-2" />
      <h1 className="text-2xl font-semibold">User Overrides</h1>

      <Spacer y={4} />
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <Input
          label="Username"
          placeholder="mis. owner-test"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="sm:max-w-xs"
        />
        <Button color="primary" onPress={loadEffective} isLoading={loading} isDisabled={!username}>
          Load Konfigurasi
        </Button>
        <Button variant="flat" color="danger" onPress={removeOverride} isDisabled={!username} isLoading={loading}>
          Hapus Override
        </Button>
      </div>

      <Spacer y={4} />

      <Card>
        <CardHeader className="flex items-center gap-2">
          <span>Konfigurasi Efektif</span>
          <Chip size="sm" variant="flat">{username || "—"}</Chip>
        </CardHeader>
        <CardBody>
          {!username ? (
            <div className="text-sm text-foreground-500">Masukkan username, lalu klik “Load Konfigurasi”.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-foreground-500">Gaji per Jam</div>
                <div className="font-semibold">{effective?.gajiPerJam ?? "—"}</div>
              </div>
              <div>
                <div className="text-sm text-foreground-500">Batas Jeda (menit)</div>
                <div className="font-semibold">{effective?.batasJedaMenit ?? "—"}</div>
              </div>
              <div>
                <div className="text-sm text-foreground-500">Jeda Otomatis</div>
                <div className="font-semibold">{effective?.jedaOtomatisAktif ? "Aktif" : "Nonaktif"}</div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Spacer y={4} />

      <ConfigForm
        title="Set/Update Override"
        initial={effective ?? undefined}
        loading={loading}
        submitLabel="Simpan Override"
        onSubmit={upsertOverride}
      />

      {msg && (
        <>
          <Spacer y={2}/>
          <div className="text-sm text-foreground-500">{msg}</div>
        </>
      )}
    </div>
  )
}

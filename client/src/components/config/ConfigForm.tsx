// src/components/config/ConfigForm.tsx
import { Card, CardHeader, CardBody, Input, Switch, Button } from "@heroui/react"
import { Save } from "lucide-react"
import { useEffect, useState } from "react"
import type { KonfigurasiResponse } from "../../services/config.service"

type Props = {
  title: string
  initial?: KonfigurasiResponse
  loading?: boolean
  submitLabel?: string
  onSubmit: (values: KonfigurasiResponse) => Promise<void> | void
}

export default function ConfigForm({
  title,
  initial,
  loading,
  submitLabel = "Simpan",
  onSubmit,
}: Props) {
  const [gajiPerJam, setGajiPerJam] = useState<number | "">("")
  const [batasJedaMenit, setBatasJedaMenit] = useState<number | "">("")
  const [jedaOtomatisAktif, setJedaOtomatisAktif] = useState(false)

  useEffect(() => {
    if (!initial) return
    setGajiPerJam(
      typeof initial.gajiPerJam === "number" ? initial.gajiPerJam : ""
    )
    setBatasJedaMenit(
      typeof initial.batasJedaMenit === "number" ? initial.batasJedaMenit : ""
    )
    setJedaOtomatisAktif(Boolean(initial.jedaOtomatisAktif))
  }, [initial])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const values: KonfigurasiResponse = {}
    if (gajiPerJam !== "") values.gajiPerJam = Number(gajiPerJam)
    if (batasJedaMenit !== "") values.batasJedaMenit = Number(batasJedaMenit)
    values.jedaOtomatisAktif = Boolean(jedaOtomatisAktif)
    await onSubmit(values)
  }

  return (
    <Card as="form" onSubmit={handleSubmit} className="rounded-3xl border border-default-200/80 bg-content1 shadow-sm">
      <CardHeader className="flex-col items-start gap-1 px-5 pb-0 pt-5 sm:px-6 sm:pt-6">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-foreground-500">Isi nilai yang ingin diberlakukan khusus untuk pengguna ini.</p>
      </CardHeader>
      <CardBody className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
        <Input
          type="number"
          label="Gaji per Jam (Rp)"
          value={gajiPerJam === "" ? "" : String(gajiPerJam)}
          onChange={(e) => setGajiPerJam(e.target.value === "" ? "" : Number(e.target.value))}
          min={0}
          inputMode="numeric"
          labelPlacement="outside"
          description="Tarif per jam khusus pengguna."
          classNames={{ inputWrapper: "min-h-12 rounded-2xl" }}
        />
        <Input
          type="number"
          label="Batas Jeda (menit)"
          value={batasJedaMenit === "" ? "" : String(batasJedaMenit)}
          onChange={(e) => setBatasJedaMenit(e.target.value === "" ? "" : Number(e.target.value))}
          min={0}
          inputMode="numeric"
          labelPlacement="outside"
          description="Durasi sebelum jeda otomatis."
          classNames={{ inputWrapper: "min-h-12 rounded-2xl" }}
        />
        <div className="rounded-2xl border border-default-200 bg-default-50 p-4 sm:col-span-2">
          <Switch
            isSelected={jedaOtomatisAktif}
            onValueChange={setJedaOtomatisAktif}
          >
            <span className="font-semibold">Jeda otomatis aktif</span>
          </Switch>
          <p className="mt-2 text-sm text-foreground-500">Aktifkan jika pengguna ini mengikuti mekanisme jeda otomatis.</p>
        </div>

        <div className="flex justify-end border-t border-default-200 pt-5 sm:col-span-2">
          <Button
            type="submit"
            color="primary"
            isDisabled={loading}
            isLoading={loading}
            className="min-h-11 w-full rounded-2xl sm:w-auto"
            startContent={!loading && <Save className="h-4 w-4" />}
          >
            {submitLabel}
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

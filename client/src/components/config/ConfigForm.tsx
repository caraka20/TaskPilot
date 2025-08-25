// src/components/config/ConfigForm.tsx
import { Card, CardHeader, CardBody, Input, Switch, Button } from "@heroui/react"
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
    <Card as="form" onSubmit={handleSubmit}>
      <CardHeader className="font-semibold">{title}</CardHeader>
      <CardBody className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          type="number"
          label="Gaji per Jam (Rp)"
          value={gajiPerJam === "" ? "" : String(gajiPerJam)}
          onChange={(e) => setGajiPerJam(e.target.value === "" ? "" : Number(e.target.value))}
          min={0}
        />
        <Input
          type="number"
          label="Batas Jeda (menit)"
          value={batasJedaMenit === "" ? "" : String(batasJedaMenit)}
          onChange={(e) => setBatasJedaMenit(e.target.value === "" ? "" : Number(e.target.value))}
          min={0}
        />
        <div className="flex items-end">
          <Switch
            isSelected={jedaOtomatisAktif}
            onValueChange={setJedaOtomatisAktif}
          >
            Jeda Otomatis Aktif
          </Switch>
        </div>

        <div className="sm:col-span-3 flex justify-end">
          <Button
            type="submit"
            color="primary"
            isDisabled={loading}
            isLoading={loading}
          >
            {submitLabel}
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

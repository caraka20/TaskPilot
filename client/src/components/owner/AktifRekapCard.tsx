import { useEffect, useMemo, useState, type Key as ReactKey } from "react";
import {
  Card, CardHeader, CardBody, Button, Input, Select, SelectItem, Chip,
  type Selection,
} from "@heroui/react";
import { useApi } from "../../hooks/useApi";
import { getAktifRekap, type RekapResp } from "../../services/jamKerja.service";
import { numberID } from "../../utils/format";
import { Activity, RefreshCcw } from "lucide-react";

type Period = "minggu" | "bulan";

export default function AktifRekapCard({ defaultUsername }: { defaultUsername?: string }) {
  const api = useApi();
  const [username, setUsername] = useState<string>(defaultUsername ?? "");
  const [period, setPeriod] = useState<Period>("minggu");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RekapResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selection: Selection = useMemo(
    () => new Set<ReactKey>([period]) as Selection,
    [period]
  );

  async function fetchRekap() {
    if (!username.trim()) {
      setData(null);
      setError("Isi username untuk melihat rekap aktif.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getAktifRekap(api, username.trim(), period);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat rekap aktif");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // sengaja tidak auto-fetch
  }, []);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 opacity-70" />
          <span className="font-semibold">Rekap Aktif (OWNER)</span>
          {data && <Chip size="sm" variant="flat">{data.periode.toUpperCase()}</Chip>}
        </div>
        <Button
          size="sm"
          variant="flat"
          startContent={<RefreshCcw className="w-4 h-4" />}
          isLoading={loading}
          onPress={fetchRekap}
        >
          Refresh
        </Button>
      </CardHeader>

      <CardBody className="gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            size="sm"
            label="Username"
            placeholder="mis. raka20"
            labelPlacement="outside"
            value={username}
            onValueChange={(v) => { setUsername(v); setError(null); }}
          />

          <Select
            size="sm"
            label="Periode"
            labelPlacement="outside"
            selectedKeys={selection}
            onSelectionChange={(keys: Selection) => {
              if (keys === "all") return;
              const first = Array.from(keys as Set<ReactKey>)[0];
              if (first === "minggu" || first === "bulan") setPeriod(first);
            }}
          >
            <SelectItem key="minggu">Minggu Ini</SelectItem>
            <SelectItem key="bulan">Bulan Ini</SelectItem>
          </Select>

          <div className="flex items-end">
            <Button
              color="primary"
              className="w-full"
              isDisabled={!username.trim() || loading}
              onPress={fetchRekap}
            >
              Tampilkan
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-danger-200 bg-danger-50 text-danger-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        {data && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border bg-foreground-50 border-foreground-100 p-4">
              <div className="text-xs uppercase tracking-wide text-foreground-600">Username</div>
              <div className="text-xl font-semibold">{data.username}</div>
            </div>
            <div className="rounded-2xl border bg-success-50 border-success-100 p-4">
              <div className="text-xs uppercase tracking-wide text-success-700">Total Jam Aktif</div>
              <div className="text-2xl font-semibold text-success-700">
                {numberID.format(data.totalJam)} jam
              </div>
            </div>
            <div className="rounded-2xl border bg-foreground-50 border-foreground-100 p-4">
              <div className="text-xs uppercase tracking-wide text-foreground-600">Periode</div>
              <div className="text-xl font-semibold">
                {data.periode === "minggu" ? "Minggu Ini" : "Bulan Ini"}
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// client/src/pages/tuton/components/TutonItemsTable.tsx
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Chip, Button, Tooltip, Input, Switch,

const jenisColor = (j: string | JenisTugas) =>
  j === "DISKUSI" ? "primary" : j === "ABSEN" ? "secondary" : "warning";

export default function TutonItemsTable({ items, selected, onToggleSelect, onInlineUpdate }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <Table
          aria-label="Tuton Items"
          removeWrapper

          <TableBody emptyContent="Belum ada item. Inisialisasi dulu dari tombol di atas.">
            {items.map((it) => {
              const isAbsen = String(it.jenis) === "ABSEN";
              const isDone = String(it.status) === "SELESAI";
              return (
                <TableRow key={it.id} className="hover:bg-sky-50/60">
                  <TableCell>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-indigo-600"
                      checked={selected.has(it.id)}
                      onChange={(e) => onToggleSelect(it.id, e.target.checked)}
                    />
                  </TableCell>

                  <TableCell>
                    <Chip size="sm" variant="flat" color={jenisColor(it.jenis as any)}>
                      {String(it.jenis)}
                    </Chip>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-[13px]">{it.sesi}</span>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        size="sm"
                        isSelected={isDone}
                        onValueChange={(v) => onInlineUpdate(it.id, { status: v ? "SELESAI" : "BELUM" })}
                      />
                      <span className={isDone ? "text-emerald-600 font-medium" : "text-slate-600"}>
                        {isDone ? "Selesai" : "Belum"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    {isAbsen ? (
                      <span className="text-slate-400 text-sm">—</span>
                    ) : (
                      <NilaiCell
                        value={it.nilai ?? null}
                        onChange={(val) => onInlineUpdate(it.id, { nilai: val })}
                      />
                    )}
                  </TableCell>

                  <TableCell>
                    <DeskripsiCell
                      value={it.deskripsi ?? ""}
                      onChange={(val) => onInlineUpdate(it.id, { deskripsi: val })}
                    />
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Tooltip content="Tandai selesai">
                        <Button size="sm" variant="flat" onPress={() => onInlineUpdate(it.id, { status: "SELESAI" })}>
                          Selesai
                        </Button>
                      </Tooltip>
                      <Tooltip content="Tandai belum">
                        <Button size="sm" variant="flat" onPress={() => onInlineUpdate(it.id, { status: "BELUM" })}>
                          Belum
                        </Button>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function NilaiCell({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const [val, setVal] = useState<string>(value == null ? "" : String(value));

  return (
    <Input
      size="sm"
      variant="bordered"
      placeholder="-"
      value={val}
      onValueChange={(s) => setVal(s)}
      onBlur={() => {
        const num = val.trim() === "" ? null : Number(val);
        if (num === null) return onChange(null);
        if (Number.isFinite(num) && num >= 0 && num <= 100) onChange(num);
      }}
      className="max-w-[110px]"
      inputMode="numeric"
      pattern="[0-9]*"
    />
  );
}

function DeskripsiCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [val, setVal] = useState<string>(value ?? "");
  return (
    <Input
      size="sm"
      variant="bordered"
      placeholder="catatan…"
      value={val}
      onValueChange={setVal}
      onBlur={() => onChange(val.trim() || "")}
    />
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Popover, PopoverTrigger, PopoverContent, Input, Button } from "@heroui/react";
import { showApiError, showLoading, closeAlert, showSuccess } from "../../../utils/alert";

type Props = {
  initialScore?: number | null;
  onSubmit: (score: number | null) => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
  title?: string;
  openOnHover?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Perluas area trigger agar selebar/ setinggi tombol parent */
  expandTrigger?: boolean;
};

export default function ScoreEditorPopover({
  initialScore,
  onSubmit,
  children,
  disabled,
  title = "Input Nilai (0–100)",
  openOnHover = true,
  onOpenChange,
  expandTrigger = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState<string>(initialScore != null ? String(initialScore) : "");
  const [busy, setBusy] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const timers = useRef<{ in?: number; out?: number } | null>({});

  const setOpenSafe = (v: boolean) => {
    setOpen(v);
    onOpenChange?.(v);
  };
  const clearTimers = () => {
    if (!timers.current) return;
    if (timers.current.in) window.clearTimeout(timers.current.in);
    if (timers.current.out) window.clearTimeout(timers.current.out);
    timers.current = { in: undefined, out: undefined };
  };

  useEffect(() => {
    setVal(initialScore != null ? String(initialScore) : "");
  }, [initialScore, open]);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 30);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  const num = useMemo(() => {
    if (val === "") return null;
    const n = Number(val);
    return Number.isFinite(n) ? n : NaN;
  }, [val]);

  const error = useMemo(() => {
    if (val === "") return "";
    if (!Number.isFinite(num!)) return "Nilai harus berupa angka";
    if (num! < 0 || num! > 100) return "Rentang nilai 0–100";
    return "";
  }, [num, val]);

  const doSave = async () => {
    if (error) return;
    setBusy(true);
    showLoading("Menyimpan nilai…");
    try {
      await onSubmit(val === "" ? null : Number(val));
      closeAlert();
      await showSuccess("Nilai tersimpan");
      setOpenSafe(false);
    } catch (e) {
      closeAlert();
      await showApiError(e);
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    setBusy(true);
    showLoading("Menghapus nilai…");
    try {
      await onSubmit(null);
      closeAlert();
      await showSuccess("Nilai dihapus");
      setOpenSafe(false);
    } catch (e) {
      closeAlert();
      await showApiError(e);
    } finally {
      setBusy(false);
    }
  };

  const onEnter = () => {
    if (!openOnHover || disabled) return;
    clearTimers();
    timers.current!.in = window.setTimeout(() => setOpenSafe(true), 100);
  };
  const onLeave = () => {
    if (!openOnHover) return;
    clearTimers();
    timers.current!.out = window.setTimeout(() => setOpenSafe(false), 320);
  };

  // Buka popover dari klik tanpa men-trigger parent
  const onTriggerMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!disabled) setOpenSafe(true);
  };
  const onTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <Popover
      isOpen={open}
      onOpenChange={setOpenSafe}
      placement="bottom"
      offset={6}
      classNames={{ content: "z-[9999]" }}
    >
      <PopoverTrigger>
        <span
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          onMouseDown={onTriggerMouseDown}
          onClick={onTriggerClick}
          onKeyDown={(e) => e.stopPropagation()}
          className={expandTrigger ? "block w-full h-full" : ""}
        >
          {children}
        </span>
      </PopoverTrigger>

      <PopoverContent
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        className="max-w-[260px] z-[9999]"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="px-1 py-2">
          <div className="text-sm font-semibold mb-2">{title}</div>
          <Input
            ref={inputRef as any}
            type="number"
            label="Nilai"
            min={0}
            max={100}
            step={1}
            value={val}
            onValueChange={setVal}
            isInvalid={!!error}
            errorMessage={error}
            variant="bordered"
            placeholder="0–100"
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") {
                e.preventDefault();
                void doSave();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setOpenSafe(false);
              }
            }}
          />
          <div className="mt-3 flex justify-between gap-2">
            <Button size="sm" variant="flat" color="danger" onPress={clear} isLoading={busy}>
              Hapus
            </Button>
            <Button size="sm" color="primary" onPress={doSave} isLoading={busy} isDisabled={!!error}>
              Simpan
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, X, XCircle } from "lucide-react";
import { Button } from "./button";

type ToastTone = "success" | "error" | "info" | "warning";
type ToastItem = { id: number; title: string; description?: string; tone: ToastTone };
type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "warning" | "primary";
  requireAcknowledgement?: boolean;
  acknowledgementLabel?: string;
};

type FeedbackContextValue = {
  toast: (title: string, options?: { description?: string; tone?: ToastTone }) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmation, setConfirmation] = useState<ConfirmOptions | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const toastId = useRef(0);

  const toast = useCallback(
    (title: string, options?: { description?: string; tone?: ToastTone }) => {
      const id = ++toastId.current;
      setToasts((items) => [
        ...items,
        { id, title, description: options?.description, tone: options?.tone ?? "success" },
      ]);
      window.setTimeout(() => {
        setToasts((items) => items.filter((item) => item.id !== id));
      }, 4_500);
    },
    [],
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    resolver.current?.(false);
    setAcknowledged(false);
    setConfirmation(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const closeConfirmation = (result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setConfirmation(null);
    setAcknowledged(false);
  };

  const value = useMemo(() => ({ toast, confirm }), [confirm, toast]);
  const toastStyles = {
    success: { icon: CheckCircle2, box: "border-emerald-200 bg-white", iconBox: "bg-emerald-50 text-emerald-600" },
    error: { icon: XCircle, box: "border-rose-200 bg-white", iconBox: "bg-rose-50 text-rose-600" },
    info: { icon: Info, box: "border-blue-200 bg-white", iconBox: "bg-blue-50 text-blue-600" },
    warning: { icon: AlertTriangle, box: "border-amber-200 bg-white", iconBox: "bg-amber-50 text-amber-600" },
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[150] flex flex-col items-end gap-3 sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-6 sm:w-[390px]">
        {toasts.map((item) => {
          const style = toastStyles[item.tone];
          const Icon = style.icon;
          return (
            <div className={`pointer-events-auto w-full animate-toast overflow-hidden rounded-2xl border shadow-2xl shadow-slate-950/10 ${style.box}`} key={item.id}>
              <div className="flex gap-3 p-4">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${style.iconBox}`}><Icon size={19} /></span>
                <div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-slate-900">{item.title}</p>{item.description ? <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p> : null}</div>
                <button className="self-start rounded-lg p-1 text-slate-400 hover:bg-slate-100" onClick={() => setToasts((items) => items.filter((toastItem) => toastItem.id !== item.id))} type="button"><X size={15} /></button>
              </div>
              <div className={`h-1 animate-toast-progress ${item.tone === "success" ? "bg-emerald-500" : item.tone === "error" ? "bg-rose-500" : item.tone === "warning" ? "bg-amber-500" : "bg-blue-500"}`} />
            </div>
          );
        })}
      </div>

      {confirmation ? (
        <div className="fixed inset-0 z-[140] grid place-items-center overflow-y-auto bg-[#061426]/70 p-4 backdrop-blur-md" role="dialog" aria-modal="true">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_30px_100px_rgba(2,12,27,.35)]">
            <div className="relative overflow-hidden border-b border-slate-100 px-6 pb-5 pt-6">
              <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-blue-50" />
              <span className={`relative grid h-12 w-12 place-items-center rounded-2xl ${confirmation.tone === "danger" ? "bg-rose-50 text-rose-600" : confirmation.tone === "warning" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>
                {confirmation.tone === "danger" ? <ShieldAlert size={23} /> : <AlertTriangle size={23} />}
              </span>
              <h2 className="relative mt-5 text-xl font-extrabold tracking-tight text-slate-950">{confirmation.title}</h2>
              <p className="relative mt-2 text-sm leading-6 text-slate-500">{confirmation.description}</p>
            </div>
            <div className="space-y-5 p-6">
              {confirmation.requireAcknowledgement ? (
                <button aria-checked={acknowledged} className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${acknowledged ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"}`} onClick={() => setAcknowledged((value) => !value)} role="switch" type="button">
                  <span className="text-xs font-bold leading-5 text-slate-700">{confirmation.acknowledgementLabel ?? "Saya memahami dampak tindakan ini"}</span>
                  <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${acknowledged ? "bg-[#2f7df4]" : "bg-slate-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${acknowledged ? "left-6" : "left-1"}`} /></span>
                </button>
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => closeConfirmation(false)} variant="secondary">{confirmation.cancelLabel ?? "Batal"}</Button>
                <Button disabled={confirmation.requireAcknowledgement && !acknowledged} onClick={() => closeConfirmation(true)} variant={confirmation.tone === "danger" ? "danger" : "primary"}>{confirmation.confirmLabel ?? "Ya, lanjutkan"}</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </FeedbackContext.Provider>
  );
}

// Provider dan hook sengaja disatukan agar API komponen hasil integrasi tetap
// kompatibel dengan project Absensi asal.
// eslint-disable-next-line react-refresh/only-export-components
export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("useFeedback harus digunakan di dalam FeedbackProvider.");
  return context;
}

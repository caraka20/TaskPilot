import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Chip, Skeleton } from "@heroui/react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  History,
  RefreshCw,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  TimerReset,
  UserRoundCog,
  Wallet2,
} from "lucide-react";
import { Link } from "react-router-dom";

import StatePanel from "../../components/common/StatePanel";
import WorkspacePageHeader from "../../components/common/WorkspacePageHeader";
import { useApi } from "../../hooks/useApi";
import {
  getEffectiveConfig,
  type EffectiveKonfigurasiResponse,
  type KonfigurasiResponse,
} from "../../services/config.service";
import { useAuthStore } from "../../store/auth.store";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

type ConfigKey =
  | "gajiPerJam"
  | "batasJedaMenit"
  | "jedaOtomatisAktif";

type SettingDefinition = {
  key: ConfigKey;
  label: string;
  shortLabel: string;
  description: string;
  impact: string;
  icon: typeof Wallet2;
  iconClass: string;
};

const SETTING_DEFINITIONS: SettingDefinition[] = [
  {
    key: "gajiPerJam",
    label: "Gaji per jam",
    shortLabel: "Tarif kerja",
    description:
      "Tarif dasar untuk menghitung upah berdasarkan durasi kerja yang telah disetujui.",
    impact:
      "Dipakai pada kalkulasi upah jam-jaman dan ringkasan payroll.",
    icon: Wallet2,
    iconClass:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  {
    key: "batasJedaMenit",
    label: "Batas jeda",
    shortLabel: "Waktu tidak aktif",
    description:
      "Durasi tidak aktif yang menjadi acuan sistem sebelum mekanisme jeda dijalankan.",
    impact:
      "Membantu menjaga durasi kerja tercatat secara lebih akurat.",
    icon: Clock3,
    iconClass:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  },
  {
    key: "jedaOtomatisAktif",
    label: "Jeda otomatis",
    shortLabel: "Otomasi sesi",
    description:
      "Status otomatisasi jeda ketika batas waktu tidak aktif telah tercapai.",
    impact:
      "Mengendalikan perilaku sesi absensi dan pencatatan jam kerja.",
    icon: TimerReset,
    iconClass:
      "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  },
];

function formatUpdatedAt(value?: string) {
  if (!value) return "Belum tercatat";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Belum tercatat";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(parsed);
}

function formatValue(
  key: ConfigKey,
  value: KonfigurasiResponse[ConfigKey],
) {
  if (value === undefined || value === null) {
    return "—";
  }

  if (key === "gajiPerJam") {
    return rupiah.format(Number(value));
  }

  if (key === "batasJedaMenit") {
    return `${Number(value)} menit`;
  }

  return value ? "Aktif" : "Nonaktif";
}

function hasValue(
  source: KonfigurasiResponse | undefined,
  key: ConfigKey,
) {
  return (
    source?.[key] !== undefined &&
    source?.[key] !== null
  );
}

export default function EffectiveConfigPage() {
  const api = useApi();
  const { username, role } = useAuthStore();

  const [config, setConfig] =
    useState<EffectiveKonfigurasiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwner = role === "OWNER";

  const load = useCallback(async () => {
    if (!username) {
      setConfig(null);
      setError("Username pengguna tidak tersedia.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getEffectiveConfig(
        api,
        username,
      );

      setConfig(result);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Gagal memuat konfigurasi efektif.",
      );
    } finally {
      setLoading(false);
    }
  }, [api, username]);

  useEffect(() => {
    void load();
  }, [load]);

  const scopeIsUser =
    config?.scope === "USER" ||
    config?.scope === "OVERRIDE";

  const scopeLabel = scopeIsUser
    ? "Override pengguna"
    : "Konfigurasi global";

  const updater =
    config?.updatedBy?.namaLengkap ||
    config?.updatedBy?.username ||
    "Belum tercatat";

  const activeSettings = useMemo(
    () =>
      SETTING_DEFINITIONS.map((item) => ({
        ...item,
        value: formatValue(
          item.key,
          config?.[item.key],
        ),
        source: hasValue(
          config?.sources?.override,
          item.key,
        )
          ? "Override user"
          : "Global",
      })),
    [config],
  );

  return (
    <div
      data-workspace-page
      className="space-y-5 pb-8"
    >
      <WorkspacePageHeader
        eyebrow="ARTECH • Kontrol operasional"
        title="Konfigurasi efektif"
        description="Tinjau nilai final yang benar-benar digunakan sistem setelah konfigurasi global dan override pengguna digabungkan."
        icon={Settings2}
        actions={
          <>
            {isOwner && (
              <Button
                as={Link}
                to="/config/global"
                className="min-h-11 rounded-xl bg-white/10 px-4 font-semibold text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15"
                startContent={
                  <SlidersHorizontal className="h-4 w-4" />
                }
              >
                Atur global
              </Button>
            )}

            <Button
              className="min-h-11 rounded-xl bg-white px-4 font-semibold text-[#0b2948] shadow-sm transition hover:bg-slate-50"
              onPress={() => void load()}
              isLoading={loading}
              startContent={
                !loading ? (
                  <RefreshCw className="h-4 w-4" />
                ) : undefined
              }
            >
              Muat ulang
            </Button>
          </>
        }
        metrics={[
          {
            label: "Sumber aktif",
            value: loading
              ? "Memuat…"
              : scopeLabel,
            icon: scopeIsUser
              ? UserRoundCog
              : ShieldCheck,
            tone: scopeIsUser
              ? "violet"
              : "emerald",
          },
          {
            label: "Akun diperiksa",
            value: `@${
              config?.username ||
              username ||
              "—"
            }`,
            icon: UserRoundCog,
            tone: "cyan",
          },
          {
            label: "Status penerapan",
            value: "Aktif di sistem",
            icon: CheckCircle2,
            tone: "emerald",
          },
        ]}
      />

      {error ? (
        <StatePanel
          kind="error"
          title="Konfigurasi tidak dapat dimuat"
          description={error}
          actionLabel="Coba lagi"
          onAction={() => void load()}
        />
      ) : (
        <>
          <section className="overflow-hidden rounded-[24px] border border-default-200/80 bg-content1 shadow-[0_12px_35px_rgba(15,23,42,.06)]">
            <div className="flex flex-col gap-4 border-b border-default-200/70 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </span>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                    Nilai aktif
                  </p>

                  <h2 className="mt-0.5 text-lg font-bold text-foreground">
                    Ketentuan yang sedang berlaku
                  </h2>
                </div>
              </div>

              <Chip
                color={
                  scopeIsUser
                    ? "secondary"
                    : "success"
                }
                variant="flat"
                startContent={
                  scopeIsUser ? (
                    <UserRoundCog className="h-3.5 w-3.5" />
                  ) : (
                    <Settings2 className="h-3.5 w-3.5" />
                  )
                }
              >
                {scopeLabel}
              </Chip>
            </div>

            <div className="grid divide-y divide-default-200/70 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
              {activeSettings.map(
                ({
                  key,
                  label,
                  shortLabel,
                  description,
                  value,
                  source,
                  icon: Icon,
                  iconClass,
                }) => (
                  <article
                    key={key}
                    className="p-5 sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${iconClass}`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>

                      <span className="rounded-full bg-default-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground-500">
                        {source}
                      </span>
                    </div>

                    <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-foreground-400">
                      {shortLabel}
                    </p>

                    {loading ? (
                      <Skeleton className="mt-2 h-8 w-36 rounded-lg" />
                    ) : (
                      <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
                        {value}
                      </p>
                    )}

                    <h3 className="mt-4 font-bold text-foreground">
                      {label}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-foreground-500">
                      {description}
                    </p>
                  </article>
                ),
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-[24px] border border-default-200/80 bg-content1 shadow-[0_12px_35px_rgba(15,23,42,.06)]">
            <div className="flex flex-col gap-4 border-b border-default-200/70 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  Transparansi sumber
                </p>

                <h2 className="mt-1 text-lg font-bold text-foreground">
                  Global, override, dan hasil akhir
                </h2>

                <p className="mt-1 text-sm leading-6 text-foreground-500">
                  Bandingkan asal setiap nilai tanpa
                  membuka halaman pengaturan lain.
                </p>
              </div>

              {isOwner && (
                <Button
                  as={Link}
                  to="/config/overrides"
                  color="primary"
                  variant="flat"
                  className="min-h-11 rounded-xl font-semibold"
                  endContent={
                    <ArrowRight className="h-4 w-4" />
                  }
                >
                  Kelola override user
                </Button>
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-default-50/70 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground-400">
                    <th className="px-6 py-3.5">
                      Parameter
                    </th>

                    <th className="px-6 py-3.5">
                      Nilai global
                    </th>

                    <th className="px-6 py-3.5">
                      Override user
                    </th>

                    <th className="px-6 py-3.5">
                      Nilai efektif
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-default-200/70">
                  {SETTING_DEFINITIONS.map(
                    ({
                      key,
                      label,
                      icon: Icon,
                      iconClass,
                    }) => {
                      const overrideExists =
                        hasValue(
                          config?.sources
                            ?.override,
                          key,
                        );

                      return (
                        <tr
                          key={key}
                          className="transition-colors hover:bg-default-50/50"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span
                                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${iconClass}`}
                              >
                                <Icon className="h-4 w-4" />
                              </span>

                              <span className="font-semibold text-foreground">
                                {label}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4 font-medium text-foreground-600">
                            {loading ? (
                              <Skeleton className="h-5 w-28 rounded-lg" />
                            ) : (
                              formatValue(
                                key,
                                config?.sources
                                  ?.global?.[key],
                              )
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {loading ? (
                              <Skeleton className="h-5 w-28 rounded-lg" />
                            ) : overrideExists ? (
                              <span className="font-semibold text-secondary">
                                {formatValue(
                                  key,
                                  config?.sources
                                    ?.override?.[key],
                                )}
                              </span>
                            ) : (
                              <span className="text-sm text-foreground-400">
                                Mengikuti global
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {loading ? (
                              <Skeleton className="h-6 w-32 rounded-lg" />
                            ) : (
                              <span className="inline-flex items-center gap-2 font-bold text-foreground">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />

                                {formatValue(
                                  key,
                                  config?.[key],
                                )}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-default-200/70 md:hidden">
              {SETTING_DEFINITIONS.map(
                ({
                  key,
                  label,
                  icon: Icon,
                  iconClass,
                }) => {
                  const overrideExists =
                    hasValue(
                      config?.sources?.override,
                      key,
                    );

                  return (
                    <article
                      key={key}
                      className="p-5"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${iconClass}`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>

                        <h3 className="font-bold text-foreground">
                          {label}
                        </h3>
                      </div>

                      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                        <div>
                          <dt className="text-xs text-foreground-400">
                            Global
                          </dt>

                          <dd className="mt-1 font-semibold">
                            {formatValue(
                              key,
                              config?.sources
                                ?.global?.[key],
                            )}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs text-foreground-400">
                            Override
                          </dt>

                          <dd className="mt-1 font-semibold">
                            {overrideExists
                              ? formatValue(
                                  key,
                                  config
                                    ?.sources
                                    ?.override?.[
                                    key
                                  ],
                                )
                              : "Tidak ada"}
                          </dd>
                        </div>

                        <div className="col-span-2 rounded-xl bg-emerald-50 px-3 py-2.5 dark:bg-emerald-500/10">
                          <dt className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            Nilai efektif
                          </dt>

                          <dd className="mt-1 font-bold text-foreground">
                            {formatValue(
                              key,
                              config?.[key],
                            )}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  );
                },
              )}
            </div>

            <div className="grid border-t border-default-200/70 bg-default-50/55 sm:grid-cols-2">
              <div className="flex gap-3 px-5 py-4 sm:px-6">
                <History className="mt-0.5 h-4 w-4 shrink-0 text-foreground-400" />

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-foreground-400">
                    Terakhir diperbarui
                  </p>

                  {loading ? (
                    <Skeleton className="mt-2 h-5 w-44 rounded-lg" />
                  ) : (
                    <p className="mt-1 text-sm font-semibold">
                      {formatUpdatedAt(
                        config?.updatedAt,
                      )}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 border-t border-default-200/70 px-5 py-4 sm:border-l sm:border-t-0 sm:px-6">
                <UserRoundCog className="mt-0.5 h-4 w-4 shrink-0 text-foreground-400" />

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-foreground-400">
                    Diperbarui oleh
                  </p>

                  {loading ? (
                    <Skeleton className="mt-2 h-5 w-36 rounded-lg" />
                  ) : (
                    <p className="mt-1 text-sm font-semibold">
                      {updater}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[22px] border border-default-200/80 bg-content1 px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,.05)] sm:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">
                  Dampak operasional
                </p>

                <h2 className="mt-1 text-lg font-bold text-foreground">
                  Perubahan langsung dipakai oleh proses
                  terkait
                </h2>

                <p className="mt-1 text-sm leading-6 text-foreground-500">
                  Nilai efektif menjadi acuan absensi,
                  jeda otomatis, kalkulasi jam kerja,
                  dan ringkasan payroll tanpa perlu
                  pengaturan ulang di modul lain.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[510px]">
                {activeSettings.map(
                  ({
                    key,
                    label,
                    impact,
                    icon: Icon,
                  }) => (
                    <div
                      key={key}
                      className="flex gap-2.5 rounded-xl bg-default-50 px-3 py-3"
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {label}
                        </p>

                        <p className="mt-1 text-[11px] leading-4 text-foreground-500">
                          {impact}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
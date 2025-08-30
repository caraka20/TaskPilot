import { Link } from "react-router-dom";
import { Button, Card, CardBody, CardFooter, Chip } from "@heroui/react";
import { ArrowLeft, Home, Compass, Sparkles } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="relative min-h-[100vh] overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* soft background orbs */}
      <div className="pointer-events-none absolute -top-20 -left-24 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-fuchsia-300/40 via-indigo-300/40 to-sky-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-24 h-[460px] w-[460px] rounded-full bg-gradient-to-br from-emerald-300/40 via-teal-300/40 to-cyan-300/40 blur-3xl" />

      <div className="relative mx-auto flex min-h-[100vh] max-w-5xl flex-col items-center justify-center px-4">
        {/* Logo-ish spark */}
        <div className="mb-5">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-600/20">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>

        <Card className="w-full max-w-3xl overflow-hidden border border-slate-200/70 shadow-xl">
          <div className="h-1 w-full bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-sky-400" />

          <CardBody className="p-8">
            <div className="flex flex-col-reverse items-center gap-8 lg:flex-row">
              {/* Copy */}
              <div className="flex-1">
                <Chip
                  size="sm"
                  variant="flat"
                  className="mb-3 bg-white/80 text-slate-600"
                >
                  404 • Page Not Found
                </Chip>

                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  Halaman tidak ditemukan.
                </h1>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
                  Maaf, halaman yang kamu cari nggak tersedia, mungkin dipindah
                  atau tautannya salah. Kamu bisa kembali ke dashboard atau
                  menjelajah halaman lain di aplikasi.
                </p>

                {/* Quick links */}
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button
                    as={Link}
                    to="/dashboard"
                    color="primary"
                    className="h-11"
                    startContent={<Home className="h-4 w-4" />}
                  >
                    Kembali ke Dashboard
                  </Button>
                  <Button
                    as={Link}
                    to="/customers"
                    variant="flat"
                    className="h-11 bg-slate-100"
                    startContent={<Compass className="h-4 w-4" />}
                  >
                    Lihat Daftar Customers
                  </Button>
                </div>

                {/* Hints */}
                <div className="mt-4 text-[12px] text-slate-500">
                  Tip: tekan
                  <span className="mx-1 rounded-md bg-slate-100 px-1.5 py-0.5 font-medium">
                    Alt
                  </span>
                  +
                  <span className="mx-1 rounded-md bg-slate-100 px-1.5 py-0.5 font-medium">
                    ←
                  </span>
                  untuk kembali ke halaman sebelumnya.
                </div>
              </div>

              {/* Illustration */}
              <div className="flex-1">
                <div className="relative mx-auto max-w-[360px]">
                  <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-sky-200/50 via-indigo-200/50 to-fuchsia-200/50 blur-2xl" />
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                    {/* Minimal luxury SVG */}
                    <svg
                      viewBox="0 0 320 220"
                      className="h-auto w-full"
                      aria-hidden="true"
                    >
                      <defs>
                        <linearGradient id="grad1" x1="0" x2="1" y1="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="50%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                        <linearGradient id="grad2" x1="1" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#22d3ee" />
                        </linearGradient>
                      </defs>

                      <rect x="14" y="16" width="292" height="188" rx="18" fill="#ffffff" />
                      <rect x="14" y="16" width="292" height="188" rx="18" fill="url(#grad1)" opacity="0.08" />
                      <g>
                        <circle cx="90" cy="78" r="38" fill="url(#grad1)" opacity="0.25" />
                        <circle cx="230" cy="138" r="34" fill="url(#grad2)" opacity="0.25" />
                        <path
                          d="M60 160 C110 120, 210 110, 260 150"
                          stroke="url(#grad1)"
                          strokeWidth="4"
                          fill="none"
                          opacity="0.7"
                        />
                      </g>
                      <g>
                        <rect x="38" y="38" width="244" height="144" rx="12" fill="#fff" />
                        <rect x="38" y="38" width="244" height="144" rx="12" fill="url(#grad1)" opacity="0.06" />

                        <rect x="58" y="62" width="90" height="14" rx="7" fill="#e2e8f0" />
                        <rect x="58" y="84" width="146" height="10" rx="5" fill="#e2e8f0" />
                        <rect x="58" y="102" width="120" height="10" rx="5" fill="#e2e8f0" />

                        <rect x="58" y="130" width="204" height="46" rx="10" fill="url(#grad2)" opacity="0.18" />
                        <rect x="58" y="130" width="120" height="46" rx="10" fill="url(#grad1)" opacity="0.18" />
                      </g>

                      {/* 404 label */}
                      <g>
                        <text
                          x="160"
                          y="205"
                          textAnchor="middle"
                          fontSize="28"
                          fontWeight="700"
                          fill="url(#grad1)"
                          opacity="0.9"
                        >
                          404 — Not Found
                        </text>
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>

          <CardFooter className="flex items-center justify-between bg-gradient-to-r from-white to-slate-50 px-8 py-5">
            <Button
              as={Link}
              to={-1 as any}
              variant="flat"
              className="bg-slate-100"
              startContent={<ArrowLeft className="h-4 w-4" />}
            >
              Kembali
            </Button>

            <div className="text-[12px] text-slate-500">
              Butuh bantuan? Hubungi admin untuk memastikan tautan benar.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

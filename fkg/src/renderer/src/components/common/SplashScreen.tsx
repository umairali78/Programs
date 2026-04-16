interface SplashScreenProps {
  message?: string
  detail?: string
}

export function SplashScreen({
  message = 'Preparing your workspace',
  detail = 'Loading business settings, access, and the latest session.'
}: SplashScreenProps) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#150d14] text-white">
      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(247,178,103,0.26),_transparent_28%),radial-gradient(circle_at_75%_10%,_rgba(192,57,43,0.3),_transparent_28%),linear-gradient(145deg,_#12090e_0%,_#1c0f17_38%,_#311220_100%)]" />
        <div className="auth-orb absolute left-[-5rem] top-16 h-56 w-56 rounded-full bg-[#f7b267]/20 blur-3xl" />
        <div className="auth-orb absolute right-[-4rem] top-20 h-72 w-72 rounded-full bg-[#7c2d12]/25 blur-3xl" />
        <div className="auth-orb absolute bottom-[-3rem] left-1/3 h-48 w-48 rounded-full bg-[#c0392b]/20 blur-3xl" />

        <div className="auth-panel relative w-full max-w-xl rounded-[32px] border border-white/12 bg-white/10 p-6 text-center shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,_#4a1d28_0%,_#c0392b_100%)] text-2xl font-bold text-white shadow-[0_18px_36px_rgba(192,57,43,0.32)]">
            FKG
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.32em] text-[#f7d08a]">
            Fashion Ka Ghar MIS
          </p>
          <h1 className="font-display mt-4 text-5xl leading-none text-white sm:text-6xl">
            {message}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/72 sm:text-base">
            {detail}
          </p>

          <div className="mt-8">
            <div className="mx-auto h-2.5 w-full max-w-sm overflow-hidden rounded-full bg-white/10">
              <div className="splash-bar h-full rounded-full bg-[linear-gradient(90deg,_#f7b267_0%,_#c0392b_55%,_#f7d08a_100%)]" />
            </div>
          </div>

          <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">Access</p>
              <p className="mt-2 text-sm font-semibold text-white">Checking your session</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">Startup</p>
              <p className="mt-2 text-sm font-semibold text-white">Loading workspace shell</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">Style</p>
              <p className="mt-2 text-sm font-semibold text-white">Applying full theme</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

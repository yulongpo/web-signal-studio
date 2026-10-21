import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-sky-400">Web Signal Studio</p>
        <h1 className="text-3xl font-semibold text-white">P0 Workspace Scaffold</h1>
        <p className="max-w-2xl text-slate-300">
          Qt desktop signal analysis rebuild target. Vite + React + TypeScript + Tailwind v4.
          DSP / detection / project I/O land in later phases.
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['apps/web', 'UI shell, charts, routing'],
          ['packages/*', 'domain / contracts / dsp-wasm / charts'],
          ['services/local-compute', 'heavy FFT / detection sidecar'],
        ].map(([title, body]) => (
          <article key={title} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <h2 className="font-medium text-sky-300">{title}</h2>
            <p className="mt-2 text-sm text-slate-400">{body}</p>
          </article>
        ))}
      </section>
      <nav className="text-sm text-slate-400">
        <Link className="text-sky-400 hover:underline" to="/">
          Home
        </Link>
      </nav>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

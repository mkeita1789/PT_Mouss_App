import { Icon } from "@/components/Icon";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth">
      <aside className="auth-brand">
        <div className="side-brand" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="monogram">JC</span>
          <span>
            <div className="wordmark">PT MOUSS <b>IA</b></div>
            <div className="wordmark-sub">JIGI Coaching</div>
          </span>
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <p className="auth-quote">Discipline today, <em>results tomorrow.</em></p>
          <div className="auth-points" style={{ marginTop: 34 }}>
            <div><Icon nom="programme" /> Un programme construit à partir de ton bilan, qui évolue chaque semaine.</div>
            <div><Icon nom="suivi" /> Tes charges ajustées après chaque séance, selon tes reps réelles.</div>
            <div><Icon nom="coach" /> Ton coach suit tes séances et intervient quand il le faut.</div>
          </div>
        </div>
        <div className="meta" style={{ position: "relative", zIndex: 1 }}>Fessiers · préparation physique football · bien-être</div>
      </aside>
      <div className="auth-form-wrap">
        <div className="auth-mobile-brand">
          <span className="monogram">JC</span>
          <span>
            <div className="wordmark">PT MOUSS <b>IA</b></div>
            <div className="wordmark-sub">JIGI Coaching</div>
          </span>
        </div>
        {children}
      </div>
    </main>
  );
}

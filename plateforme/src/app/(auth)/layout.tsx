export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="screen" style={{ paddingTop: 48 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div className="jc" style={{ width: 64, height: 64, borderRadius: 20, fontSize: 28 }}>JC</div>
        <div className="brand" style={{ fontSize: 20 }}>
          PT MOUSS <span>IA</span>
        </div>
        <div className="brand-sub">JIGI Coaching</div>
      </div>
      {children}
    </main>
  );
}

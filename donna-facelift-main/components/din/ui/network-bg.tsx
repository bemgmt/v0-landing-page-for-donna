"use client"

export function NetworkBg() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#080b12]" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.15), transparent 40%),
            radial-gradient(circle at 80% 10%, rgba(6, 182, 212, 0.12), transparent 45%),
            radial-gradient(circle at 60% 80%, rgba(139, 92, 246, 0.08), transparent 35%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  )
}

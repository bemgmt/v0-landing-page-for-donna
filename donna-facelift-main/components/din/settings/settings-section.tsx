interface SettingsSectionProps {
  title: string
  children: React.ReactNode
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <div className="mb-6 last:mb-0">
      <h4 className="text-[10px] text-white/35 uppercase tracking-wider font-semibold mb-3">{title}</h4>
      {children}
    </div>
  )
}

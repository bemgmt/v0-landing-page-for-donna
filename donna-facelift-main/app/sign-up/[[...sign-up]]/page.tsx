export default function Page() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-3">
        <div className="text-sm uppercase tracking-[0.3em] text-white/60">Preview Only</div>
        <h1 className="text-2xl font-semibold">Sign Up Disabled</h1>
        <p className="text-white/70">
          Account creation isn&apos;t available in the facelift preview. All authentication flows are
          intentionally stubbed so the visual experience can be reviewed without backend services.
        </p>
      </div>
    </div>
  )
}

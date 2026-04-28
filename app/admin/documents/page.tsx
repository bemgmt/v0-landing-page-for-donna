export default function AdminDocumentsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold gradient-text">Documents</h1>
      <p className="text-sm text-muted-foreground">
        Upload binaries to the private <code className="text-cyan-200/90">portal-documents</code> bucket and insert
        rows into <code className="text-cyan-200/90">documents</code> via SQL or build an upload UI here later.
      </p>
      <p className="text-sm text-muted-foreground">
        Use <strong className="text-foreground">min_role</strong> of at least{" "}
        <code className="text-cyan-200/90">partner</code> for partner-only files. The{" "}
        <strong className="text-foreground">category</strong> field groups items on the partner documents page (e.g.{" "}
        <code className="text-cyan-200/90">sales_enablement</code>). The four strategic partner Markdown guides in the
        repo are served automatically to eligible partners via{" "}
        <code className="text-cyan-200/90">/api/portal/strategic-partner-docs/[slug]</code> — no duplicate upload
        required unless you also want a PDF in storage.
      </p>
    </div>
  )
}

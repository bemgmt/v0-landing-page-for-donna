export default function AdminDocumentsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold gradient-text">Documents</h1>
      <p className="text-sm text-muted-foreground">
        Upload binaries to the private `portal-documents` bucket and insert rows into `documents` via SQL or build
        an upload UI here later.
      </p>
    </div>
  )
}

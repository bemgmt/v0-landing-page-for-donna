import KnowledgePanel from "@/components/admin/knowledge-panel"

export const metadata = {
  title: "Knowledge Base | DONNA Admin",
  description: "Query your NotebookLM research notebook.",
}

export default function KnowledgeAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold gradient-text">Knowledge Base</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Query your DONNA research notebook. Answers are grounded in your uploaded sources.
        </p>
      </div>
      <KnowledgePanel />
    </div>
  )
}

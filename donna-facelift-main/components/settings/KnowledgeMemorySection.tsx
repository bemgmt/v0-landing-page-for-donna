"use client"

import { useState } from "react"
import { useFormContext } from "react-hook-form"
import SettingsSectionWrapper from "./SettingsSectionWrapper"
import { SettingsFormField } from "./SettingsFormField"
import { Button } from "@/components/ui/button"
import { Upload, X, FileText } from "lucide-react"
import { DocumentInfo } from "@/types/settings"

export default function KnowledgeMemorySection() {
  const { watch, setValue } = useFormContext()
  const documents = watch("knowledge.uploadedDocuments") as DocumentInfo[]
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      // TODO: Implement actual file upload logic
      const newDocuments: DocumentInfo[] = Array.from(files).map((file) => ({
        id: Math.random().toString(36).substring(7),
        name: file.name,
        type: getFileType(file.name),
        uploadedAt: new Date().toISOString(),
        size: file.size,
      }))

      setValue("knowledge.uploadedDocuments", [...documents, ...newDocuments])
    } catch (error) {
      console.error("File upload error:", error)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveDocument = (id: string) => {
    setValue(
      "knowledge.uploadedDocuments",
      documents.filter((doc) => doc.id !== id)
    )
  }

  const handleResetMemory = () => {
    if (confirm("Are you sure you want to reset all memory? This action cannot be undone.")) {
      setValue("knowledge.uploadedDocuments", [])
      setValue("knowledge.websiteSources", [])
      setValue("knowledge.manualNotes", "")
    }
  }

  return (
    <SettingsSectionWrapper
      title="Knowledge & Memory"
      description="Configure what DONNA knows and remembers"
    >
      <div className="space-y-6">
        <div className="p-4 glass border border-white/20 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Uploaded Documents</label>
            <p className="text-xs text-white/60 mb-3">
              Upload PDFs, Docs, SOPs, and Contracts for DONNA to reference
            </p>
            <div className="space-y-2">
              <input
                type="file"
                id="document-upload"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="document-upload" className="cursor-pointer">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Documents"}
                </Button>
              </label>

              {documents && documents.length > 0 && (
                <div className="space-y-2 mt-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2 bg-white/5 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-white/60" />
                        <div>
                          <p className="text-sm text-white">{doc.name}</p>
                          <p className="text-xs text-white/60">
                            {doc.type.toUpperCase()} • {(doc.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveDocument(doc.id)}
                        className="p-1 hover:bg-white/10 rounded"
                      >
                        <X className="w-4 h-4 text-white/60" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <SettingsFormField
            name="knowledge.websiteSources"
            label="Website Sources"
            description="URLs of websites DONNA should reference"
            type="textarea"
            placeholder="Enter website URLs, one per line..."
          />

          <SettingsFormField
            name="knowledge.crmDataFeeds"
            label="CRM / Data Feeds"
            description="Enable integration with CRM and data feeds"
            type="switch"
          />

          <SettingsFormField
            name="knowledge.manualNotes"
            label="Manual Notes"
            description="Additional context and notes for DONNA"
            type="textarea"
            placeholder="Enter manual notes and context..."
          />

          <SettingsFormField
            name="knowledge.memoryScope"
            label="Memory Scope"
            description="How DONNA should remember information"
            type="radio"
            options={[
              { value: "conversation", label: "Per conversation" },
              { value: "user", label: "Per user" },
              { value: "global", label: "Global business memory" },
            ]}
          />

          <div className="pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="destructive"
              onClick={handleResetMemory}
              className="w-full"
            >
              Forget / Reset Controls
            </Button>
            <p className="text-xs text-white/60 mt-2">
              This will clear all uploaded documents, website sources, and manual notes
            </p>
          </div>
        </div>
      </div>
    </SettingsSectionWrapper>
  )
}

function getFileType(filename: string): "pdf" | "doc" | "sop" | "contract" {
  const ext = filename.split(".").pop()?.toLowerCase()
  if (ext === "pdf") return "pdf"
  if (["doc", "docx"].includes(ext || "")) return "doc"
  if (filename.toLowerCase().includes("sop")) return "sop"
  if (filename.toLowerCase().includes("contract")) return "contract"
  return "doc"
}

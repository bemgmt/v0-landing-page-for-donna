import { describe, expect, it } from "vitest"
import { businessCardExtractionSchema } from "@/lib/card-scanner/card-scan-schema"

describe("businessCardExtractionSchema", () => {
  it("validates a fully populated object", () => {
    const validData = {
      full_name: "Jane Doe",
      company: "Acme Corp",
      job_title: "Software Engineer",
      phone: "+15555551212",
      email: "jane.doe@acme.com",
      website: "https://acme.com",
    }
    const result = businessCardExtractionSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validData)
    }
  })

  it("fails if any field is missing", () => {
    const invalidData = {
      full_name: "Jane Doe",
      company: "Acme Corp",
      job_title: "Software Engineer",
      phone: "+15555551212",
      email: "jane.doe@acme.com",
      // missing website
    }
    const result = businessCardExtractionSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })
})

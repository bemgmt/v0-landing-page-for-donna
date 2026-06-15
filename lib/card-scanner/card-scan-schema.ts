import { z } from "zod"

export const businessCardExtractionSchema = z.object({
  full_name: z.string().describe("Full name on the card"),
  company: z.string().describe("Company or organization name"),
  job_title: z.string().describe("Job title or role"),
  phone: z
    .string()
    .describe("Single best direct phone number; include extension/country code if shown"),
  email: z
    .string()
    .describe("Single best direct email; prefer personal over generic info@/sales@ when both exist"),
  website: z.string().describe("Main website URL as printed; normalize if obvious"),
})

export type BusinessCardExtraction = z.infer<typeof businessCardExtractionSchema>

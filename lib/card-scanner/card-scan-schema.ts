import { z } from "zod"

export const businessCardExtractionSchema = z.object({
  full_name: z.string().default("").describe("Full name on the card"),
  company: z.string().default("").describe("Company or organization name"),
  job_title: z.string().default("").describe("Job title or role"),
  phone: z
    .string()
    .default("")
    .describe("Single best direct phone number; include extension/country code if shown"),
  email: z
    .string()
    .default("")
    .describe("Single best direct email; prefer personal over generic info@/sales@ when both exist"),
  website: z.string().default("").describe("Main website URL as printed; normalize if obvious"),
})

export type BusinessCardExtraction = z.infer<typeof businessCardExtractionSchema>

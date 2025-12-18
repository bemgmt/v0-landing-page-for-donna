"use client"

import type React from "react"

import { useState } from "react"
import { useRef } from "react"

interface FormData {
  name: string
  email: string
  company: string
  role: string
  useCase: string
  type: "waitlist" | "demo"
}

export default function DemoForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    company: "",
    role: "",
    useCase: "",
    type: "waitlist",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Get Formspree project ID and deploy key from environment variables
      const formspreeProjectId = process.env.NEXT_PUBLIC_FORMSPREE_PROJECT_ID
      const formspreeDeployKey = process.env.NEXT_PUBLIC_FORMSPREE_DEPLOY_KEY
      
      if (!formspreeProjectId) {
        console.error("Formspree project ID not configured")
        alert("Form configuration error. Please contact us at info@bemdonna.com")
        setIsSubmitting(false)
        return
      }

      // Build headers with deploy key if provided
      const headers: HeadersInit = { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
      
      if (formspreeDeployKey) {
        headers["Authorization"] = `Bearer ${formspreeDeployKey}`
      }

      // Submit to Formspree using project ID
      const response = await fetch(`https://formspree.io/f/${formspreeProjectId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          role: formData.role,
          useCase: formData.useCase,
          type: formData.type === "waitlist" ? "Waitlist Signup" : "Demo Request",
          _subject: `DONNA ${formData.type === "waitlist" ? "Waitlist Signup" : "Demo Request"} - ${formData.name}`,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitSuccess(true)
        setFormData({ name: "", email: "", company: "", role: "", useCase: "", type: "waitlist" })
        setTimeout(() => setSubmitSuccess(false), 5000)
      } else {
        console.error("Form submission error:", data)
        alert(`Error: ${data.error || "Failed to send email. Please try again or contact us at info@bemdonna.com"}`)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      alert("Network error. Please check your connection and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div ref={formRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-primary/5">
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-8 rounded-xl glow-accent text-center">
          <h2 className="text-3xl font-bold mb-2 gradient-text">
            {formData.type === "waitlist" ? "Join the Waitlist" : "Request a Demo"}
          </h2>
          <p className="text-foreground/70 mb-6">
            {formData.type === "waitlist"
              ? "Be among the first to experience DONNA"
              : "See DONNA in action with a personalized demo"}
          </p>

          {submitSuccess && (
            <div className="mb-4 p-4 rounded-lg bg-secondary/20 border border-secondary/50 text-secondary">
              <p className="font-semibold">Success! We'll be in touch soon.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Waitlist vs Demo toggle */}
            <div className="flex gap-3 mb-6 justify-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="waitlist"
                  checked={formData.type === "waitlist"}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span>Join Waitlist</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="demo"
                  checked={formData.type === "demo"}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span>Request Demo</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-accent/50 focus:outline-none transition-colors"
              />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-accent/50 focus:outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="company"
                placeholder="Company Name"
                value={formData.company}
                onChange={handleChange}
                required
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-accent/50 focus:outline-none transition-colors"
              />
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-accent/50 focus:outline-none transition-colors [&>option]:bg-background [&>option]:text-foreground"
              >
                <option value="">Select Your Role</option>
                <option value="founder">Founder / CEO</option>
                <option value="operations">Operations Manager</option>
                <option value="hr">HR Manager</option>
                <option value="executive">Executive</option>
                <option value="other">Other</option>
              </select>
            </div>

            <textarea
              name="useCase"
              placeholder="Tell us about your use case (optional)"
              value={formData.useCase}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-accent/50 focus:outline-none transition-colors resize-none"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 rounded-lg bg-accent text-background hover:bg-accent/90 disabled:opacity-50 transition-all font-semibold glow-accent hover:shadow-[0_0_30px_rgba(132,204,255,0.5)]"
            >
              {isSubmitting ? "Submitting..." : formData.type === "waitlist" ? "Join Waitlist" : "Request Demo"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

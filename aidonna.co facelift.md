# **aidonna.co — Visual System Upgrade Brief**

*(Non-hero sections only)*

## **Global principles (apply to all sections)**

* **Tone:** calm, infrastructural, enterprise-grade

* **Motion rule:** nothing should call attention to itself — animations should be felt, not noticed

* **Timing:** slow by default (600–1200ms), long idle cycles (6–12s)

* **Mobile:** all animations degrade to static or ultra-minimal

---

## **1\. Section: What DONNA is**

### **Replace nodes → Stacked Operational Layers**

### **Concept**

Visually represent DONNA as an **additional operational intelligence layer** that sits above/between existing business systems — not another tool.

### **Visual structure**

* 5–7 stacked “glass” layers (rounded rectangles)

* Slight X/Y offsets (2–10px max)

* Low-opacity fills with subtle blur or frosted-glass effect

* Soft shadow separation (very shallow depth)

### **Spotlight layer (DONNA)**

One layer is visually distinct to symbolize DONNA:

* \+10–15% opacity vs others **OR**

* subtle accent tint (extremely restrained) **OR**

* soft halo glow behind only this layer (preferred)

This layer should sit **slightly forward** in Z-depth.

### **Motion behavior**

* **On scroll into view:**

  * layers gently “settle” into alignment (300–450ms ease-out)

* **Idle animation:**

  * spotlight layer performs a very slow “breathing” emphasis

    * opacity \+ glow oscillation

    * cycle: \~8–10 seconds

* Optional: micro parallax on scroll (2–6px range)

### **What this communicates**

DONNA isn’t replacing systems — it’s the layer that coordinates them.

---

## **2\. Section: Network Intelligence**

### **Visual: Signal Pulses (DONNA-to-DONNA Network)**

### **Concept**

Show shared, anonymized operational intelligence moving across a distributed network — **without** using dots, nodes, or social graphs.

### **Visual structure**

* 2–4 soft “emitters” (blurred points, not dots)

* Concentric rings expand outward from each emitter

* Rings fade as they expand (opacity drops to 0 before edges reach section bounds)

### **Motion behavior**

* Emitters pulse **asynchronously** (no synchronized radar feel)

* Pulse duration: 6–12 seconds

* Ring thickness: very thin (1px or equivalent)

* Opacity: extremely low (this should feel atmospheric)

### **Optional sophistication (only if it still feels clean)**

* Rare **segmented / dashed ring** to imply permissioned intelligence

* Occasional A → B pulse sequence (one emitter, then another shortly after)

### **What this communicates**

Intelligence is shared across DONNA systems — without exposing private data.

---

## **3\. Section: Why $1,500/month is a strategic deal**

### **Add: Animated comparison chart (single entrance animation)**

This is the **highest-leverage animation on the page** because it supports conversion logic.

### **Chart format**

**Vertical bars or stacked bars** (minimal, monochrome)

Suggested columns:

1. One segmented tool (e.g., lead gen software)

2. Stack of tools (ads \+ CRM \+ support \+ scheduling)

3. Part-time ops/admin hire (monthly equivalent)

4. **DONNA Beta – $1,500/mo** (highlighted)

### **Visual rules**

* No bright colors

* No gridlines unless ultra faint

* Numbers should be readable but not loud

* DONNA bar gets:

  * slight glow or edge highlight

  * clean label emphasizing *value density*, not hype

### **Motion behavior**

* **On viewport entry (once):**

  * bars animate upward (800–1200ms ease-out)

* After animation:

  * a single soft highlight sweep passes over the DONNA bar

* No looping animations here — this section should *settle*

### **What this communicates**

This isn’t “cheap software” — it’s a smarter allocation of spend.

---

## **4\. Section boundaries & restraint rules**

* **One motif per section.**

* Do **not** combine stacked layers \+ pulses \+ grids in the same viewport.

* Avoid:

  * fast motion

  * blinking

  * “AI sparkle”

  * neural-net clichés

If later you add the **flow-lines bridge**, it should live *between* sections and act as a transition, not a feature.

---

## **Technical recommendations (non-binding)**

* **SVG** for layers, pulses, and charts (best clarity \+ performance)

* CSS animations preferred over JS where possible

* Respect `prefers-reduced-motion`

* Disable or heavily simplify animations on mobile

---

## **Final sequencing (as it should feel to the user)**

1. Hero: bold, confident, static (already working)

2. What DONNA is → *“Oh, it’s a layer”*

3. Network Intelligence → *“Okay, it learns collectively”*

4. What DONNA replaces → *“That’s a lot of stuff”*

5. Why $1,500/mo → *“That math actually checks out”*

6. Join the paid beta → *“This feels intentional, not experimental”*


### Global page settings

\- Mobile-first design (375px baseline)  
\- Max-width only applied on desktop (1280–1440px)  
\- Dark theme default  
\- Use vertical rhythm: section padding 96px desktop / 64px mobile  
\- Avoid boxed sections except pricing card

### Hero Section (Full bleed animation)

Component: HeroFullBleed

\- Position: relative  
\- Background: video (DONNA animation)  
\- Video props:  
  autoplay  
  muted  
  loop  
  playsInline  
  preload="metadata"

\- Overlay:  
  linear-gradient (top→bottom)  
  rgba(0,0,0,0.55) → rgba(0,0,0,0.75)  
  subtle vignette

\- Content:  
  centered vertically  
  text-align: center  
  z-index above video

\- Headline: H1  
\- Subheadline: muted H2  
\- CTA stack: vertical on mobile

### Horizontal Use Case Carousel

Component: UseCaseCarousel

\- Wrapper:  
  overflow-x: scroll  
  scroll-snap-type: x mandatory  
  \-webkit-overflow-scrolling: touch

\- Cards:  
  width: 100vw (mobile)  
  scroll-snap-align: start  
  padding: 24–32px  
  no shadows  
  no borders

\- Sticky Category Labels:  
  position: sticky  
  top: 0  
  backdrop-blur  
  horizontal list  
  active state tied to scroll position

\- Progress Indicator:  
  thin bar or dots  
  reflects scroll index

### Pricing Section

Component: PricingSingleTier

\- Layout:  
  centered card  
  max-width: 520px  
  elevated slightly (soft shadow or glow)

\- Price:  
  large typography  
  monthly clarity  
  no discounts shown

\- Comparison Table:  
  horizontal scroll on mobile  
  fixed first column  
  simple typography  
  no checkmark overload

\- Emphasis:  
  DONNA row highlighted subtly

### Final CTA

Component: FinalCTA

\- Minimal  
\- No urgency language  
\- Large headline  
\- Single primary CTA


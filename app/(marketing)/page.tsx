import { Hero } from '@/components/marketing/Hero'
import { Features } from '@/components/marketing/Features'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { Pricing } from '@/components/marketing/Pricing'
import { Testimonials } from '@/components/marketing/Testimonials'
import { Nosotros } from '@/components/marketing/Nosotros'
import { CTAFinal } from '@/components/marketing/CTAFinal'
import { Footer } from '@/components/marketing/Footer'

/* Social proof band — inline since it's one element */
function SocialProof() {
  const industries = ['Retail', 'Restaurantes', 'Logística', 'Salud', 'Servicios']

  return (
    <div className="bg-surface border-y border-synk-border py-5">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate whitespace-nowrap">
          Utilizado por negocios en Panamá
        </p>
        <div className="h-4 w-px bg-synk-border hidden sm:block" />
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
          {industries.map((ind, i) => (
            <span key={ind} className="flex items-center gap-2 sm:gap-3">
              <span className="text-sm font-medium text-slate/70">{ind}</span>
              {i < industries.length - 1 && (
                <span className="text-synk-border">·</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <>
      <Hero />
      <SocialProof />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <Nosotros />
      <CTAFinal />
      <Footer />
    </>
  )
}

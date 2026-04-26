import type { Metadata } from 'next'
import { LegalLayout } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Terms of Service · Network Marketing Ultimate',
  description: 'The terms that govern your use of the NMU service.',
}

export default function TermsPage() {
  return <LegalLayout slug="terms" />
}

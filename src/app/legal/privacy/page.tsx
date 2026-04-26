import type { Metadata } from 'next'
import { LegalLayout } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Privacy Policy · Network Marketing Ultimate',
  description: 'How NMU collects, uses, and protects your data.',
}

export default function PrivacyPage() {
  return <LegalLayout slug="privacy" />
}

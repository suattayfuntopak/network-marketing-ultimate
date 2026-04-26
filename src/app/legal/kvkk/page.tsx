import type { Metadata } from 'next'
import { LegalLayout } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'KVKK Disclosure · Network Marketing Ultimate',
  description: 'How NMU complies with Turkish Personal Data Protection Law (KVKK).',
}

export default function KvkkPage() {
  return <LegalLayout slug="kvkk" />
}

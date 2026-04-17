import { redirect } from 'next/navigation'

export default async function ProspectsRedirect({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>
}) {
  const params = await searchParams
  redirect(params.new === '1' ? '/contacts?segment=prospects&new=1' : '/contacts?segment=prospects')
}

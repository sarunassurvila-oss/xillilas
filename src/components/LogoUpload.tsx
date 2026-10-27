'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LOGO_BUCKET, logoUrl } from '@/lib/listings'
import { createClient } from '@/lib/supabase/client'

const TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** Sumažina iki 400 px ir išsaugo PNG (išlieka permatomas fonas). */
async function toPng(file: File, max = 400): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  bmp.close()
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png'))
}

export function LogoUpload({ uid, logoPath }: { uid: string; logoPath: string | null }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function upload(file: File) {
    setMsg('')
    if (!TYPES.includes(file.type)) return setMsg('Tinka JPG, PNG arba WebP paveikslėlis.')
    if (file.size > 15 * 1024 * 1024) return setMsg('Failas per didelis (daugiausia 15 MB).')
    setBusy(true)
    try {
      const supabase = createClient()
      const path = `${uid}/logo-${crypto.randomUUID()}.png`
      const up = await supabase.storage.from(LOGO_BUCKET).upload(path, await toPng(file), { contentType: 'image/png', cacheControl: '31536000' })
      if (up.error) throw up.error
      const { error } = await supabase.from('profiles').update({ logo_path: path }).eq('id', uid)
      if (error) {
        await supabase.storage.from(LOGO_BUCKET).remove([path])
        throw error
      }
      if (logoPath) await supabase.storage.from(LOGO_BUCKET).remove([logoPath])
      router.refresh()
    } catch {
      setMsg('Nepavyko įkelti. Bandykite dar kartą.')
    }
    setBusy(false)
  }

  async function remove() {
    if (!logoPath) return
    setBusy(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ logo_path: null }).eq('id', uid)
    if (!error) await supabase.storage.from(LOGO_BUCKET).remove([logoPath])
    setBusy(false)
    if (error) return setMsg('Nepavyko pašalinti. Bandykite dar kartą.')
    router.refresh()
  }

  return (
    <div className="logo-up">
      {logoPath ? <img className="logo-img" src={logoUrl(logoPath)} alt="Įmonės logotipas" /> : <div className="logo-img logo-empty" aria-hidden="true">Logo</div>}
      <div className="logo-actions">
        <label className={`btn btn-ghost${busy ? ' is-busy' : ''}`}>
          {busy ? 'Įkeliama…' : logoPath ? 'Pakeisti logotipą' : 'Įkelti logotipą ar nuotrauką'}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(f) }} />
        </label>
        {logoPath && <button type="button" className="link-btn danger" disabled={busy} onClick={remove}>Pašalinti</button>}
        <small className="hint">PNG, JPG ar WebP. Rodomas šalia jūsų skelbimų.</small>
        {msg && <span className="form-error" role="alert">{msg}</span>}
      </div>
    </div>
  )
}

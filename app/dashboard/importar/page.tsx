import { ImportButton } from '@/components/dashboard/ImportButton'

export default function ImportarPage() {
  return (
    <div style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
      <div className="mb-8">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: 'var(--font-sora), Sora, sans-serif', color: '#0A1628' }}
        >
          Importar datos
        </h1>
        <p style={{ color: '#4A6580' }}>
          Sube tu archivo Excel con los datos de tu operación
        </p>
      </div>

      <div className="max-w-4xl px-0 sm:px-0">
        <ImportButton />
      </div>
    </div>
  )
}

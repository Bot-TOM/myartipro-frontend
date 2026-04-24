const statusConfig = {
  brouillon: { label: 'Brouillon',  className: 'bg-slate-100 text-slate-600' },
  envoyé:    { label: 'Envoyé',     className: 'bg-blue-50 text-blue-700' },
  accepté:   { label: 'Accepté',    className: 'bg-green-50 text-green-700' },
  refusé:    { label: 'Refusé',     className: 'bg-red-50 text-red-700' },
  relancé:   { label: 'Relancé',    className: 'bg-indigo-50 text-indigo-700' },
  consulté:  { label: 'Consulté',   className: 'bg-violet-50 text-violet-700' },
  en_attente:{ label: 'En attente', className: 'bg-yellow-50 text-yellow-700' },
  facturé:   { label: 'Facturé',    className: 'bg-indigo-50 text-indigo-700' },
  émise:     { label: 'Émise',      className: 'bg-orange-50 text-orange-700' },
  payée:     { label: 'Payée',      className: 'bg-green-50 text-green-700' },
  en_retard: { label: 'En retard',  className: 'bg-red-50 text-red-700' },
  archivée:  { label: 'Archivée',   className: 'bg-slate-100 text-slate-500' },
}

export default function StatusBadge({ statut }) {
  const config = statusConfig[statut] || { label: statut, className: 'bg-slate-100 text-slate-600' }

  return (
    <span className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-md ${config.className}`}>
      {config.label}
    </span>
  )
}

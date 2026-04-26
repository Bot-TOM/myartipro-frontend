const statusConfig = {
  brouillon:  { label: 'Brouillon',   dot: 'bg-slate-400',  className: 'bg-slate-100  text-slate-600' },
  envoyé:     { label: 'Envoyé',      dot: 'bg-blue-500',   className: 'bg-blue-50    text-blue-700' },
  accepté:    { label: 'Accepté',     dot: 'bg-green-500',  className: 'bg-green-50   text-green-700' },
  refusé:     { label: 'Refusé',      dot: 'bg-red-500',    className: 'bg-red-50     text-red-700' },
  relancé:    { label: 'Relancé',     dot: 'bg-indigo-500', className: 'bg-indigo-50  text-indigo-700' },
  consulté:   { label: 'Consulté',    dot: 'bg-violet-500', className: 'bg-violet-50  text-violet-700' },
  en_attente: { label: 'En attente',  dot: 'bg-yellow-500', className: 'bg-yellow-50  text-yellow-700' },
  facturé:    { label: 'Facturé',     dot: 'bg-indigo-500', className: 'bg-indigo-50  text-indigo-700' },
  émise:      { label: 'Émise',       dot: 'bg-orange-500', className: 'bg-orange-50  text-orange-700' },
  payée:      { label: 'Payée',       dot: 'bg-green-500',  className: 'bg-green-50   text-green-700' },
  en_retard:  { label: 'En retard',   dot: 'bg-red-500',    className: 'bg-red-50     text-red-700' },
  annulée:    { label: 'Annulée',     dot: 'bg-slate-400',  className: 'bg-slate-100  text-slate-500' },
  archivée:   { label: 'Archivée',    dot: 'bg-slate-400',  className: 'bg-slate-100  text-slate-500' },
}

export default function StatusBadge({ statut }) {
  const config = statusConfig[statut] || { label: statut, dot: 'bg-slate-400', className: 'bg-slate-100 text-slate-600' }

  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      {config.label}
    </span>
  )
}

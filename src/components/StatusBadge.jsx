const statusConfig = {
  brouillon: { label: 'Brouillon', className: 'bg-gray-100 text-gray-600' },
  envoyé: { label: 'Envoyé', className: 'bg-blue-100 text-blue-700' },
  accepté: { label: 'Accepté', className: 'bg-green-100 text-green-700' },
  refusé: { label: 'Refusé', className: 'bg-red-100 text-red-700' },
  relancé: { label: 'Relancé', className: 'bg-orange-100 text-orange-700' },
  en_attente: { label: 'En attente', className: 'bg-yellow-100 text-yellow-700' },
  facturé: { label: 'Facturé', className: 'bg-indigo-100 text-indigo-700' },
  émise: { label: 'Émise', className: 'bg-blue-100 text-blue-700' },
  payée: { label: 'Payée', className: 'bg-green-100 text-green-700' },
  en_retard: { label: 'En retard', className: 'bg-red-100 text-red-700' },
}

export default function StatusBadge({ statut }) {
  const config = statusConfig[statut] || { label: statut, className: 'bg-gray-100 text-gray-600' }

  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

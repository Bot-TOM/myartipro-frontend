/**
 * EmptyState — affichage vide harmonisé.
 *
 * Usage :
 *   <EmptyState
 *     icon={Users}
 *     title="Aucun client pour le moment"
 *     description="Vos clients apparaîtront ici"
 *     action={{ label: "Ajouter un client", onClick: openNew }}
 *   />
 *
 * Variante `compact` : pour les sections imbriquées dans une carte existante.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}) {
  if (compact) {
    return (
      <div className="p-8 text-center">
        {Icon && (
          <div className="inline-flex p-2 rounded-full bg-gray-100 text-gray-400 mb-2">
            <Icon size={18} />
          </div>
        )}
        <p className="text-sm text-gray-500">{title}</p>
        {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
        {action && (
          <button
            onClick={action.onClick}
            className="text-primary-600 hover:underline font-medium text-sm mt-3"
          >
            {action.label}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="text-center py-16 bg-white rounded-xl border">
      {Icon && (
        <div className="inline-flex p-3 rounded-full bg-primary-50 text-primary-600 mb-3">
          <Icon size={24} />
        </div>
      )}
      <p className="text-gray-700 font-medium mb-1">{title}</p>
      {description && <p className="text-sm text-gray-400 mb-4">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

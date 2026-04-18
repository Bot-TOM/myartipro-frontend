/**
 * Primitives de skeletons — animation pulse Tailwind.
 * Utiliser dans les états de chargement pour montrer la structure attendue.
 */

const base = 'animate-pulse bg-gray-200 rounded'

export function SkeletonLine({ className = '' }) {
  return <div className={`${base} h-3 ${className}`} />
}

export function SkeletonBlock({ className = '' }) {
  return <div className={`${base} ${className}`} />
}

/** Carte générique (liste clients, devis mobile, factures mobile) */
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 space-y-2">
          <SkeletonLine className="w-24" />
          <SkeletonLine className="w-40 h-4" />
          <SkeletonLine className="w-28" />
        </div>
        <SkeletonBlock className="w-16 h-5 rounded-full" />
      </div>
      <div className="flex items-center justify-between mt-3">
        <SkeletonLine className="w-20 h-4" />
        <div className="flex gap-1">
          <SkeletonBlock className="w-8 h-8 rounded-lg" />
          <SkeletonBlock className="w-8 h-8 rounded-lg" />
          <SkeletonBlock className="w-8 h-8 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

/** Liste de cartes — count contrôle le nombre */
export function SkeletonCardList({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

/** Ligne de tableau desktop (devis, factures) */
export function SkeletonTableRow({ cols = 7 }) {
  return (
    <tr className="border-b last:border-0">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <SkeletonLine className="w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  )
}

/** KPI / stat card (Dashboard) */
export function SkeletonStat({ className = '' }) {
  return (
    <div className={`bg-white rounded-xl border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <SkeletonLine className="w-20" />
        <SkeletonBlock className="w-8 h-8 rounded-lg" />
      </div>
      <SkeletonLine className="w-24 h-6" />
    </div>
  )
}

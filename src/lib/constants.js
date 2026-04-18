export const PRESTATIONS_TYPES = [
  'Main d\'œuvre',
  'Fourniture de matériel',
  'Déplacement',
  'Installation',
  'Réparation',
  'Entretien / Maintenance',
  'Diagnostic / Expertise',
  'Mise en conformité',
  'Dépose / Démontage',
  'Pose / Montage',
  'Autre',
]

export const CLIENT_STATUTS = [
  { value: 'nouveau', label: 'Nouveau', className: 'bg-blue-100 text-blue-700' },
  { value: 'a_rappeler', label: 'À rappeler', className: 'bg-orange-100 text-orange-700' },
  { value: 'rdv_prevu', label: 'RDV prévu', className: 'bg-purple-100 text-purple-700' },
  { value: 'devis_envoye', label: 'Devis envoyé', className: 'bg-cyan-100 text-cyan-700' },
  { value: 'relance', label: 'Relance', className: 'bg-amber-100 text-amber-700' },
  { value: 'accepte', label: 'Accepté', className: 'bg-green-100 text-green-700' },
  { value: 'refuse', label: 'Refusé', className: 'bg-red-100 text-red-700' },
]

export const getStatutConfig = (statut) =>
  CLIENT_STATUTS.find((s) => s.value === statut) || CLIENT_STATUTS[0]

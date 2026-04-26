const SEP = ';'

const HEADERS = [
  'Numéro', 'Client', 'Titre',
  'Date création', 'Date échéance', 'Date paiement',
  'Montant HT (€)', 'TVA (%)', 'Montant TTC (€)',
  'Statut', 'Mode paiement', 'Notes',
]

function cell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function rowToCsv(row) {
  return row.map(cell).join(SEP)
}

function clientName(client) {
  if (!client) return ''
  return `${client.prenom || ''} ${client.nom || ''}`.trim()
}

function isoDate(str) {
  return (str || '').slice(0, 10)
}

export function exportFacturesCsv(factures, mois, annee) {
  const mm = String(mois).padStart(2, '0')
  const debut = `${annee}-${mm}-01`
  const fin = mois === 12
    ? `${annee + 1}-01-01`
    : `${annee}-${String(mois + 1).padStart(2, '0')}-01`

  const filtered = factures.filter((f) => {
    const d = isoDate(f.date_creation)
    return d >= debut && d < fin
  })

  const totalHT  = filtered.reduce((s, f) => s + (f.montant_ht  || 0), 0)
  const totalTTC = filtered.reduce((s, f) => s + (f.montant_ttc || 0), 0)
  const nbPayees = filtered.filter((f) => f.statut === 'payée').length

  const dataRows = filtered.map((f) => [
    f.numero        || '',
    clientName(f.clients),
    f.titre         || '',
    isoDate(f.date_creation),
    isoDate(f.date_echeance),
    isoDate(f.date_paiement),
    (f.montant_ht  || 0).toFixed(2),
    f.tva           ?? '',
    (f.montant_ttc || 0).toFixed(2),
    f.statut        || '',
    f.mode_paiement || '',
    f.notes         || '',
  ])

  const totalLabel = `TOTAL — ${filtered.length} facture${filtered.length > 1 ? 's' : ''}, ${nbPayees} payée${nbPayees > 1 ? 's' : ''}`
  const totalRow = [totalLabel, '', '', '', '', '', totalHT.toFixed(2), '', totalTTC.toFixed(2), '', '', '']

  const lines = [
    rowToCsv(HEADERS),
    ...dataRows.map(rowToCsv),
    '',
    rowToCsv(totalRow),
  ]

  const csv = '\ufeff' + lines.join('\n')
  const filename = `factures_${annee}-${mm}.csv`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })

  const file = new File([blob], filename, { type: 'text/csv' })
  if (navigator.canShare?.({ files: [file] })) {
    navigator.share({ files: [file], title: filename }).catch((err) => {
      if (err.name !== 'AbortError') triggerDownload(blob, filename)
    })
    return { count: filtered.length, filename }
  }

  triggerDownload(blob, filename)
  return { count: filtered.length, filename }
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

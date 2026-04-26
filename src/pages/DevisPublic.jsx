import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { API_URL } from '../lib/api'

export default function DevisPublic() {
  const { token } = useParams()
  const [devis, setDevis] = useState(null)
  const [statut, setStatut] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // Signature state
  const [showSignature, setShowSignature] = useState(false)
  const [signedName, setSignedName] = useState('')
  const [hasAgreed, setHasAgreed] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)
  const [signing, setSigning] = useState(false)
  const [refusing, setRefusing] = useState(false)

  const canvasRef = useRef(null)
  const signatureRef = useRef(null)
  const isDrawingRef = useRef(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_URL}/devis/public/${token}`)
        setDevis(res.data)
        setStatut(res.data.statut)
        const c = res.data.clients || {}
        setSignedName(`${c.prenom || ''} ${c.nom || ''}`.trim())
      } catch {
        setError('Ce lien est invalide ou a expiré.')
      }
      setLoading(false)
    }
    load()
  }, [token])

  // Init canvas after DOM paint — useLayoutEffect garantit les dimensions correctes
  useLayoutEffect(() => {
    if (!showSignature) return
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    if (!w || !h) return
    canvas.width = w * dpr
    canvas.height = h * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.strokeStyle = '#1e3a8a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    setIsEmpty(true)
    // Scroll vers le formulaire de signature
    setTimeout(() => signatureRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }, [showSignature])

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const source = e.touches ? e.touches[0] : e
    return { x: source.clientX - rect.left, y: source.clientY - rect.top }
  }

  const startDraw = (e) => {
    e.preventDefault()
    isDrawingRef.current = true
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e) => {
    e.preventDefault()
    if (!isDrawingRef.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    if (isEmpty) setIsEmpty(false)
  }

  const endDraw = () => { isDrawingRef.current = false }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
  }

  const handleAccepter = async () => {
    const canvas = canvasRef.current
    if (!canvas || isEmpty || !signedName.trim() || !hasAgreed) return
    setSigning(true)
    try {
      await axios.post(`${API_URL}/devis/public/${token}/accepter`, {
        signature_data: canvas.toDataURL('image/png'),
        signed_name: signedName.trim(),
      })
      setStatut('accepté')
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Une erreur est survenue.')
      setSigning(false)
    }
  }

  const handleRefuser = async () => {
    setRefusing(true)
    try {
      await axios.post(`${API_URL}/devis/public/${token}/refuser`)
      setStatut('refusé')
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Une erreur est survenue.')
      setRefusing(false)
    }
  }

  const formatEur = (v) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v || 0)

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '-')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">Chargement...</p>
      </div>
    )
  }

  if (error && !devis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Lien invalide</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  const client = devis?.clients || {}
  const prestations = devis?.prestations || []
  const deja_traite = statut === 'accepté' || statut === 'refusé' || statut === 'facturé'
  const paiement = devis?.artisan_paiement || {}

  const MOYENS_LABELS = {
    especes: { label: 'Espèces', icon: '💵' },
    cheque: { label: 'Chèque', icon: '📄' },
    virement: { label: 'Virement bancaire', icon: '🏦' },
    sur_place: { label: 'Paiement sur place', icon: '📍' },
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto space-y-5">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-600">MyArtipro</h1>
          <p className="text-gray-500 text-sm mt-1">Votre devis en ligne</p>
        </div>

        {/* Statut après action */}
        {done && (
          <div className={`rounded-xl p-4 text-center font-semibold text-lg ${
            statut === 'accepté' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {statut === 'accepté' ? '✅ Vous avez accepté et signé ce devis.' : '❌ Vous avez refusé ce devis.'}
          </div>
        )}

        {/* Infos devis */}
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Devis</p>
              <p className="text-xl font-bold text-gray-900">{devis?.numero}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Date</p>
              <p className="text-sm text-gray-700">{formatDate(devis?.date_creation)}</p>
              {devis?.date_validite && (
                <>
                  <p className="text-xs text-gray-400 mt-1">Valide jusqu'au</p>
                  <p className="text-sm text-gray-700">{formatDate(devis?.date_validite)}</p>
                </>
              )}
            </div>
          </div>

          <div className="border-t pt-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Objet</p>
            <p className="text-gray-800 font-medium">{devis?.titre}</p>
          </div>

          {(client.nom || client.prenom) && (
            <div className="border-t pt-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Client</p>
              <p className="text-gray-800">{`${client.prenom || ''} ${client.nom || ''}`.trim()}</p>
              {client.adresse && <p className="text-sm text-gray-500">{client.adresse}</p>}
            </div>
          )}
        </div>

        {/* Prestations */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-4 py-3 bg-primary-600 text-white grid grid-cols-12 text-xs font-semibold">
            <span className="col-span-6">Description</span>
            <span className="col-span-2 text-right">Qté</span>
            <span className="col-span-4 text-right">Total HT</span>
          </div>
          {prestations.map((p, i) => (
            <div key={i} className={`px-4 py-3 grid grid-cols-12 text-sm ${i % 2 === 1 ? 'bg-gray-50' : ''}`}>
              <span className="col-span-6 text-gray-800">{p.description}</span>
              <span className="col-span-2 text-right text-gray-500">{p.quantite}</span>
              <span className="col-span-4 text-right text-gray-800">{formatEur(p.quantite * p.prix_unitaire)}</span>
            </div>
          ))}
        </div>

        {/* Totaux */}
        {(() => {
          const ht        = devis?.montant_ht   || 0
          const ttc       = devis?.montant_ttc  || 0
          const tva       = devis?.tva          || 0
          const acomptePct = devis?.acompte_pct || 0
          const montantTVA = ttc - ht
          const acompteTTC = acomptePct > 0 ? ttc * acomptePct / 100 : 0
          const soldeTTC   = acomptePct > 0 ? ttc - acompteTTC : 0
          const isFranchise = tva === 0

          return (
            <div className="bg-white rounded-xl border p-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total HT</span>
                <span>{formatEur(ht)}</span>
              </div>

              {isFranchise ? (
                <p className="text-xs text-amber-700 italic">TVA non applicable — franchise en base (art. 293 B CGI)</p>
              ) : (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>TVA ({tva}%)</span>
                  <span>{formatEur(montantTVA)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-lg text-primary-600 border-t pt-2">
                <span>Total {isFranchise ? 'HT' : 'TTC'}</span>
                <span>{formatEur(ttc)}</span>
              </div>

              {acomptePct > 0 && (
                <>
                  <div className="flex justify-between text-sm text-gray-600 border-t pt-2">
                    <span>Acompte à la commande ({acomptePct}%)</span>
                    <span className="font-semibold text-orange-600">{formatEur(acompteTTC)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-gray-800">
                    <span>Solde restant</span>
                    <span>{formatEur(soldeTTC)}</span>
                  </div>
                </>
              )}
            </div>
          )
        })()}

        {/* Notes */}
        {devis?.notes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-gray-700">
            <p className="font-semibold text-xs text-yellow-700 mb-1 uppercase">Notes</p>
            {devis.notes}
          </div>
        )}

        {/* Boutons d'action */}
        {!done && !deja_traite && (
          <div className="space-y-3 pt-2">
            {!showSignature ? (
              <>
                <p className="text-center text-sm text-gray-500">Donnez votre réponse :</p>
                <button
                  onClick={() => setShowSignature(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl text-lg transition"
                >
                  ✅ Accepter le devis
                </button>
                <button
                  onClick={handleRefuser}
                  disabled={refusing}
                  className="w-full bg-white border-2 border-red-300 hover:bg-red-50 text-red-600 font-semibold py-4 rounded-xl text-lg transition disabled:opacity-50"
                >
                  {refusing ? 'Envoi...' : '❌ Refuser le devis'}
                </button>
              </>
            ) : (
              <div ref={signatureRef} className="bg-white rounded-xl border p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Signature électronique</h3>
                  <button
                    onClick={() => { setShowSignature(false); setHasAgreed(false) }}
                    className="text-sm text-gray-400 hover:text-gray-600"
                  >
                    Annuler
                  </button>
                </div>

                {/* Canvas */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">Dessinez votre signature :</p>
                  <div className="relative rounded-lg border-2 border-gray-200 bg-gray-50" style={{ height: 140 }}>
                    <canvas
                      ref={canvasRef}
                      className="w-full h-full rounded-lg cursor-crosshair touch-none"
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={endDraw}
                      onMouseLeave={endDraw}
                      onTouchStart={startDraw}
                      onTouchMove={draw}
                      onTouchEnd={endDraw}
                    />
                    {isEmpty && (
                      <p className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm pointer-events-none select-none">
                        Signez ici avec votre doigt ou la souris
                      </p>
                    )}
                  </div>
                  <button
                    onClick={clearCanvas}
                    className="text-xs text-gray-400 hover:text-gray-600 mt-1.5 underline"
                  >
                    Effacer
                  </button>
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Nom et prénom</label>
                  <input
                    type="text"
                    value={signedName}
                    onChange={(e) => setSignedName(e.target.value)}
                    placeholder="Votre nom complet"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Consentement */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasAgreed}
                    onChange={(e) => setHasAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-green-600 flex-shrink-0"
                  />
                  <span className="text-sm text-gray-600 leading-snug">
                    J'ai lu et j'accepte ce devis. Je reconnais que cette signature électronique a la même valeur légale qu'une signature manuscrite.
                  </span>
                </label>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <button
                  onClick={handleAccepter}
                  disabled={!canvasRef.current || isEmpty || !signedName.trim() || !hasAgreed || signing}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl text-lg transition"
                >
                  {signing ? 'Envoi en cours...' : '✅ Signer et accepter'}
                </button>

                <p className="text-center text-xs text-gray-400">
                  Signature électronique simple conforme au règlement eIDAS (UE) n° 910/2014
                </p>
              </div>
            )}
          </div>
        )}

        {deja_traite && !done && (
          <div className={`rounded-xl p-4 text-center font-medium ${
            statut === 'accepté' || statut === 'facturé'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {statut === 'accepté' || statut === 'facturé'
              ? '✅ Ce devis a été accepté et signé.'
              : '❌ Ce devis a été refusé.'}
          </div>
        )}

        {/* Paiement */}
        {(paiement.stripe_enabled || (paiement.moyens_paiement && paiement.moyens_paiement.length > 0) || paiement.instructions_paiement) && (
          <div className="bg-white rounded-xl border p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Modalités de paiement</p>
            {paiement.stripe_enabled && (
              <button
                disabled
                className="flex items-center gap-2 bg-violet-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg opacity-60 cursor-not-allowed"
                title="Le paiement en ligne sera disponible sur la facture"
              >
                💳 Payer en ligne (disponible sur facture)
              </button>
            )}
            {paiement.moyens_paiement && paiement.moyens_paiement.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {paiement.moyens_paiement.map((m) => (
                  MOYENS_LABELS[m] && (
                    <span key={m} className="bg-gray-50 border border-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-full">
                      {MOYENS_LABELS[m].icon} {MOYENS_LABELS[m].label}
                    </span>
                  )
                ))}
              </div>
            )}
            {paiement.instructions_paiement && (
              <p className="text-sm text-gray-600 italic">{paiement.instructions_paiement}</p>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-4">
          Envoyé via MyArtipro
        </p>
      </div>
    </div>
  )
}

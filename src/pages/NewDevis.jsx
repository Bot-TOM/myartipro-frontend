import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useAuth from '../lib/useAuth'
import Layout from '../components/Layout'
import api from '../lib/api'
import { toastApiError } from '../lib/toastApiError'
import toast from 'react-hot-toast'
import useOnline from '../lib/useOnline'
import { enqueueRequest } from '../lib/offlineQueue'
import { Plus, Trash2, ArrowLeft, UserPlus, Check, Bookmark, X } from 'lucide-react'
import QuickClientModal from '../components/QuickClientModal'
import { PRESTATIONS_TYPES } from '../lib/constants'
import useProfil from '../lib/useProfil'
import ProfilIncompletBanner from '../components/ProfilIncompletBanner'

const STEPS = ['Client', 'Prestations', 'Résumé']
const AVATAR_COLORS = ['#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6']

const TITRE_SUGGESTIONS = [
  'Dépannage urgent',
  'Installation',
  'Réparation',
  'Entretien',
  'Mise en conformité',
  'Rénovation',
]

const formatEur = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)

export default function NewDevis() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [clients, setClients] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showNewClient, setShowNewClient] = useState(false)
  const [modeles, setModeles] = useState([])
  const online = useOnline()
  const { isComplete: profilComplet, missing: profilMissing, isFranchise } = useProfil()

  const [form, setForm] = useState({
    client_id: '',
    titre: '',
    tva: 20,
    acompte_pct: 0,
    notes: '',
    date_validite: '',
    urgence: 'normal',
    charge: '',
  })

  const [prestations, setPrestations] = useState([
    { description: '', quantite: 1, prix_unitaire: 0 },
  ])

  useEffect(() => {
    if (isFranchise) {
      setForm((prev) => ({ ...prev, tva: 0 }))
    } else if (form.tva === 0) {
      setForm((prev) => ({ ...prev, tva: 20 }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFranchise])

  useEffect(() => {
    if (!user) return
    supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('user_id', user.id)
      .order('nom')
      .then(({ data, error }) => {
        if (error) { toast.error('Erreur chargement clients'); return }
        setClients(data || [])
      })
    api.get('/modeles').then(({ data }) => setModeles(data || [])).catch(() => {})
  }, [user])

  const appliquerModele = (m) => {
    setForm((prev) => ({
      ...prev,
      titre: m.titre,
      tva: m.tva,
      acompte_pct: m.acompte_pct,
      notes: m.notes || '',
      urgence: m.urgence || 'normal',
      charge: m.charge || '',
    }))
    setPrestations(m.prestations.length > 0 ? m.prestations : [{ description: '', quantite: 1, prix_unitaire: 0 }])
    toast.success(`Modèle "${m.titre}" appliqué`)
  }

  const addPrestation = () => {
    setPrestations([...prestations, { description: '', quantite: 1, prix_unitaire: 0 }])
  }

  const removePrestation = (index) => {
    if (prestations.length === 1) return
    setPrestations(prestations.filter((_, i) => i !== index))
  }

  const updatePrestation = (index, field, value) => {
    setPrestations(prestations.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  const montantHT = prestations.reduce(
    (sum, p) => sum + (parseFloat(p.quantite) || 0) * (parseFloat(p.prix_unitaire) || 0), 0
  )
  const montantTVA = montantHT * (parseFloat(form.tva) || 0) / 100
  const montantTTC = montantHT + montantTVA

  const selectedClient = clients.find((c) => c.id === form.client_id)

  const handleSubmit = async () => {
    setError('')

    if (!profilComplet) {
      setError(`Profil incomplet : renseignez ${profilMissing.join(', ')} avant de créer un devis`)
      return
    }
    if (!form.client_id) { setError('Sélectionnez un client'); return }
    if (prestations.some((p) => !p.description || !p.prix_unitaire)) {
      setError('Remplissez toutes les prestations (description + prix)')
      return
    }

    setSaving(true)

    const payload = {
      client_id: form.client_id,
      titre: form.titre,
      prestations: prestations.map((p) => ({
        description: p.description,
        quantite: parseFloat(p.quantite) || 1,
        prix_unitaire: parseFloat(p.prix_unitaire) || 0,
      })),
      tva: form.tva === '' || form.tva === null || form.tva === undefined ? 20 : parseFloat(form.tva),
      acompte_pct: parseInt(form.acompte_pct) || 0,
      date_validite: form.date_validite || null,
      notes: form.notes || null,
      urgence: form.urgence || 'normal',
      charge: form.charge || null,
    }

    if (!online) {
      await enqueueRequest({ method: 'POST', url: '/devis', data: payload })
      toast.success('Devis sauvegardé hors-ligne — sera envoyé au retour du réseau')
      navigate('/devis')
      return
    }

    try {
      await api.post('/devis', payload)
      toast.success('Devis créé avec succès')
      navigate('/devis')
    } catch (err) {
      toastApiError(err, 'Erreur lors de la création')
      setSaving(false)
    }
  }

  const canContinueStep0 = form.client_id && form.titre.trim()
  const canContinueStep1 = prestations.length > 0 && prestations.every((p) => p.description && p.prix_unitaire)

  const handleNext = () => {
    if (step === 0 && !canContinueStep0) return
    if (step === 1 && !canContinueStep1) {
      setError('Remplissez toutes les prestations')
      return
    }
    setError('')
    if (step < 2) setStep((s) => s + 1)
    else handleSubmit()
  }

  return (
    <Layout>
      {/* Header wizard */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => step === 0 ? navigate('/devis') : setStep((s) => s - 1)}
          className="p-2 rounded-xl hover:bg-white transition text-slate-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-[18px] font-extrabold text-slate-900 tracking-tight">Nouveau devis</h1>
          <p className="text-[11px] text-slate-500">Étape {step + 1}/3 · {STEPS[step]}</p>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="flex gap-1.5 mb-5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-primary-600' : 'bg-slate-200'}`}
          />
        ))}
      </div>

      <ProfilIncompletBanner missing={profilMissing} />

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">{error}</div>
      )}

      {/* ─── Étape 0 : Client + Titre ─── */}
      {step === 0 && (
        <div className="space-y-4">

          {/* Modèles enregistrés */}
          {modeles.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Bookmark size={14} className="text-amber-500" />
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-[0.6px]">Partir d'un modèle</h2>
              </div>
              <div className="space-y-2">
                {modeles.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => appliquerModele(m)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                      <Bookmark size={14} className="text-amber-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{m.titre}</p>
                      <p className="text-xs text-slate-500">{m.prestations.length} prestation{m.prestations.length > 1 ? 's' : ''} · TVA {m.tva}%</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-[0.6px]">Client</h2>
              <button
                type="button"
                onClick={() => setShowNewClient(true)}
                className="flex items-center gap-1 text-primary-600 text-xs font-medium hover:text-primary-700"
              >
                <UserPlus size={14} /> Nouveau client
              </button>
            </div>

            {clients.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Aucun client — créez-en un d'abord</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {clients.map((c, i) => {
                  const isSelected = form.client_id === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setForm({ ...form, client_id: c.id })}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition ${isSelected ? 'bg-primary-50 border border-primary-200' : 'bg-slate-50 border border-transparent hover:bg-slate-100'}`}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                      >
                        {`${c.prenom?.[0] || ''}${c.nom?.[0] || ''}`.toUpperCase() || '?'}
                      </div>
                      <span className={`flex-1 text-left text-sm font-medium ${isSelected ? 'text-primary-700' : 'text-slate-800'}`}>
                        {c.prenom} {c.nom}
                      </span>
                      {isSelected && <Check size={16} className="text-primary-600 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-[0.6px] mb-3">Titre du devis</h2>
            <input
              type="text"
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
              placeholder="Ex : Réparation fuite cuisine"
              className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
            />
            <div className="flex flex-wrap gap-1.5 mt-3">
              {TITRE_SUGGESTIONS.filter((s) => s !== form.titre).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, titre: s })}
                  className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Étape 1 : Prestations ─── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-[0.6px]">Prestations</h2>
              <button
                type="button"
                onClick={addPrestation}
                className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                <Plus size={16} /> Ajouter
              </button>
            </div>

            {prestations.map((p, index) => (
              <div key={index} className="border border-slate-200 rounded-xl p-3 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Description *</label>
                    <input
                      type="text"
                      value={p.description}
                      onChange={(e) => updatePrestation(index, 'description', e.target.value)}
                      placeholder="Décrivez la prestation"
                      className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-base"
                    />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {PRESTATIONS_TYPES
                        .filter((t) => !prestations.some((pr) => pr.description === t))
                        .slice(0, 3)
                        .map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => updatePrestation(index, 'description', type)}
                            className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition"
                          >
                            {type}
                          </button>
                        ))}
                    </div>
                  </div>
                  {prestations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePrestation(index)}
                      className="p-2 text-slate-400 hover:text-red-500 mt-5"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Qté</label>
                    <input
                      type="number"
                      value={p.quantite}
                      onChange={(e) => updatePrestation(index, 'quantite', e.target.value)}
                      min="0.1"
                      step="0.1"
                      className="w-full px-2 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Prix HT</label>
                    <input
                      type="number"
                      value={p.prix_unitaire}
                      onChange={(e) => updatePrestation(index, 'prix_unitaire', e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-full px-2 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Total</label>
                    <div className="px-2 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium text-sm">
                      {formatEur((parseFloat(p.quantite) || 0) * (parseFloat(p.prix_unitaire) || 0))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TVA + options */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-[0.6px]">Options</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                {isFranchise ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-700 leading-snug">
                    TVA non applicable — franchise en base (art. 293 B CGI)
                  </div>
                ) : (
                  <>
                    <label className="block text-xs font-medium text-slate-600 mb-1">TVA (%)</label>
                    <select
                      value={form.tva}
                      onChange={(e) => setForm({ ...form, tva: e.target.value })}
                      className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-base"
                    >
                      <option value={20}>20% — Standard</option>
                      <option value={10}>10% — Rénovation</option>
                      <option value={5.5}>5,5% — Énergétique</option>
                    </select>
                    <div className="mt-2 text-xs text-slate-500 leading-snug">
                      {String(form.tva) === '10' && "Logement de plus de 2 ans (gros oeuvre, plomberie, électricité…)"}
                      {String(form.tva) === '5.5' && "Rénovation énergétique : isolation, pompe à chaleur, VMC, fenêtres…"}
                      {String(form.tva) === '20' && "Taux standard : neuf, travaux en local commercial, prestations diverses."}
                    </div>
                  </>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Acompte</label>
                <select
                  value={form.acompte_pct}
                  onChange={(e) => setForm({ ...form, acompte_pct: e.target.value })}
                  className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-base"
                >
                  <option value={0}>Aucun</option>
                  <option value={10}>10%</option>
                  <option value={20}>20%</option>
                  <option value={30}>30%</option>
                  <option value={40}>40%</option>
                  <option value={50}>50%</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Validité</label>
                <input
                  type="date"
                  value={form.date_validite}
                  onChange={(e) => setForm({ ...form, date_validite: e.target.value })}
                  className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-base"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Priorité</label>
                <select
                  value={form.urgence}
                  onChange={(e) => setForm({ ...form, urgence: e.target.value })}
                  className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-base"
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes / Conditions</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Conditions particulières, délais..."
                className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none text-base"
              />
            </div>
          </div>

          {/* Récap total */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-primary-600">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Total HT</span><span className="font-medium">{formatEur(montantHT)}</span>
              </div>
              {isFranchise ? (
                <div className="text-xs text-amber-600 italic">TVA non applicable (franchise)</div>
              ) : (
                <div className="flex justify-between text-sm text-slate-600">
                  <span>TVA ({form.tva}%)</span><span className="font-medium">{formatEur(montantTVA)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-100 pt-1.5">
                <span>Total {isFranchise ? 'HT' : 'TTC'}</span><span>{formatEur(montantTTC)}</span>
              </div>
              {parseInt(form.acompte_pct) > 0 && (
                <div className="flex justify-between text-sm text-slate-500 border-t border-slate-100 pt-1.5">
                  <span>Acompte ({form.acompte_pct}%)</span>
                  <span>{formatEur(montantTTC * parseInt(form.acompte_pct) / 100)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Étape 2 : Résumé ─── */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Carte client */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.6px] mb-3">Client</p>
            {selectedClient && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold"
                     style={{ background: AVATAR_COLORS[0] }}>
                  {`${selectedClient.prenom?.[0] || ''}${selectedClient.nom?.[0] || ''}`.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{selectedClient.prenom} {selectedClient.nom}</p>
                  <p className="text-sm text-slate-500">{form.titre}</p>
                </div>
              </div>
            )}
          </div>

          {/* Carte prestations */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.6px] mb-3">Prestations</p>
            <div className="space-y-2">
              {prestations.map((p, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-slate-700 flex-1 truncate">{p.description} × {p.quantite}</span>
                  <span className="font-medium text-slate-900 ml-2 flex-shrink-0">
                    {formatEur((parseFloat(p.quantite) || 0) * (parseFloat(p.prix_unitaire) || 0))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Carte total gradient */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'linear-gradient(135deg, #1B4ED8 0%, #2563EB 100%)' }}
          >
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-white/80">
                <span>Total HT</span><span>{formatEur(montantHT)}</span>
              </div>
              {!isFranchise && (
                <div className="flex justify-between text-sm text-white/80">
                  <span>TVA ({form.tva}%)</span><span>{formatEur(montantTVA)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-extrabold text-white border-t border-white/20 pt-2">
                <span>Total {isFranchise ? 'HT' : 'TTC'}</span><span>{formatEur(montantTTC)}</span>
              </div>
              {parseInt(form.acompte_pct) > 0 && (
                <div className="flex justify-between text-sm text-white/70 border-t border-white/20 pt-1.5">
                  <span>Acompte ({form.acompte_pct}%)</span>
                  <span>{formatEur(montantTTC * parseInt(form.acompte_pct) / 100)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div className="mt-6 mb-2">
        <button
          type="button"
          onClick={handleNext}
          disabled={(step === 0 && !canContinueStep0) || saving}
          className="w-full py-4 rounded-2xl bg-primary-600 text-white text-[15px] font-bold disabled:opacity-40 disabled:cursor-not-allowed transition hover:bg-primary-700"
        >
          {step < 2 ? 'Continuer →' : (saving ? 'Création...' : 'Créer le devis')}
        </button>
      </div>

      <QuickClientModal
        isOpen={showNewClient}
        onClose={() => setShowNewClient(false)}
        userId={user?.id}
        onClientCreated={(newClient) => {
          setClients((prev) => [...prev, newClient])
          setForm((prev) => ({ ...prev, client_id: newClient.id }))
        }}
      />
    </Layout>
  )
}

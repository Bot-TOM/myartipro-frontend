import { useEffect, useState } from 'react'
import useAuth from '../lib/useAuth'
import Layout from '../components/Layout'
import api from '../lib/api'
import { toastApiError } from '../lib/toastApiError'
import toast from 'react-hot-toast'
import {
  User, Building2, Phone, MapPin, CreditCard, Save, ImagePlus,
  Trash2, Wallet, ToggleLeft, ToggleRight, Receipt, Bell, BellOff,
  MessageSquare, Download, ShieldAlert,
} from 'lucide-react'
import usePushNotifications from '../lib/usePushNotifications'
import { supabase } from '../lib/supabase'

const MOYENS = [
  { value: 'especes',   label: 'Espèces',           icon: '💵' },
  { value: 'cheque',    label: 'Chèque',             icon: '📄' },
  { value: 'virement',  label: 'Virement bancaire',  icon: '🏦' },
  { value: 'sur_place', label: 'Paiement sur place', icon: '📍' },
]
const MOYENS_LABELS = Object.fromEntries(MOYENS.map((m) => [m.value, m.label]))

/** Classes réutilisables */
const inputCls  = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm transition'
const inputIconCls = 'w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm transition'

/** Carte de section avec titre + icône */
function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
      <h2 className="flex items-center gap-2.5 text-base font-semibold text-slate-900">
        <span className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
          <Icon size={15} className="text-primary-600" />
        </span>
        {title}
      </h2>
      {children}
    </div>
  )
}

export default function Profil() {
  const { user } = useAuth()
  const {
    supported: pushSupported,
    subscribed: pushSubscribed,
    subscribe: pushSubscribe,
    unsubscribe: pushUnsubscribe,
  } = usePushNotifications()

  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [uploading,    setUploading]    = useState(false)
  const [testingPush,  setTestingPush]  = useState(false)
  const [testingSms,   setTestingSms]   = useState(false)
  const [exporting,    setExporting]    = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting,     setDeleting]     = useState(false)

  const [form, setForm] = useState({
    nom: '', prenom: '', entreprise: '', siret: '', telephone: '', adresse: '',
    logo_url: '', stripe_enabled: false, moyens_paiement: [],
    instructions_paiement: '', regime_tva: 'franchise', numero_tva: '',
    sms_notifications: false,
  })

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const { data: p } = await api.get('/auth/me')
        setForm({
          nom:                    p.nom                    || '',
          prenom:                 p.prenom                 || '',
          entreprise:             p.entreprise             || '',
          siret:                  p.siret                  || '',
          telephone:              p.telephone              || '',
          adresse:                p.adresse                || '',
          logo_url:               p.logo_url               || '',
          stripe_enabled:         p.stripe_enabled         || false,
          moyens_paiement:        p.moyens_paiement        || [],
          instructions_paiement:  p.instructions_paiement  || '',
          regime_tva:             p.regime_tva             || 'franchise',
          numero_tva:             p.numero_tva             || '',
          sms_notifications:      p.sms_notifications      || false,
        })
      } catch (err) {
        toastApiError(err, 'Erreur chargement du profil')
      }
      setLoading(false)
    }
    load()
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.siret && !/^\d{14}$/.test(form.siret)) {
      toast.error('Le SIRET doit contenir exactement 14 chiffres')
      return
    }
    setSaving(true)
    try {
      await api.put('/auth/me', form)
      toast.success('Profil mis à jour')
    } catch (err) {
      toastApiError(err, 'Erreur lors de la mise à jour')
    }
    setSaving(false)
  }

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }))

  const toggleMoyen = (value) =>
    setForm((p) => ({
      ...p,
      moyens_paiement: p.moyens_paiement.includes(value)
        ? p.moyens_paiement.filter((m) => m !== value)
        : [...p.moyens_paiement, value],
    }))

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Le fichier doit être une image (PNG, JPG)'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Le logo ne doit pas dépasser 2 Mo'); return }
    setUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `logos/${user.id}.${ext}`
    const { error: upErr } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
    if (upErr) { toast.error('Erreur upload : ' + upErr.message); setUploading(false); return }
    const { data } = supabase.storage.from('logos').getPublicUrl(path)
    setForm((p) => ({ ...p, logo_url: data.publicUrl }))
    toast.success('Logo uploadé !')
    setUploading(false)
  }

  const handleLogoDelete = async () => {
    const ext = form.logo_url.split('.').pop()?.split('?')[0]
    await supabase.storage.from('logos').remove([`logos/${user.id}.${ext}`])
    setForm((p) => ({ ...p, logo_url: '' }))
    toast.success('Logo supprimé')
  }

  const handleExportData = async () => {
    setExporting(true)
    try {
      const { data } = await api.get('/auth/me/export')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `myartipro_export_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 10000)
      toast.success('Export téléchargé')
    } catch {
      toast.error("Erreur lors de l'export")
    }
    setExporting(false)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'SUPPRIMER') return
    setDeleting(true)
    try {
      await api.delete('/auth/me')
      await import('../lib/supabase').then(({ supabase: s }) => s.auth.signOut())
      window.location.href = '/login'
    } catch {
      toast.error('Erreur lors de la suppression du compte')
      setDeleting(false)
    }
  }

  const handleTestSms = async () => {
    setTestingSms(true)
    try {
      const { data } = await api.post('/push/test-sms')
      if (data.ok) toast.success('SMS envoyé !'); else toast.error(data.error || 'Erreur test SMS')
    } catch { toast.error('Erreur lors du test SMS') }
    setTestingSms(false)
  }

  const handleTestPush = async () => {
    setTestingPush(true)
    try {
      const { data } = await api.post('/push/test')
      if (data.ok) toast.success('Notification envoyée !'); else toast.error(data.error || 'Erreur test push')
    } catch { toast.error('Erreur lors du test de notification') }
    setTestingPush(false)
  }

  if (loading) {
    return (
      <Layout>
        <div className="space-y-4 max-w-2xl">
          {[120, 180, 80, 200].map((h, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm animate-pulse" style={{ height: h }} />
          ))}
        </div>
      </Layout>
    )
  }

  const initiales = `${form.prenom?.[0] ?? ''}${form.nom?.[0] ?? ''}`.toUpperCase() || '?'

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-7">
        <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center shrink-0">
          <span className="text-white text-xl font-extrabold tracking-tight">{initiales}</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">
            {form.prenom || form.nom ? `${form.prenom} ${form.nom}`.trim() : 'Mon profil'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {form.entreprise || 'Ces informations apparaissent sur vos devis et factures'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">

        {/* ── Identité ── */}
        <Section icon={User} title="Identité">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Prénom *</label>
              <input type="text" value={form.prenom} onChange={set('prenom')} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Nom *</label>
              <input type="text" value={form.nom} onChange={set('nom')} required className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Téléphone</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input type="tel" value={form.telephone} onChange={set('telephone')} placeholder="06 12 34 56 78" className={inputIconCls} />
            </div>
          </div>
        </Section>

        {/* ── Entreprise ── */}
        <Section icon={Building2} title="Entreprise">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Nom de l'entreprise</label>
            <input type="text" value={form.entreprise} onChange={set('entreprise')} placeholder="Ex : Dupont Services" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">SIRET</label>
            <div className="relative">
              <CreditCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text" value={form.siret} onChange={set('siret')}
                placeholder="12345678901234" maxLength={14}
                className={`${inputIconCls} font-mono`}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">14 chiffres — visible sur vos devis et factures</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Adresse professionnelle</label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <textarea value={form.adresse} onChange={set('adresse')} rows={2}
                placeholder="12 rue de la Paix, 75001 Paris"
                className={`${inputIconCls} resize-none`} />
            </div>
          </div>
        </Section>

        {/* ── Logo ── */}
        <Section icon={ImagePlus} title="Logo">
          <p className="text-xs text-slate-500 -mt-1">Apparaît en haut de vos PDF — PNG ou JPG, max 2 Mo</p>
          {form.logo_url ? (
            <div className="flex items-center gap-4">
              <div className="border border-slate-200 rounded-xl p-2 bg-slate-50">
                <img src={form.logo_url} alt="Logo" className="h-14 w-auto object-contain" />
              </div>
              <button type="button" onClick={handleLogoDelete}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium transition">
                <Trash2 size={14} /> Supprimer
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-2xl p-8 cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition group">
              <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-primary-100 flex items-center justify-center transition">
                <ImagePlus size={20} className="text-slate-400 group-hover:text-primary-600 transition" />
              </div>
              <span className="text-sm text-slate-500 group-hover:text-primary-700 font-medium transition">
                {uploading ? 'Upload en cours…' : 'Cliquez pour ajouter votre logo'}
              </span>
              <input type="file" accept="image/png,image/jpeg" onChange={handleLogoUpload} disabled={uploading} className="hidden" />
            </label>
          )}
        </Section>

        {/* ── Paiements ── */}
        <Section icon={Wallet} title="Paiements">

          {/* Stripe toggle */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Paiement en ligne</p>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, stripe_enabled: !p.stripe_enabled }))}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition text-sm font-medium ${
                form.stripe_enabled
                  ? 'border-violet-200 bg-violet-50 text-violet-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              {form.stripe_enabled
                ? <ToggleRight size={22} className="text-violet-600 shrink-0" />
                : <ToggleLeft  size={22} className="text-slate-400 shrink-0" />}
              <span>Stripe — {form.stripe_enabled ? 'activé' : 'désactivé'}</span>
              {form.stripe_enabled && (
                <span className="ml-auto text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-semibold">Actif</span>
              )}
            </button>
            <p className="text-xs text-slate-400 mt-1.5">Permet à vos clients de payer leurs factures en ligne par carte.</p>
          </div>

          {/* Moyens manuels */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Moyens acceptés</p>
            <div className="grid grid-cols-2 gap-2">
              {MOYENS.map((m) => {
                const checked = form.moyens_paiement.includes(m.value)
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => toggleMoyen(m.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition ${
                      checked
                        ? 'border-primary-300 bg-primary-50 text-primary-700 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span className="flex-1 text-left">{m.label}</span>
                    {checked && <span className="text-primary-500 text-xs">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Message au client <span className="font-normal normal-case text-slate-400">(optionnel)</span>
            </label>
            <textarea
              value={form.instructions_paiement}
              onChange={set('instructions_paiement')}
              rows={3}
              placeholder="Ex : Pour un virement, contactez-moi après validation du devis."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Aperçu */}
          {(form.stripe_enabled || form.moyens_paiement.length > 0 || form.instructions_paiement) && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Aperçu côté client</p>
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <p className="text-sm font-semibold text-slate-700">Modalités de paiement</p>
                {form.stripe_enabled && (
                  <div className="inline-flex items-center gap-2 bg-violet-600 text-white text-sm font-semibold px-4 py-2 rounded-xl">
                    💳 Payer en ligne
                  </div>
                )}
                {form.moyens_paiement.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.moyens_paiement.map((m) => (
                      <span key={m} className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-full font-medium">
                        {MOYENS.find((x) => x.value === m)?.icon} {MOYENS_LABELS[m]}
                      </span>
                    ))}
                  </div>
                )}
                {form.instructions_paiement && (
                  <p className="text-sm text-slate-600 italic">{form.instructions_paiement}</p>
                )}
              </div>
            </div>
          )}
        </Section>

        {/* ── Régime TVA ── */}
        <Section icon={Receipt} title="Régime TVA">
          {/* Seuils */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 space-y-1.5">
            <p className="font-semibold">Seuils 2025 — franchise en base</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <span>Prestations de services</span><span className="font-bold">37 500 €/an</span>
              <span>Vente de marchandises</span><span className="font-bold">85 000 €/an</span>
            </div>
            <p className="text-amber-700 mt-1">Au-dessus de ces seuils, le passage au régime réel est obligatoire.</p>
          </div>

          {/* Radios */}
          <div className="space-y-2">
            {[
              {
                value: 'franchise',
                title: 'Franchise en base (art. 293 B CGI)',
                desc: 'Pas de TVA sur vos factures. La mention « TVA non applicable » est ajoutée automatiquement sur vos PDF.',
              },
              {
                value: 'reel',
                title: 'Régime réel d\'imposition',
                desc: 'Vous collectez la TVA et la reversez. Taux : 20% standard, 10% rénovation, 5,5% énergétique.',
              },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  form.regime_tva === opt.value
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="regime_tva"
                  value={opt.value}
                  checked={form.regime_tva === opt.value}
                  onChange={() => setForm((p) => ({ ...p, regime_tva: opt.value }))}
                  className="mt-0.5 accent-primary-600"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{opt.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {form.regime_tva === 'reel' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                N° TVA intracommunautaire <span className="text-red-500">*</span>
              </label>
              <input
                type="text" value={form.numero_tva} onChange={set('numero_tva')}
                placeholder="FR 12 345678901"
                className={inputCls}
              />
              <p className="text-xs text-slate-400 mt-1">
                Obligatoire sur toutes vos factures en régime réel (art. 242 nonies A ann. II CGI).
              </p>
            </div>
          )}
        </Section>

        {/* ── Notifications ── */}
        <Section icon={Bell} title="Notifications">

          {/* Push */}
          {pushSupported && (
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${pushSubscribed ? 'bg-primary-50' : 'bg-slate-100'}`}>
                {pushSubscribed
                  ? <Bell    size={16} className="text-primary-600" />
                  : <BellOff size={16} className="text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">Notifications push</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {pushSubscribed ? 'Activées sur cet appareil.' : 'Désactivées sur cet appareil.'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {pushSubscribed && (
                  <button type="button" onClick={handleTestPush} disabled={testingPush}
                    className="text-xs text-primary-600 font-semibold px-2 py-1 rounded-lg hover:bg-primary-50 transition disabled:opacity-50">
                    {testingPush ? '…' : 'Tester'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    if (pushSubscribed) {
                      await pushUnsubscribe()
                    } else {
                      const { ok, error } = await pushSubscribe()
                      if (!ok) toast.error(error || 'Échec activation notifications')
                    }
                  }}
                  className={`text-sm font-semibold px-3.5 py-1.5 rounded-xl transition ${
                    pushSubscribed
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {pushSubscribed ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            </div>
          )}

          {/* SMS */}
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <MessageSquare size={16} className="text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">SMS</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {form.telephone
                  ? "Recevez un SMS lors d'un devis accepté ou d'un paiement reçu."
                  : 'Renseignez votre téléphone (section Identité) pour activer les SMS.'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {form.sms_notifications && form.telephone && (
                <button type="button" onClick={handleTestSms} disabled={testingSms}
                  className="text-xs text-green-600 font-semibold px-2 py-1 rounded-lg hover:bg-green-50 transition disabled:opacity-50">
                  {testingSms ? '…' : 'Tester'}
                </button>
              )}
              <button
                type="button"
                disabled={!form.telephone}
                onClick={() => setForm((p) => ({ ...p, sms_notifications: !p.sms_notifications }))}
                className={`text-sm font-semibold px-3.5 py-1.5 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed ${
                  form.sms_notifications
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {form.sms_notifications ? 'Désactiver' : 'Activer'}
              </button>
            </div>
          </div>

          {form.sms_notifications && form.telephone && (
            <p className="text-xs text-green-700 bg-green-50 rounded-xl px-3 py-2.5">
              SMS activés sur le {form.telephone}. Pensez à enregistrer.
            </p>
          )}
        </Section>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700">
          Ces informations sont utilisées sur vos devis et factures PDF.
          Renseignez le nom d'entreprise et le SIRET pour des documents conformes.
        </div>

        {/* Bouton enregistrer */}
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3.5 rounded-2xl text-sm font-bold transition disabled:opacity-50 shadow-sm"
        >
          <Save size={18} />
          {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>
      </form>

      {/* ── Données & compte — hors formulaire ── */}
      <div className="space-y-4 max-w-2xl mt-5">

        {/* Export RGPD */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
              <Download size={14} className="text-slate-500" />
            </span>
            <h2 className="text-base font-semibold text-slate-900">Mes données</h2>
          </div>
          <p className="text-xs text-slate-500 mb-3 ml-9.5">
            Téléchargez l'ensemble de vos données (RGPD — droit à la portabilité, art. 20).
          </p>
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="text-sm font-semibold text-primary-600 border border-primary-200 bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-xl transition disabled:opacity-50"
          >
            {exporting ? 'Export en cours…' : 'Exporter mes données (JSON)'}
          </button>
        </div>

        {/* Suppression compte */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-red-100">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
              <ShieldAlert size={14} className="text-red-500" />
            </span>
            <h2 className="text-base font-semibold text-red-700">Supprimer mon compte</h2>
          </div>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            Action irréversible. Toutes vos données seront supprimées, sauf les factures émises/payées
            conservées 10 ans (art. L123-22 C.com).
          </p>
          <p className="text-xs font-semibold text-slate-600 mb-2">
            Tapez <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded-lg">SUPPRIMER</span> pour confirmer :
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="SUPPRIMER"
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-300 font-mono bg-slate-50 focus:bg-white"
            />
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'SUPPRIMER' || deleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {deleting ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

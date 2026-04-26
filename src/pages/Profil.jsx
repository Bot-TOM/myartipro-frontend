import { useEffect, useState } from 'react'
import useAuth from '../lib/useAuth'
import Layout from '../components/Layout'
import api from '../lib/api'
import { toastApiError } from '../lib/toastApiError'
import toast from 'react-hot-toast'
import { User, Building2, Phone, MapPin, CreditCard, Save, ImagePlus, Trash2, Wallet, ToggleLeft, ToggleRight, Receipt, Bell, BellOff, MessageSquare, Download, ShieldAlert } from 'lucide-react'
import usePushNotifications from '../lib/usePushNotifications'
import { supabase } from '../lib/supabase'

const MOYENS = [
  { value: 'especes', label: 'Espèces', icon: '💵' },
  { value: 'cheque', label: 'Chèque', icon: '📄' },
  { value: 'virement', label: 'Virement bancaire', icon: '🏦' },
  { value: 'sur_place', label: 'Paiement sur place', icon: '📍' },
]

const MOYENS_LABELS = Object.fromEntries(MOYENS.map((m) => [m.value, m.label]))

export default function Profil() {
  const { user } = useAuth()
  const { supported: pushSupported, subscribed: pushSubscribed, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePushNotifications()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [testingPush, setTestingPush] = useState(false)
  const [testingSms, setTestingSms] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    entreprise: '',
    siret: '',
    telephone: '',
    adresse: '',
    logo_url: '',
    stripe_enabled: false,
    moyens_paiement: [],
    instructions_paiement: '',
    regime_tva: 'franchise',
    numero_tva: '',
    sms_notifications: false,
  })

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const res = await api.get('/auth/me')
        const p = res.data
        setForm({
          nom: p.nom || '',
          prenom: p.prenom || '',
          entreprise: p.entreprise || '',
          siret: p.siret || '',
          telephone: p.telephone || '',
          adresse: p.adresse || '',
          logo_url: p.logo_url || '',
          stripe_enabled: p.stripe_enabled || false,
          moyens_paiement: p.moyens_paiement || [],
          instructions_paiement: p.instructions_paiement || '',
          regime_tva: p.regime_tva || 'franchise',
          numero_tva: p.numero_tva || '',
          sms_notifications: p.sms_notifications || false,
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

  const updateField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const toggleMoyen = (value) => {
    setForm((prev) => ({
      ...prev,
      moyens_paiement: prev.moyens_paiement.includes(value)
        ? prev.moyens_paiement.filter((m) => m !== value)
        : [...prev.moyens_paiement, value],
    }))
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Le fichier doit être une image (PNG, JPG)')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Le logo ne doit pas dépasser 2 Mo')
      return
    }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `logos/${user.id}.${ext}`
    const { error: upErr } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
    if (upErr) {
      toast.error('Erreur upload : ' + upErr.message)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('logos').getPublicUrl(path)
    setForm((prev) => ({ ...prev, logo_url: data.publicUrl }))
    toast.success('Logo uploadé !')
    setUploading(false)
  }

  const handleLogoDelete = async () => {
    const ext = form.logo_url.split('.').pop()?.split('?')[0]
    await supabase.storage.from('logos').remove([`logos/${user.id}.${ext}`])
    setForm((prev) => ({ ...prev, logo_url: '' }))
    toast.success('Logo supprimé')
  }

  const handleExportData = async () => {
    setExporting(true)
    try {
      const { data } = await api.get('/auth/me/export')
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `myartipro_export_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 10000)
      toast.success('Export téléchargé')
    } catch {
      toast.error('Erreur lors de l\'export')
    }
    setExporting(false)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'SUPPRIMER') return
    setDeleting(true)
    try {
      await api.delete('/auth/me')
      await import('../lib/supabase').then(({ supabase }) => supabase.auth.signOut())
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
      if (data.ok) toast.success('SMS envoyé !')
      else toast.error(data.error || 'Erreur lors du test SMS')
    } catch {
      toast.error('Erreur lors du test SMS')
    }
    setTestingSms(false)
  }

  const handleTestPush = async () => {
    setTestingPush(true)
    try {
      const { data } = await api.post('/push/test')
      if (data.ok) toast.success('Notification envoyée !')
      else toast.error(data.error || 'Erreur lors du test')
    } catch {
      toast.error('Erreur lors du test de notification')
    }
    setTestingPush(false)
  }

  if (loading) {
    return <Layout><p className="text-gray-400">Chargement...</p></Layout>
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Mon profil</h1>
      <p className="text-gray-500 mb-6">Ces informations apparaissent sur vos devis et factures</p>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

        {/* Identité */}
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User size={18} className="text-primary-600" /> Identité
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
              <input
                type="text"
                value={form.prenom}
                onChange={updateField('prenom')}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input
                type="text"
                value={form.nom}
                onChange={updateField('nom')}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={form.telephone}
                onChange={updateField('telephone')}
                placeholder="06 12 34 56 78"
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
              />
            </div>
          </div>
        </div>

        {/* Entreprise */}
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 size={18} className="text-primary-600" /> Entreprise
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise</label>
            <input
              type="text"
              value={form.entreprise}
              onChange={updateField('entreprise')}
              placeholder="Ex : Dupont Services"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
            <div className="relative">
              <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={form.siret}
                onChange={updateField('siret')}
                placeholder="12345678901234"
                maxLength={14}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base font-mono"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">14 chiffres — visible sur vos devis et factures</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse professionnelle</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
              <textarea
                value={form.adresse}
                onChange={updateField('adresse')}
                rows={2}
                placeholder="12 rue de la Paix, 75001 Paris"
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base resize-none"
              />
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ImagePlus size={18} className="text-primary-600" /> Logo
          </h2>
          <p className="text-sm text-gray-500">Apparaît en haut de vos devis et factures PDF (PNG ou JPG, max 2 Mo)</p>
          {form.logo_url ? (
            <div className="flex items-center gap-4">
              <img src={form.logo_url} alt="Logo" className="h-16 w-auto object-contain rounded border p-1" />
              <button
                type="button"
                onClick={handleLogoDelete}
                className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm transition"
              >
                <Trash2 size={14} /> Supprimer
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-primary-400 hover:bg-gray-50 transition">
              <ImagePlus size={20} className="text-gray-400" />
              <span className="text-sm text-gray-500">
                {uploading ? 'Upload en cours...' : 'Cliquez pour ajouter votre logo'}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleLogoUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Paiements */}
        <div className="bg-white rounded-xl border p-5 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Wallet size={18} className="text-primary-600" /> Paiements
          </h2>

          {/* Stripe */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Paiement en ligne</p>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, stripe_enabled: !prev.stripe_enabled }))}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg border transition text-sm font-medium ${
                form.stripe_enabled
                  ? 'border-violet-300 bg-violet-50 text-violet-700'
                  : 'border-gray-300 bg-gray-50 text-gray-600'
              }`}
            >
              {form.stripe_enabled
                ? <ToggleRight size={22} className="text-violet-600 shrink-0" />
                : <ToggleLeft size={22} className="text-gray-400 shrink-0" />}
              <span>
                Stripe — {form.stripe_enabled ? 'activé' : 'désactivé'}
              </span>
              {form.stripe_enabled && (
                <span className="ml-auto text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">Actif</span>
              )}
            </button>
            <p className="text-xs text-gray-400 mt-1.5">
              Permet à vos clients de payer leurs factures en ligne par carte bancaire.
            </p>
          </div>

          {/* Moyens manuels */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Moyens de paiement acceptés</p>
            <div className="grid grid-cols-2 gap-2">
              {MOYENS.map((m) => {
                const checked = form.moyens_paiement.includes(m.value)
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => toggleMoyen(m.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition ${
                      checked
                        ? 'border-primary-400 bg-primary-50 text-primary-700 font-medium'
                        : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                    {checked && <span className="ml-auto text-primary-500">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message au client <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <textarea
              value={form.instructions_paiement}
              onChange={updateField('instructions_paiement')}
              rows={3}
              placeholder="Ex : Pour un virement ou un chèque, contactez-moi après validation du devis."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none text-sm"
            />
          </div>

          {/* Aperçu client */}
          {(form.stripe_enabled || form.moyens_paiement.length > 0 || form.instructions_paiement) && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Aperçu côté client</p>
              <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
                <p className="text-sm font-semibold text-gray-700">Modalités de paiement</p>
                {form.stripe_enabled && (
                  <div className="inline-flex items-center gap-2 bg-violet-600 text-white text-sm font-medium px-4 py-2 rounded-lg">
                    💳 Payer en ligne
                  </div>
                )}
                {form.moyens_paiement.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.moyens_paiement.map((m) => (
                      <span key={m} className="bg-white border border-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-full">
                        {MOYENS.find((x) => x.value === m)?.icon} {MOYENS_LABELS[m]}
                      </span>
                    ))}
                  </div>
                )}
                {form.instructions_paiement && (
                  <p className="text-sm text-gray-600 italic">{form.instructions_paiement}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Régime TVA */}
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Receipt size={18} className="text-primary-600" /> Régime TVA
          </h2>

          {/* Seuils franchise */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
            <p className="font-semibold">Seuils 2025 — franchise en base</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1">
              <span>Prestations de services</span><span className="font-bold">37 500 €/an</span>
              <span>Vente de marchandises</span><span className="font-bold">85 000 €/an</span>
            </div>
            <p className="mt-1.5 text-amber-700">
              En dessous de ces seuils vous pouvez rester en franchise. Au-dessus, le passage au régime réel est obligatoire.
            </p>
          </div>

          <div className="space-y-2">
            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
              form.regime_tva === 'franchise'
                ? 'border-primary-400 bg-primary-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}>
              <input
                type="radio"
                name="regime_tva"
                value="franchise"
                checked={form.regime_tva === 'franchise'}
                onChange={() => setForm((prev) => ({ ...prev, regime_tva: 'franchise' }))}
                className="mt-0.5 accent-primary-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-800">Franchise en base (art. 293 B CGI)</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Pas de TVA sur vos factures. La mention "TVA non applicable" est ajoutée automatiquement sur vos PDF.
                  Régime habituel des micro-entrepreneurs sous le seuil de franchise.
                </p>
              </div>
            </label>
            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
              form.regime_tva === 'reel'
                ? 'border-primary-400 bg-primary-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}>
              <input
                type="radio"
                name="regime_tva"
                value="reel"
                checked={form.regime_tva === 'reel'}
                onChange={() => setForm((prev) => ({ ...prev, regime_tva: 'reel' }))}
                className="mt-0.5 accent-primary-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-800">Régime réel d'imposition</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Vous collectez la TVA et la reversez à l'administration. Trois taux selon la nature des travaux :
                </p>
                <ul className="text-xs text-gray-500 mt-1.5 space-y-0.5 pl-2">
                  <li><span className="font-semibold text-gray-700">20%</span> — Taux standard (neuf, commerce, divers)</li>
                  <li><span className="font-semibold text-gray-700">10%</span> — Rénovation d'un logement de plus de 2 ans</li>
                  <li><span className="font-semibold text-gray-700">5,5%</span> — Travaux de rénovation énergétique (isolation, pompe à chaleur, VMC…)</li>
                </ul>
              </div>
            </label>
          </div>

          {/* Numéro TVA intracommunautaire — obligatoire en régime réel */}
          {form.regime_tva === 'reel' && (
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro TVA intracommunautaire <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.numero_tva}
                onChange={updateField('numero_tva')}
                placeholder="FR 12 345678901"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Obligatoire sur toutes vos factures en régime réel (art. 242 nonies A ann. II CGI). Fourni par l'administration fiscale lors du passage au réel.
              </p>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bell size={18} className="text-primary-600" /> Notifications
          </h2>

          {/* Push */}
          {pushSupported && (
            <div className="flex items-center gap-4 py-2 border-b border-gray-100">
              <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                {pushSubscribed ? <Bell size={16} className="text-primary-600" /> : <BellOff size={16} className="text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">Notifications push</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {pushSubscribed ? 'Activées sur cet appareil.' : 'Désactivées sur cet appareil.'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {pushSubscribed && (
                  <button
                    type="button"
                    onClick={handleTestPush}
                    disabled={testingPush}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium px-2 py-1 rounded transition disabled:opacity-50"
                  >
                    {testingPush ? '...' : 'Tester'}
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
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg transition ${pushSubscribed ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
                >
                  {pushSubscribed ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            </div>
          )}

          {/* SMS */}
          <div className="flex items-center gap-4 py-2">
            <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
              <MessageSquare size={16} className="text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">SMS</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {form.telephone
                  ? 'Recevez un SMS lors d\'un devis accepté ou d\'un paiement reçu.'
                  : 'Renseignez votre téléphone (section Identité) pour activer les SMS.'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {form.sms_notifications && form.telephone && (
                <button
                  type="button"
                  onClick={handleTestSms}
                  disabled={testingSms}
                  className="text-xs text-green-600 hover:text-green-700 font-medium px-2 py-1 rounded transition disabled:opacity-50"
                >
                  {testingSms ? '...' : 'Tester'}
                </button>
              )}
              <button
                type="button"
                disabled={!form.telephone}
                onClick={() => setForm((prev) => ({ ...prev, sms_notifications: !prev.sms_notifications }))}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed ${
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
            <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
              SMS activés sur le {form.telephone}. Pensez à enregistrer.
            </p>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          Ces informations seront utilisées automatiquement sur vos devis et factures PDF.
          Pensez à bien renseigner le nom d'entreprise et le SIRET pour des documents conformes.
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </form>

      {/* Données & compte — hors formulaire */}
      <div className="space-y-4 max-w-2xl mt-6">

        {/* Export RGPD */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-1">
            <Download size={16} className="text-slate-500" /> Mes données
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Téléchargez l'ensemble de vos données (RGPD — droit à la portabilité, art. 20).
          </p>
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="text-sm font-medium text-primary-600 border border-primary-200 bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {exporting ? 'Export en cours...' : 'Exporter mes données (JSON)'}
          </button>
        </div>

        {/* Suppression de compte */}
        <div className="bg-white rounded-xl border border-red-200 p-5">
          <h2 className="text-base font-semibold text-red-700 flex items-center gap-2 mb-1">
            <ShieldAlert size={16} /> Supprimer mon compte
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Action irréversible. Toutes vos données seront supprimées, sauf les factures émises/payées
            conservées 10 ans conformément à l'art. L123-22 du Code de commerce.
          </p>
          <p className="text-xs text-slate-600 mb-2 font-medium">
            Tapez <span className="font-mono bg-slate-100 px-1 rounded">SUPPRIMER</span> pour confirmer :
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="SUPPRIMER"
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-300 font-mono"
            />
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'SUPPRIMER' || deleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {deleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

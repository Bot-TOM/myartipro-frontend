import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuth from '../lib/useAuth'
import api from '../lib/api'
import { downloadPdf } from '../lib/downloadPdf'
import { toastApiError } from '../lib/toastApiError'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import { SkeletonCardList, SkeletonTableRow } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import ProfilIncompletBanner from '../components/ProfilIncompletBanner'
import useProfil from '../lib/useProfil'
import toast from 'react-hot-toast'
import { Plus, Send, Download, Trash2, Pencil, FileCheck, Clock, AlertTriangle, Zap, FileText, Copy, Bookmark } from 'lucide-react'

export default function Devis() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [devisList, setDevisList] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('tous')
  const [confirmEnvoi, setConfirmEnvoi] = useState(null) // id du devis en attente de confirmation
  const { isComplete: profilComplet, missing: profilMissing } = useProfil()

  // Se relance à chaque fois qu'on revient sur cette page (location.key change)
  useEffect(() => {
    if (user) {
      setFilter('tous')
      loadDevis()
    }
  }, [user, location.key])

  const loadDevis = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/devis')
      setDevisList(data || [])
    } catch (err) {
      toastApiError(err, 'Erreur lors du chargement des devis')
    }
    setLoading(false)
  }

  const handleEnvoyer = async (devisId) => {
    if (!profilComplet) {
      toast.error(`Profil incomplet : ${profilMissing.join(', ')}`)
      return
    }
    if (confirmEnvoi !== devisId) {
      // Premier clic : demande confirmation
      setConfirmEnvoi(devisId)
      setTimeout(() => setConfirmEnvoi(null), 4000) // annule au bout de 4s
      return
    }
    // Deuxième clic : envoie
    setConfirmEnvoi(null)
    try {
      await api.post(`/devis/${devisId}/envoyer`)
      toast.success('Devis envoyé par email !')
      loadDevis()
    } catch (err) {
      toastApiError(err, "Erreur lors de l'envoi")
    }
  }

  const handleDownloadPDF = (devisId, numero) =>
    downloadPdf(`/pdf/devis/${devisId}`, `${numero || 'devis'}.pdf`)

  const handleDelete = async (devisId) => {
    if (!window.confirm('Supprimer ce devis ?')) return
    try {
      await api.delete(`/devis/${devisId}`)
      toast.success('Devis supprimé')
      loadDevis()
    } catch (err) {
      toastApiError(err, 'Erreur lors de la suppression')
    }
  }

  const handleDupliquer = async (devisId) => {
    try {
      await api.post(`/devis/${devisId}/dupliquer`)
      toast.success('Devis dupliqué — brouillon créé')
      loadDevis()
    } catch (err) {
      toastApiError(err, 'Erreur lors de la duplication')
    }
  }

  const handleSauvegarderModele = async (d) => {
    try {
      await api.post('/modeles', {
        titre: d.titre,
        prestations: d.prestations,
        tva: d.tva,
        acompte_pct: d.acompte_pct || 0,
        notes: d.notes || null,
        urgence: d.urgence || 'normal',
        charge: d.charge || null,
      })
      toast.success('Modèle enregistré — disponible lors du prochain devis')
    } catch (err) {
      toastApiError(err, "Erreur lors de l'enregistrement du modèle")
    }
  }

  const handleConvertir = async (devisId) => {
    if (!profilComplet) {
      toast.error(`Profil incomplet : ${profilMissing.join(', ')}`)
      return
    }
    if (!window.confirm('Convertir ce devis en facture ?')) return
    try {
      await api.post(`/factures/depuis-devis/${devisId}`)
      toast.success('Facture créée avec succès')
      loadDevis()
    } catch (err) {
      toastApiError(err, 'Erreur lors de la conversion')
    }
  }

  const filtered = filter === 'tous'
    ? devisList
    : devisList.filter((d) => d.statut === filter)

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('fr-FR')
  }

  const formatEur = (montant) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant || 0)

  // Urgence effective : si envoyé depuis +3 jours sans réponse → urgent auto
  const getUrgenceEffective = (d) => {
    if (d.urgence === 'urgent') return 'urgent'
    if (d.statut === 'envoyé' && d.date_envoi) {
      const jours = Math.floor((Date.now() - new Date(d.date_envoi).getTime()) / 86400000)
      if (jours >= 3) return 'urgent'
    }
    return d.urgence || 'normal'
  }

  const urgenceConfig = {
    urgent: { label: 'Urgent', icon: Zap, className: 'bg-red-100 text-red-700' },
    important: { label: 'Important', icon: AlertTriangle, className: 'bg-amber-100 text-amber-700' },
    normal: { label: 'Normal', icon: null, className: '' },
  }

  const chargeConfig = {
    rapide: { label: 'Rapide', className: 'bg-emerald-50 text-emerald-600' },
    moyen: { label: 'Moyen', className: 'bg-sky-50 text-sky-600' },
    long: { label: 'Long', className: 'bg-purple-50 text-purple-600' },
  }

  const UrgenceBadge = ({ devis }) => {
    const urg = getUrgenceEffective(devis)
    const cfg = urgenceConfig[urg]
    if (!cfg || urg === 'normal') return null
    const Icon = cfg.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
        {Icon && <Icon size={12} />} {cfg.label}
      </span>
    )
  }

  const ChargeBadge = ({ charge }) => {
    if (!charge) return null
    const cfg = chargeConfig[charge]
    if (!cfg) return null
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
        <Clock size={11} /> {cfg.label}
      </span>
    )
  }

  const filters = [
    { value: 'tous', label: 'Tous' },
    { value: 'brouillon', label: 'Brouillons' },
    { value: 'envoyé', label: 'Envoyés' },
    { value: 'consulté', label: 'Consultés' },
    { value: 'accepté', label: 'Acceptés' },
    { value: 'refusé', label: 'Refusés' },
    { value: 'facturé', label: 'Facturés' },
    { value: 'relancé', label: 'Relancés' },
  ]

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Devis</h1>
          <p className="text-gray-500 mt-1">{devisList.length} devis</p>
        </div>
        <Link
          to="/devis/nouveau"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nouveau devis</span>
          <span className="sm:hidden">Créer</span>
        </Link>
      </div>

      <ProfilIncompletBanner missing={profilMissing} />

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              filter === f.value
                ? 'bg-primary-600 text-white'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <>
          <div className="md:hidden">
            <SkeletonCardList count={4} />
          </div>
          <div className="hidden md:block bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonTableRow key={i} cols={8} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={filter === 'tous' ? 'Aucun devis' : 'Aucun devis avec ce filtre'}
          description={filter === 'tous' ? 'Créez votre premier devis pour démarrer' : 'Essayez un autre filtre'}
          action={filter === 'tous' ? { label: 'Créer un devis', onClick: () => navigate('/devis/nouveau') } : undefined}
        />
      ) : (
        <>
          {/* Vue mobile : cartes */}
          <div className="space-y-3 md:hidden">
            {filtered.map((d) => (
              <div key={d.id} className="bg-white rounded-xl border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-mono text-sm text-gray-500">{d.numero}</p>
                    <p className="font-semibold text-gray-900">{d.titre}</p>
                    <p className="text-sm text-gray-500">
                      {d.clients ? `${d.clients.prenom || ''} ${d.clients.nom}`.trim() : '-'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge statut={d.statut} />
                    <UrgenceBadge devis={d} />
                  </div>
                </div>
                {d.charge && (
                  <div className="mb-1">
                    <ChargeBadge charge={d.charge} />
                  </div>
                )}
                <div className="flex items-center justify-between mt-3">
                  <p className="font-bold text-gray-900">{formatEur(d.montant_ttc)}</p>
                  <div className="flex gap-1">
                    {d.statut === 'brouillon' && (
                      <button onClick={() => navigate(`/devis/${d.id}/modifier`)} className="p-2 text-gray-400 hover:text-primary-600 rounded-lg" title="Modifier">
                        <Pencil size={18} />
                      </button>
                    )}
                    <button onClick={() => handleDownloadPDF(d.id, d.numero)} className="p-2 text-gray-400 hover:text-primary-600 rounded-lg" title="PDF">
                      <Download size={18} />
                    </button>
                    <button onClick={() => handleDupliquer(d.id)} className="p-2 text-gray-400 hover:text-primary-600 rounded-lg" title="Dupliquer">
                      <Copy size={18} />
                    </button>
                    <button onClick={() => handleSauvegarderModele(d)} className="p-2 text-gray-400 hover:text-amber-600 rounded-lg" title="Sauvegarder comme modèle">
                      <Bookmark size={18} />
                    </button>
                    {d.statut === 'brouillon' && (
                      <button
                        onClick={() => handleEnvoyer(d.id)}
                        disabled={!d.clients?.email}
                        className={`p-2 rounded-lg transition text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed ${
                          confirmEnvoi === d.id
                            ? 'bg-blue-600 text-white px-3'
                            : 'text-gray-400 hover:text-blue-600'
                        }`}
                        title={d.clients?.email ? 'Envoyer' : 'Client sans email'}
                      >
                        {confirmEnvoi === d.id ? 'Confirmer ?' : <Send size={18} />}
                      </button>
                    )}
                    {(['envoyé', 'consulté', 'accepté', 'relancé'].includes(d.statut)) && (
                      <button onClick={() => handleConvertir(d.id)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg" title="Convertir en facture">
                        <FileCheck size={18} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(d.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg" title="Supprimer">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400 mt-2">
                  <span>Créé {formatDate(d.date_creation)}</span>
                  {d.date_envoi && <span>Envoyé {formatDate(d.date_envoi)}</span>}
                  {d.date_relance && <span>Relancé {formatDate(d.date_relance)}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Vue desktop : tableau */}
          <div className="hidden md:block bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Numéro</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Titre</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Montant TTC</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Suivi</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Historique</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm font-mono text-gray-900">{d.numero}</td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {d.clients ? `${d.clients.prenom || ''} ${d.clients.nom}`.trim() : '-'}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">{d.titre}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">{formatEur(d.montant_ttc)}</td>
                    <td className="px-5 py-4"><StatusBadge statut={d.statut} /></td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        <UrgenceBadge devis={d} />
                        <ChargeBadge charge={d.charge} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col text-xs text-gray-400 gap-0.5">
                        <span>Créé {formatDate(d.date_creation)}</span>
                        {d.date_envoi && <span>Envoyé {formatDate(d.date_envoi)}</span>}
                        {d.date_relance && <span>Relancé {formatDate(d.date_relance)}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {d.statut === 'brouillon' && (
                          <button onClick={() => navigate(`/devis/${d.id}/modifier`)} title="Modifier" className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition">
                            <Pencil size={16} />
                          </button>
                        )}
                        <button onClick={() => handleDownloadPDF(d.id, d.numero)} title="PDF" className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition">
                          <Download size={16} />
                        </button>
                        <button onClick={() => handleDupliquer(d.id)} title="Dupliquer" className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition">
                          <Copy size={16} />
                        </button>
                        <button onClick={() => handleSauvegarderModele(d)} title="Sauvegarder comme modèle" className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition">
                          <Bookmark size={16} />
                        </button>
                        {d.statut === 'brouillon' && (
                          <button
                            onClick={() => handleEnvoyer(d.id)}
                            disabled={!d.clients?.email}
                            title={d.clients?.email ? 'Envoyer' : 'Client sans email'}
                            className={`p-1.5 rounded-lg transition text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed ${
                              confirmEnvoi === d.id
                                ? 'bg-blue-600 text-white px-3'
                                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            {confirmEnvoi === d.id ? 'Confirmer ?' : <Send size={16} />}
                          </button>
                        )}
                        {(['envoyé', 'consulté', 'accepté', 'relancé'].includes(d.statut)) && (
                          <button onClick={() => handleConvertir(d.id)} title="Convertir en facture" className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition">
                            <FileCheck size={16} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(d.id)} title="Supprimer" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Layout>
  )
}

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

/** Couleur de la bordure gauche selon le statut */
const statusAccent = {
  brouillon: 'border-l-slate-300',
  envoyé:    'border-l-blue-400',
  consulté:  'border-l-violet-500',
  relancé:   'border-l-indigo-500',
  accepté:   'border-l-green-500',
  refusé:    'border-l-red-400',
  facturé:   'border-l-emerald-500',
}

export default function Devis() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [devisList, setDevisList] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('tous')
  const [confirmEnvoi, setConfirmEnvoi] = useState(null)
  const { isComplete: profilComplet, missing: profilMissing } = useProfil()

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
      setConfirmEnvoi(devisId)
      setTimeout(() => setConfirmEnvoi(null), 4000)
      return
    }
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
        titre: d.titre, prestations: d.prestations, tva: d.tva,
        acompte_pct: d.acompte_pct || 0, notes: d.notes || null,
        urgence: d.urgence || 'normal', charge: d.charge || null,
      })
      toast.success('Modèle enregistré')
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

  const filtered = filter === 'tous' ? devisList : devisList.filter((d) => d.statut === filter)

  const formatDate = (s) => s ? new Date(s).toLocaleDateString('fr-FR') : '—'
  const formatEur = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)

  const getUrgenceEffective = (d) => {
    if (d.urgence === 'urgent') return 'urgent'
    if (d.statut === 'envoyé' && d.date_envoi) {
      if (Math.floor((Date.now() - new Date(d.date_envoi).getTime()) / 86400000) >= 3) return 'urgent'
    }
    return d.urgence || 'normal'
  }

  const urgenceConfig = {
    urgent:    { label: 'Urgent',    icon: Zap,           className: 'bg-red-100 text-red-700' },
    important: { label: 'Important', icon: AlertTriangle, className: 'bg-amber-100 text-amber-700' },
    normal:    null,
  }

  const chargeConfig = {
    rapide: { label: 'Rapide', className: 'bg-emerald-50 text-emerald-600' },
    moyen:  { label: 'Moyen',  className: 'bg-sky-50 text-sky-600' },
    long:   { label: 'Long',   className: 'bg-purple-50 text-purple-600' },
  }

  const UrgenceBadge = ({ devis }) => {
    const urg = getUrgenceEffective(devis)
    const cfg = urgenceConfig[urg]
    if (!cfg) return null
    const Icon = cfg.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
        {Icon && <Icon size={12} />} {cfg.label}
      </span>
    )
  }

  const ChargeBadge = ({ charge }) => {
    const cfg = chargeConfig[charge]
    if (!cfg) return null
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
        <Clock size={11} /> {cfg.label}
      </span>
    )
  }

  const filters = [
    { value: 'tous',      label: 'Tous' },
    { value: 'brouillon', label: 'Brouillons' },
    { value: 'envoyé',    label: 'Envoyés' },
    { value: 'consulté',  label: 'Consultés' },
    { value: 'accepté',   label: 'Acceptés' },
    { value: 'refusé',    label: 'Refusés' },
    { value: 'facturé',   label: 'Facturés' },
    { value: 'relancé',   label: 'Relancés' },
  ]

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Devis</h1>
          <p className="text-slate-500 mt-0.5 text-sm">{devisList.length} devis</p>
        </div>
        <Link
          to="/devis/nouveau"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nouveau devis</span>
          <span className="sm:hidden">Créer</span>
        </Link>
      </div>

      <ProfilIncompletBanner missing={profilMissing} />

      {/* Filtres pills */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-0.5 -mx-1 px-1">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              filter === f.value
                ? 'bg-primary-600 text-white shadow-sm scale-105'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <>
          <div className="md:hidden"><SkeletonCardList count={4} /></div>
          <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={8} />)}</tbody>
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
          {/* Vue mobile : cartes avec accent coloré */}
          <div className="space-y-3 md:hidden">
            {filtered.map((d) => {
              const accent = statusAccent[d.statut] || 'border-l-slate-200'
              return (
                <div key={d.id} className={`bg-white rounded-2xl shadow-sm border-l-4 ${accent} pl-4 pr-4 py-4 cursor-pointer`} onClick={() => navigate(`/devis/${d.id}`)}>
                  {/* Ligne 1 : numéro + statut */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs text-slate-400">{d.numero}</span>
                    <div className="flex items-center gap-1.5">
                      <UrgenceBadge devis={d} />
                      <StatusBadge statut={d.statut} />
                    </div>
                  </div>

                  {/* Ligne 2 : titre + client */}
                  <p className="font-semibold text-slate-900 leading-snug">{d.titre}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {d.clients ? `${d.clients.prenom || ''} ${d.clients.nom}`.trim() : '—'}
                  </p>

                  {d.charge && <div className="mt-1.5"><ChargeBadge charge={d.charge} /></div>}

                  {/* Ligne 3 : montant + actions */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                    <p className="text-lg font-extrabold text-slate-900">{formatEur(d.montant_ttc)}</p>
                    <div className="flex gap-0.5">
                      {d.statut === 'brouillon' && (
                        <IconBtn onClick={() => navigate(`/devis/${d.id}/modifier`)} title="Modifier" hover="hover:text-primary-600">
                          <Pencil size={17} />
                        </IconBtn>
                      )}
                      <IconBtn onClick={() => handleDownloadPDF(d.id, d.numero)} title="PDF" hover="hover:text-primary-600">
                        <Download size={17} />
                      </IconBtn>
                      <IconBtn onClick={() => handleDupliquer(d.id)} title="Dupliquer" hover="hover:text-primary-600">
                        <Copy size={17} />
                      </IconBtn>
                      <IconBtn onClick={() => handleSauvegarderModele(d)} title="Modèle" hover="hover:text-amber-500">
                        <Bookmark size={17} />
                      </IconBtn>
                      {d.statut === 'brouillon' && (
                        <button
                          onClick={() => handleEnvoyer(d.id)}
                          disabled={!d.clients?.email}
                          className={`p-2 rounded-xl transition text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed ${
                            confirmEnvoi === d.id
                              ? 'bg-blue-600 text-white px-3'
                              : 'text-slate-400 hover:text-blue-600'
                          }`}
                          title={d.clients?.email ? 'Envoyer' : 'Client sans email'}
                        >
                          {confirmEnvoi === d.id ? 'Confirmer ?' : <Send size={17} />}
                        </button>
                      )}
                      {['envoyé', 'consulté', 'accepté', 'relancé'].includes(d.statut) && (
                        <IconBtn onClick={() => handleConvertir(d.id)} title="Convertir en facture" hover="hover:text-green-600">
                          <FileCheck size={17} />
                        </IconBtn>
                      )}
                      <IconBtn onClick={() => handleDelete(d.id)} title="Supprimer" hover="hover:text-red-600">
                        <Trash2 size={17} />
                      </IconBtn>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex gap-3 text-xs text-slate-400 mt-2">
                    <span>Créé {formatDate(d.date_creation)}</span>
                    {d.date_envoi && <span>Envoyé {formatDate(d.date_envoi)}</span>}
                    {d.date_relance && <span>Relancé {formatDate(d.date_relance)}</span>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Vue desktop : tableau */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Numéro', 'Client', 'Titre', 'Montant TTC', 'Statut', 'Suivi', 'Historique', ''].map((h, i) => (
                    <th key={h} className={`px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide ${i === 7 ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                    <td className="px-5 py-4 text-sm font-mono text-slate-600">{d.numero}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {d.clients ? `${d.clients.prenom || ''} ${d.clients.nom}`.trim() : '—'}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-800">{d.titre}</td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-900">{formatEur(d.montant_ttc)}</td>
                    <td className="px-5 py-4"><StatusBadge statut={d.statut} /></td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        <UrgenceBadge devis={d} />
                        <ChargeBadge charge={d.charge} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col text-xs text-slate-400 gap-0.5">
                        <span>Créé {formatDate(d.date_creation)}</span>
                        {d.date_envoi && <span>Envoyé {formatDate(d.date_envoi)}</span>}
                        {d.date_relance && <span>Relancé {formatDate(d.date_relance)}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-0.5">
                        {d.statut === 'brouillon' && (
                          <IconBtn onClick={() => navigate(`/devis/${d.id}/modifier`)} title="Modifier" hover="hover:text-primary-600 hover:bg-primary-50">
                            <Pencil size={16} />
                          </IconBtn>
                        )}
                        <IconBtn onClick={() => handleDownloadPDF(d.id, d.numero)} title="PDF" hover="hover:text-primary-600 hover:bg-primary-50">
                          <Download size={16} />
                        </IconBtn>
                        <IconBtn onClick={() => handleDupliquer(d.id)} title="Dupliquer" hover="hover:text-primary-600 hover:bg-primary-50">
                          <Copy size={16} />
                        </IconBtn>
                        <IconBtn onClick={() => handleSauvegarderModele(d)} title="Modèle" hover="hover:text-amber-600 hover:bg-amber-50">
                          <Bookmark size={16} />
                        </IconBtn>
                        {d.statut === 'brouillon' && (
                          <button
                            onClick={() => handleEnvoyer(d.id)}
                            disabled={!d.clients?.email}
                            title={d.clients?.email ? 'Envoyer' : 'Client sans email'}
                            className={`p-1.5 rounded-xl transition text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed ${
                              confirmEnvoi === d.id
                                ? 'bg-blue-600 text-white px-3'
                                : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            {confirmEnvoi === d.id ? 'Confirmer ?' : <Send size={16} />}
                          </button>
                        )}
                        {['envoyé', 'consulté', 'accepté', 'relancé'].includes(d.statut) && (
                          <IconBtn onClick={() => handleConvertir(d.id)} title="Convertir en facture" hover="hover:text-green-600 hover:bg-green-50">
                            <FileCheck size={16} />
                          </IconBtn>
                        )}
                        <IconBtn onClick={() => handleDelete(d.id)} title="Supprimer" hover="hover:text-red-600 hover:bg-red-50">
                          <Trash2 size={16} />
                        </IconBtn>
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

function IconBtn({ onClick, title, hover, children }) {
  return (
    <button onClick={onClick} title={title} className={`p-2 rounded-xl transition text-slate-400 ${hover}`}>
      {children}
    </button>
  )
}

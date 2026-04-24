import { Link } from 'react-router-dom'
import { ArrowLeft, Printer, CheckCircle } from 'lucide-react'
import { LEGAL } from '../lib/legal'

const { editeur, rgpd } = LEGAL

const CRITERES = [
  {
    titre: '1. Inaltérabilité',
    base: "Art. 286 I-3°bis CGI — les données enregistrées ne peuvent être modifiées ou supprimées.",
    points: [
      "Les factures émises reçoivent un numéro séquentiel définitif (ex : FAC-2026-001) qui ne peut être réattribué.",
      "Toute suppression de facture émise ou payée est remplacée par un soft-delete horodaté (champ deleted_at) — la donnée est conservée, non effacée.",
      "Aucune route API ne permet la modification du montant, du numéro ou du client d'une facture après émission.",
      "La base de données (Supabase / PostgreSQL) est protégée par Row Level Security — un utilisateur ne peut accéder qu'à ses propres données.",
    ],
  },
  {
    titre: '2. Sécurisation',
    base: "Les transactions sont sécurisées et leur intégrité vérifiable.",
    points: [
      "Toutes les communications sont chiffrées en TLS 1.2+ (HTTPS).",
      "L'authentification repose sur des tokens JWT signés par Supabase Auth (RS256).",
      "Chaque requête API est authentifiée et vérifiée côté serveur avant tout accès aux données.",
      "Les secrets (clés API, mots de passe) ne sont jamais exposés côté client ni stockés en clair.",
      "Stripe gère les paiements — aucun numéro de carte n'est traité ou stocké par MyArtipro.",
    ],
  },
  {
    titre: '3. Conservation',
    base: "Art. L123-22 Code de commerce — conservation 10 ans minimum.",
    points: [
      "Les factures sont conservées pour une durée minimale de 10 ans à compter de leur date d'émission.",
      "La suppression d'un compte utilisateur n'entraîne pas la suppression des factures (soft-delete maintenu).",
      "Les données sont hébergées sur Supabase (Union européenne), avec sauvegardes automatiques quotidiennes.",
      "L'utilisateur peut exporter l'ensemble de ses factures à tout moment au format CSV ou PDF.",
    ],
  },
  {
    titre: '4. Archivage',
    base: "Les données archivées restent accessibles, lisibles et exportables.",
    points: [
      "Les factures archivées (soft-delete) restent visibles par l'éditeur du logiciel à des fins de contrôle.",
      "Le format de stockage (JSON/PostgreSQL) est un standard ouvert, lisible sans logiciel propriétaire.",
      "Un export PDF individuel et un export CSV mensuel sont disponibles à tout moment.",
      "Les métadonnées (date de création, date de paiement, statut) sont conservées avec chaque facture.",
    ],
  },
]

export default function Conformite() {
  return (
    <div className="min-h-screen bg-[#EFF2F8]">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Nav */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm transition"
          >
            <ArrowLeft size={15} />
            Retour
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 text-sm text-white bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-xl transition font-medium print:hidden"
          >
            <Printer size={15} />
            Imprimer / Sauvegarder PDF
          </button>
        </div>

        {/* En-tête document */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-4">
          <div className="border-b border-slate-100 pb-5 mb-5">
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">
              Attestation officielle
            </p>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Conformité — Loi anti-fraude TVA
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Art. 286 I-3°bis du Code général des impôts — Loi n°2015-1785 du 29 décembre 2015
            </p>
          </div>

          {/* Identification éditeur */}
          <div className="grid sm:grid-cols-2 gap-4 text-sm mb-6">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Éditeur du logiciel</p>
              <p className="font-semibold text-slate-900">{editeur.raisonSociale}</p>
              <p className="text-slate-600">{editeur.responsable}</p>
              <p className="text-slate-600">{editeur.adresse}</p>
              <p className="text-slate-600">SIRET : {editeur.siret}</p>
              <p className="text-slate-600">{editeur.email}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Logiciel concerné</p>
              <p className="font-semibold text-slate-900">MyArtipro</p>
              <p className="text-slate-600">Version 1.0 — avril 2026</p>
              <p className="text-slate-600">myartipro.fr</p>
              <p className="text-slate-600">Logiciel SaaS de facturation pour artisans</p>
              <p className="text-slate-600">Utilisateurs : micro-entrepreneurs français</p>
            </div>
          </div>

          {/* Déclaration */}
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-sm text-primary-900">
            <p className="font-semibold mb-1">Déclaration de l'éditeur</p>
            <p className="leading-relaxed">
              Je soussigné <strong>{editeur.responsable}</strong>, en qualité d'éditeur du logiciel{' '}
              <strong>MyArtipro</strong>, atteste que ce logiciel satisfait aux conditions
              d'inaltérabilité, de sécurisation, de conservation et d'archivage prévues au{' '}
              <strong>3° bis du I de l'article 286 du Code général des impôts</strong>, dans sa
              version en vigueur depuis le 1er janvier 2018.
            </p>
          </div>
        </div>

        {/* Les 4 critères */}
        <div className="space-y-4 mb-4">
          {CRITERES.map((c) => (
            <div key={c.titre} className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-base font-bold text-slate-900 mb-1">{c.titre}</h2>
              <p className="text-xs text-slate-500 italic mb-3">{c.base}</p>
              <ul className="space-y-2">
                {c.points.map((p, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Signature */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Signature de l'éditeur</h2>
          <div className="grid sm:grid-cols-2 gap-6 text-sm text-slate-700">
            <div className="space-y-1">
              <p><span className="text-slate-400">Fait à</span> {editeur.adresse}</p>
              <p><span className="text-slate-400">Le</span> avril 2026</p>
              <p><span className="text-slate-400">Par</span> {editeur.responsable}</p>
              <p><span className="text-slate-400">En qualité de</span> Éditeur — {editeur.raisonSociale}</p>
            </div>
            <div className="border border-slate-200 rounded-xl h-24 flex items-end p-3">
              <p className="text-xs text-slate-400">Signature manuscrite (pour impression)</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 space-y-1">
            <p>
              Cette attestation est établie conformément à l'article 88 de la loi de finances
              pour 2016 (n°2015-1785) et au BOFiP BOI-TVA-DECLA-30-10-30.
            </p>
            <p>
              Contact RGPD et conformité :{' '}
              <a href={`mailto:${rgpd.emailContact}`} className="text-primary-600 hover:underline">
                {rgpd.emailContact}
              </a>
            </p>
          </div>
        </div>

        {/* Footer liens légaux */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-400 print:hidden">
          <Link to="/mentions-legales" className="hover:text-primary-600 transition">Mentions légales</Link>
          <Link to="/politique-confidentialite" className="hover:text-primary-600 transition">Politique de confidentialité</Link>
          <Link to="/conditions-utilisation" className="hover:text-primary-600 transition">CGU</Link>
        </div>
      </div>
    </div>
  )
}

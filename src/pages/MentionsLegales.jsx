import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { LEGAL } from '../lib/legal'

export default function MentionsLegales() {
  const { editeur, hebergement, rgpd, miseAJour } = LEGAL

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-8 transition">
          <ArrowLeft size={16} />
          Retour
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mentions légales</h1>
        <p className="text-gray-400 text-sm mb-8">Dernière mise à jour : {miseAJour}</p>

        <div className="bg-white rounded-xl border p-6 sm:p-8 space-y-8 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Éditeur du site</h2>
            <p>
              <strong>{editeur.raisonSociale}</strong><br />
              {editeur.responsable}<br />
              {editeur.adresse}<br />
              SIRET : {editeur.siret}<br />
              Email : <a href={`mailto:${editeur.email}`} className="text-primary-600 hover:underline">{editeur.email}</a><br />
              Téléphone : {editeur.telephone}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Hébergement</h2>
            <p className="mb-2">Le service repose sur les prestataires suivants :</p>
            <ul className="list-disc pl-5 space-y-2">
              {hebergement.map((h) => (
                <li key={h.nom}>
                  <strong>{h.nom}</strong> — {h.role}<br />
                  <span className="text-gray-500">{h.adresse}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Protection des données personnelles (RGPD)</h2>
            <p>
              MyArtipro collecte et traite des données personnelles dans le cadre de son activité :
              noms, emails, téléphones et adresses de vos clients, ainsi que vos informations
              professionnelles (SIRET, entreprise).
            </p>
            <p className="mt-2">
              Ces données sont stockées de manière sécurisée sur les serveurs de Supabase
              (Union européenne) et ne sont accessibles qu'à vous, l'utilisateur authentifié.
            </p>
            <p className="mt-2">
              Conformément au RGPD (articles 15 à 22), vous disposez d'un droit d'accès,
              de rectification, d'effacement, de limitation et de portabilité de vos données.
              Pour exercer ces droits, contactez-nous à{' '}
              <a href={`mailto:${rgpd.emailContact}`} className="text-primary-600 hover:underline">
                {rgpd.emailContact}
              </a>.
            </p>
            <p className="mt-2">
              Les factures émises sont conservées 10 ans conformément à l'article L123-22 du
              Code de commerce, même après demande de suppression du compte.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Cookies</h2>
            <p>
              MyArtipro utilise uniquement des cookies techniques nécessaires au fonctionnement
              de l'application (session d'authentification). Aucun cookie publicitaire ou de tracking
              n'est utilisé.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Propriété intellectuelle</h2>
            <p>
              L'ensemble du contenu de ce site (textes, images, interface, code source) est
              la propriété de l'éditeur. Toute reproduction non autorisée est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Responsabilité</h2>
            <p>
              MyArtipro est un outil d'aide à la gestion. Les devis et factures générés par
              l'application sont sous la responsabilité de l'utilisateur. MyArtipro ne peut être
              tenu responsable d'erreurs dans les documents générés.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

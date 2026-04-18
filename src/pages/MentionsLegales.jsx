import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-8 transition">
          <ArrowLeft size={16} />
          Retour
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mentions légales</h1>
        <p className="text-gray-400 text-sm mb-8">Dernière mise à jour : avril 2026</p>

        <div className="bg-white rounded-xl border p-6 sm:p-8 space-y-8 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Éditeur du site</h2>
            <p>
              <strong>MyArtipro</strong><br />
              [Nom de votre entreprise ou votre nom complet]<br />
              [Adresse postale]<br />
              [Numéro SIRET]<br />
              Email : [votre email de contact]<br />
              Téléphone : [votre numéro]
            </p>
            <p className="mt-2 text-gray-400 italic">
              À compléter avec vos informations réelles avant mise en production.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Hébergement</h2>
            <p>
              Le site est hébergé par :<br />
              [Nom de l'hébergeur — ex : Vercel, Railway, OVH]<br />
              [Adresse de l'hébergeur]
            </p>
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
              Conformément au RGPD, vous disposez d'un droit d'accès, de modification et de
              suppression de vos données. Pour exercer ces droits, contactez-nous à
              [votre email de contact].
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

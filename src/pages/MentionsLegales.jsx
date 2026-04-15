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

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mentions legales</h1>
        <p className="text-gray-400 text-sm mb-8">Derniere mise a jour : avril 2026</p>

        <div className="bg-white rounded-xl border p-6 sm:p-8 space-y-8 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Editeur du site</h2>
            <p>
              <strong>PlombierPro</strong><br />
              [Nom de votre entreprise ou votre nom complet]<br />
              [Adresse postale]<br />
              [Numero SIRET]<br />
              Email : [votre email de contact]<br />
              Telephone : [votre numero]
            </p>
            <p className="mt-2 text-gray-400 italic">
              A completer avec vos informations reelles avant mise en production.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Hebergement</h2>
            <p>
              Le site est heberge par :<br />
              [Nom de l'hebergeur — ex: Vercel, Railway, OVH]<br />
              [Adresse de l'hebergeur]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Protection des donnees personnelles (RGPD)</h2>
            <p>
              PlombierPro collecte et traite des donnees personnelles dans le cadre de son activite :
              noms, emails, telephones et adresses de vos clients, ainsi que vos informations
              professionnelles (SIRET, entreprise).
            </p>
            <p className="mt-2">
              Ces donnees sont stockees de maniere securisee sur les serveurs de Supabase
              (Union Europeenne) et ne sont accessibles qu'a vous, l'utilisateur authentifie.
            </p>
            <p className="mt-2">
              Conformement au RGPD, vous disposez d'un droit d'acces, de modification et de
              suppression de vos donnees. Pour exercer ces droits, contactez-nous a
              [votre email de contact].
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Cookies</h2>
            <p>
              PlombierPro utilise uniquement des cookies techniques necessaires au fonctionnement
              de l'application (session d'authentification). Aucun cookie publicitaire ou de tracking
              n'est utilise.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Propriete intellectuelle</h2>
            <p>
              L'ensemble du contenu de ce site (textes, images, interface, code source) est
              la propriete de l'editeur. Toute reproduction non autorisee est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Responsabilite</h2>
            <p>
              PlombierPro est un outil d'aide a la gestion. Les devis et factures generes par
              l'application sont sous la responsabilite de l'utilisateur. PlombierPro ne peut etre
              tenu responsable d'erreurs dans les documents generes.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

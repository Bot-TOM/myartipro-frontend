import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { LEGAL } from '../lib/legal'

export default function CGV() {
  const { editeur, miseAJour } = LEGAL

  return (
    <div className="min-h-screen bg-[#EFF2F8]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm mb-8 transition">
          <ArrowLeft size={16} /> Retour
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Conditions Générales de Vente</h1>
        <p className="text-slate-400 text-sm mb-8">Dernière mise à jour : {miseAJour}</p>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-8 text-sm text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">1. Objet</h2>
            <p>
              Les présentes conditions générales de vente (CGV) régissent l'accès et l'utilisation du
              service en ligne <strong>MyArtipro</strong>, édité par {editeur.raisonSociale}, dont le siège est
              situé à {editeur.adresse} (ci-après "le Prestataire").
            </p>
            <p className="mt-2">
              MyArtipro est un logiciel en ligne (SaaS) à destination des artisans et micro-entrepreneurs
              permettant la création, l'envoi et la gestion de devis et factures.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">2. Acceptation des CGV</h2>
            <p>
              L'inscription au service vaut acceptation pleine et entière des présentes CGV. L'utilisateur
              déclare avoir la capacité juridique pour souscrire au service et agir dans le cadre d'une
              activité professionnelle.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">3. Description du service</h2>
            <p>MyArtipro fournit les fonctionnalités suivantes :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Création et envoi de devis électroniques avec signature en ligne (SES — eIDAS)</li>
              <li>Émission et suivi de factures</li>
              <li>Gestion d'un carnet de clients</li>
              <li>Relances automatiques des devis et factures impayées</li>
              <li>Export comptable (CSV, PDF livre des recettes)</li>
              <li>Notifications par email, SMS et push</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">4. Tarifs et facturation</h2>
            <p>
              Les conditions tarifaires sont présentées sur la page de tarification du site. Les prix sont
              indiqués en euros TTC. Le Prestataire se réserve le droit de modifier ses tarifs avec un
              préavis de 30 jours communiqué par email.
            </p>
            <p className="mt-2">
              Les abonnements sont sans engagement sauf mention contraire. Le paiement est traité via
              Stripe, prestataire de paiement sécurisé (PCI-DSS Level 1). Le Prestataire ne stocke
              aucune donnée bancaire.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">5. Durée et résiliation</h2>
            <p>
              L'abonnement est souscrit pour une durée indéterminée. L'utilisateur peut résilier à tout
              moment depuis son espace profil ou en contactant{' '}
              <a href={`mailto:${editeur.email}`} className="text-primary-600 hover:underline">{editeur.email}</a>.
            </p>
            <p className="mt-2">
              En cas de résiliation, l'accès est maintenu jusqu'à la fin de la période payée. Les données
              sont supprimées conformément à la politique de confidentialité, à l'exception des factures
              conservées 10 ans (art. L123-22 du Code de commerce).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">6. Obligations du Prestataire</h2>
            <p>Le Prestataire s'engage à :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Mettre à disposition le service avec un niveau de disponibilité raisonnable (objectif 99 %)</li>
              <li>Sauvegarder régulièrement les données des utilisateurs</li>
              <li>Notifier l'utilisateur en cas d'incident majeur dans les meilleurs délais</li>
              <li>Respecter la réglementation RGPD</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">7. Obligations de l'utilisateur</h2>
            <p>L'utilisateur s'engage à :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Fournir des informations exactes lors de son inscription</li>
              <li>Utiliser le service conformément à la législation en vigueur</li>
              <li>Ne pas utiliser le service à des fins frauduleuses ou illicites</li>
              <li>Conserver la confidentialité de ses identifiants de connexion</li>
              <li>S'assurer de la conformité de ses propres devis et factures vis-à-vis de la loi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">8. Responsabilité</h2>
            <p>
              MyArtipro est un outil d'aide à la gestion. L'utilisateur reste seul responsable de la
              conformité légale de ses documents (devis, factures). Le Prestataire ne saurait être tenu
              responsable d'erreurs dans les documents générés ni des conséquences découlant de leur
              utilisation.
            </p>
            <p className="mt-2">
              La responsabilité du Prestataire est limitée au montant des sommes effectivement versées
              par l'utilisateur au cours des 12 derniers mois précédant le sinistre.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">9. Propriété intellectuelle</h2>
            <p>
              Le service MyArtipro, son interface, son code source et ses contenus sont la propriété
              exclusive du Prestataire. Toute reproduction ou utilisation non autorisée est interdite.
              Les données saisies par l'utilisateur (clients, devis, factures) restent sa propriété.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">10. Données personnelles</h2>
            <p>
              Le traitement des données personnelles est décrit dans la{' '}
              <Link to="/politique-confidentialite" className="text-primary-600 hover:underline">
                politique de confidentialité
              </Link>{' '}
              et les{' '}
              <Link to="/mentions-legales" className="text-primary-600 hover:underline">
                mentions légales
              </Link>.
              Conformément au RGPD, l'utilisateur dispose d'un droit d'accès, de rectification,
              d'effacement et de portabilité de ses données directement depuis son profil.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">11. Droit applicable — Litiges</h2>
            <p>
              Les présentes CGV sont soumises au droit français. En cas de litige, les parties
              s'engagent à rechercher une solution amiable. À défaut, les tribunaux compétents
              du ressort d'{editeur.adresse.split(',')[1]?.trim() || 'Avignon'} seront seuls compétents.
            </p>
          </section>

          <p className="text-xs text-slate-400 pt-4 border-t border-slate-100">
            Pour toute question : <a href={`mailto:${editeur.email}`} className="text-primary-600 hover:underline">{editeur.email}</a>
          </p>
        </div>
      </div>
    </div>
  )
}

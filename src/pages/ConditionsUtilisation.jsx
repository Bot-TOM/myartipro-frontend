import LegalPage from '../components/LegalPage'
import { LEGAL } from '../lib/legal'

const { editeur, rgpd } = LEGAL
const email = rgpd.emailContact

export default function ConditionsUtilisation() {
  return (
    <LegalPage title="Conditions générales d'utilisation" updatedAt="avril 2026">

      <LegalPage.Section title="1. Présentation du service">
        <p>
          MyArtipro est un service SaaS édité par <strong>{editeur.responsable}</strong> ({editeur.raisonSociale}),
          permettant aux artisans et micro-entrepreneurs de créer, envoyer et gérer des devis et
          factures depuis leur téléphone ou ordinateur.
        </p>
        <p>
          Toute utilisation du service implique l'acceptation pleine et entière des présentes CGU.
          En cas de désaccord, l'utilisateur doit cesser d'utiliser le service.
        </p>
      </LegalPage.Section>

      <LegalPage.Section title="2. Accès et inscription">
        <p>
          L'accès au service nécessite la création d'un compte avec une adresse email valide et un
          mot de passe. L'utilisateur s'engage à fournir des informations exactes et à les maintenir
          à jour, notamment son SIRET et ses coordonnées professionnelles.
        </p>
        <p>
          Un seul compte par personne physique. Les accès sont personnels et non cessibles.
          L'utilisateur est seul responsable de la confidentialité de ses identifiants.
        </p>
      </LegalPage.Section>

      <LegalPage.Section title="3. Description des fonctionnalités">
        <ul className="list-disc pl-5 space-y-1">
          <li>Création et envoi de devis par email avec lien d'acceptation public</li>
          <li>Conversion en factures et envoi au client</li>
          <li>Paiement en ligne des factures via Stripe</li>
          <li>Relances automatiques des factures impayées</li>
          <li>Gestion des rappels et du suivi client</li>
          <li>Export PDF des devis et factures</li>
        </ul>
      </LegalPage.Section>

      <LegalPage.Section title="4. Obligations de l'utilisateur">
        <p>L'utilisateur s'engage à :</p>
        <ul className="list-disc pl-5 space-y-1 mt-1">
          <li>Utiliser le service dans le cadre légal de son activité professionnelle déclarée</li>
          <li>S'assurer de la conformité fiscale de ses devis et factures (TVA, mentions obligatoires)</li>
          <li>Ne pas utiliser le service à des fins frauduleuses ou illicites</li>
          <li>Ne pas tenter d'accéder aux données d'autres utilisateurs</li>
          <li>Respecter les droits des tiers (données personnelles de ses clients)</li>
        </ul>
        <p className="mt-2 text-slate-500 text-xs">
          ⚠️ MyArtipro est un outil d'assistance. La conformité légale et fiscale des documents générés
          reste de l'entière responsabilité de l'utilisateur.
        </p>
      </LegalPage.Section>

      <LegalPage.Section title="5. Tarification">
        <p>
          Les conditions tarifaires en vigueur sont publiées sur le site. Tout changement de prix
          fait l'objet d'un préavis de <strong>30 jours</strong> par email. L'utilisateur peut
          résilier sans frais avant l'entrée en vigueur du nouveau tarif.
        </p>
      </LegalPage.Section>

      <LegalPage.Section title="6. Disponibilité du service">
        <p>
          MyArtipro s'engage à maintenir le service accessible 24h/24, 7j/7, hors maintenances
          planifiées (notifiées par email au moins 24h à l'avance) et cas de force majeure.
          Aucun niveau de SLA (disponibilité garantie) n'est contractuellement engagé à ce stade.
        </p>
      </LegalPage.Section>

      <LegalPage.Section title="7. Propriété intellectuelle">
        <p>
          L'ensemble du service MyArtipro (interface, code, marque, logo) est la propriété exclusive
          de l'éditeur. L'utilisateur bénéficie d'une licence d'utilisation personnelle, non exclusive
          et non transférable pour la durée de son abonnement.
        </p>
        <p>
          Les données saisies par l'utilisateur (clients, devis, factures) restent sa propriété.
          Il peut en demander l'export à tout moment via{' '}
          <a href={`mailto:${email}`} className="text-primary-600 hover:underline">{email}</a>.
        </p>
      </LegalPage.Section>

      <LegalPage.Section title="8. Responsabilité et garanties">
        <p>
          MyArtipro est fourni «&nbsp;en l'état&nbsp;». L'éditeur ne garantit pas l'absence totale
          d'erreurs ni l'adéquation du service à un usage particulier.
        </p>
        <p>
          La responsabilité de l'éditeur ne peut être engagée au-delà des sommes effectivement payées
          par l'utilisateur au cours des 12 derniers mois. Elle est exclue en cas de :
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-1">
          <li>Force majeure ou défaillance d'un prestataire tiers</li>
          <li>Mauvaise utilisation du service par l'utilisateur</li>
          <li>Erreur dans les données saisies par l'utilisateur</li>
          <li>Non-conformité fiscale imputable à l'utilisateur</li>
        </ul>
      </LegalPage.Section>

      <LegalPage.Section title="9. Résiliation">
        <p>
          L'utilisateur peut résilier son compte à tout moment depuis les paramètres du profil ou
          par email. Les données sont supprimées dans un délai de <strong>30 jours</strong>, à
          l'exception des factures conservées 10 ans conformément à l'article L123-22 du Code de
          commerce.
        </p>
        <p>
          L'éditeur se réserve le droit de suspendre ou clôturer un compte en cas de violation des
          présentes CGU, après notification préalable (sauf urgence liée à la sécurité).
        </p>
      </LegalPage.Section>

      <LegalPage.Section title="10. Modification des CGU">
        <p>
          L'éditeur peut modifier les présentes CGU. Tout changement substantiel fait l'objet d'une
          notification par email avec un préavis de <strong>30 jours</strong>. La poursuite de
          l'utilisation du service au-delà de ce délai vaut acceptation des nouvelles CGU.
        </p>
      </LegalPage.Section>

      <LegalPage.Section title="11. Droit applicable et litiges">
        <p>
          Les présentes CGU sont régies par le <strong>droit français</strong>. En cas de litige,
          les parties s'efforceront de trouver une solution amiable. À défaut, les tribunaux
          compétents du ressort du siège de l'éditeur seront seuls compétents.
        </p>
        <p>
          Pour toute réclamation : <a href={`mailto:${email}`} className="text-primary-600 hover:underline">{email}</a>
        </p>
      </LegalPage.Section>

    </LegalPage>
  )
}

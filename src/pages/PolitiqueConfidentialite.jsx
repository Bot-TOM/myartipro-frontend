import LegalPage from '../components/LegalPage'
import { LEGAL } from '../lib/legal'

const { editeur, hebergement, rgpd } = LEGAL
const email = rgpd.emailContact

export default function PolitiqueConfidentialite() {
  return (
    <LegalPage title="Politique de confidentialité" updatedAt="avril 2026">

      <LegalPage.Section title="1. Responsable du traitement">
        <p>
          Le responsable du traitement des données personnelles collectées via MyArtipro est :{' '}
          <strong>{editeur.responsable}</strong>, {editeur.raisonSociale},{' '}
          {editeur.adresse} — <a href={`mailto:${email}`} className="text-primary-600 hover:underline">{email}</a>.
        </p>
      </LegalPage.Section>

      <LegalPage.Section title="2. Données collectées et finalités">
        <p>MyArtipro collecte uniquement les données strictement nécessaires :</p>
        <table className="w-full mt-2 text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-3 py-2 border border-slate-200 font-semibold text-slate-700">Donnée</th>
              <th className="px-3 py-2 border border-slate-200 font-semibold text-slate-700">Finalité</th>
              <th className="px-3 py-2 border border-slate-200 font-semibold text-slate-700">Base légale</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Email + mot de passe', 'Authentification et accès au compte', 'Contrat'],
              ['Informations professionnelles (SIRET, adresse, entreprise)', 'Conformité légale des devis et factures', 'Obligation légale'],
              ['Données clients (nom, email, téléphone, adresse)', 'Création de devis et factures', 'Contrat'],
              ['Données de facturation (montants, dates)', 'Conservation obligatoire 10 ans', 'Obligation légale (art. L123-22 C. com.)'],
              ['Adresse IP, logs de connexion', 'Sécurité et prévention des fraudes', 'Intérêt légitime'],
            ].map(([donnee, finalite, base]) => (
              <tr key={donnee} className="even:bg-slate-50">
                <td className="px-3 py-2 border border-slate-200">{donnee}</td>
                <td className="px-3 py-2 border border-slate-200">{finalite}</td>
                <td className="px-3 py-2 border border-slate-200">{base}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </LegalPage.Section>

      <LegalPage.Section title="3. Sous-traitants et transferts">
        <p>Vos données sont traitées par les sous-traitants suivants, tous liés par un accord de traitement conforme au RGPD :</p>
        <ul className="mt-2 space-y-1.5 list-disc pl-5">
          {[
            ...hebergement.map((h) => ({ nom: h.nom, role: h.role })),
            { nom: 'Stripe Inc.', role: 'Traitement des paiements en ligne (paiement sécurisé PCI-DSS)' },
            { nom: 'Resend Inc.', role: 'Envoi des emails transactionnels (devis, factures, rappels)' },
          ].map((s) => (
            <li key={s.nom}>
              <strong>{s.nom}</strong> — {s.role}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-slate-500">
          Vercel, Railway et Resend sont hébergés aux États-Unis. Ces transferts sont encadrés par des clauses contractuelles types (CCT) conformes à l'article 46 du RGPD.
        </p>
      </LegalPage.Section>

      <LegalPage.Section title="4. Durée de conservation">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Compte utilisateur :</strong> durée de la relation contractuelle + 3 ans après résiliation</li>
          <li><strong>Devis :</strong> 5 ans (prescription commerciale)</li>
          <li><strong>Factures :</strong> 10 ans (obligation légale — art. L123-22 du Code de commerce)</li>
          <li><strong>Logs de sécurité :</strong> 12 mois</li>
        </ul>
      </LegalPage.Section>

      <LegalPage.Section title="5. Vos droits (RGPD)">
        <p>Conformément aux articles 15 à 22 du RGPD, vous disposez des droits suivants :</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li><strong>Accès</strong> — obtenir une copie de vos données</li>
          <li><strong>Rectification</strong> — corriger des données inexactes</li>
          <li><strong>Effacement</strong> — demander la suppression (sauf obligations légales)</li>
          <li><strong>Limitation</strong> — restreindre un traitement en cours</li>
          <li><strong>Portabilité</strong> — recevoir vos données dans un format structuré</li>
          <li><strong>Opposition</strong> — vous opposer à un traitement fondé sur l'intérêt légitime</li>
        </ul>
        <p className="mt-2">
          Pour exercer ces droits, écrivez à{' '}
          <a href={`mailto:${email}`} className="text-primary-600 hover:underline">{email}</a>.
          Réponse sous 30 jours.
        </p>
        <p className="mt-2">
          En cas de désaccord, vous pouvez déposer une réclamation auprès de la{' '}
          <strong>CNIL</strong> (Commission Nationale de l'Informatique et des Libertés) :{' '}
          <span className="text-slate-500">cnil.fr — 3 place de Fontenoy, 75007 Paris</span>.
        </p>
      </LegalPage.Section>

      <LegalPage.Section title="6. Cookies">
        <p>
          MyArtipro utilise uniquement des cookies techniques strictement nécessaires au fonctionnement
          du service (token de session Supabase). Aucun cookie publicitaire, analytique tiers ou de
          traçage n'est déposé. Aucun consentement préalable n'est requis pour ces cookies (art. 82 de
          la loi Informatique et Libertés).
        </p>
      </LegalPage.Section>

      <LegalPage.Section title="7. Sécurité">
        <p>
          Les données sont transmises en HTTPS (TLS 1.2+), stockées en base de données chiffrée
          (Supabase/PostgreSQL), avec isolation par utilisateur via Row Level Security (RLS).
          Les mots de passe ne sont jamais stockés en clair.
        </p>
      </LegalPage.Section>

      <LegalPage.Section title="8. Modifications">
        <p>
          Toute modification substantielle de cette politique fait l'objet d'une notification par
          email avec un délai de préavis de 30 jours. La poursuite de l'utilisation du service vaut
          acceptation de la nouvelle politique.
        </p>
      </LegalPage.Section>

    </LegalPage>
  )
}

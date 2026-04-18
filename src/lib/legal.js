/**
 * Coordonnées légales MyArtipro (éditeur + hébergement + RGPD).
 *
 * ⚠️  AVANT premier client payant :
 *   - Renseigner le SIRET (14 chiffres) une fois la micro-entreprise créée
 *   - Compléter l'adresse postale exacte déclarée à l'URSSAF
 *   - (optionnel) Ajouter un numéro de téléphone pro
 */

export const LEGAL = {
  editeur: {
    raisonSociale: 'MyArtipro',
    responsable: 'Tom Romand',
    adresse: 'Avignon, France',
    siret: 'en cours d\'immatriculation',
    email: 'tom.romandmalaure@icloud.com',
    telephone: '—',
  },
  hebergement: [
    {
      nom: 'Vercel Inc.',
      role: 'Hébergement frontend (application web)',
      adresse: '440 N Barranca Ave #4133, Covina, CA 91723, États-Unis',
    },
    {
      nom: 'Railway Corp.',
      role: 'Hébergement backend (API)',
      adresse: '548 Market St PMB 77519, San Francisco, CA 94104, États-Unis',
    },
    {
      nom: 'Supabase Inc.',
      role: 'Base de données et authentification (Union européenne)',
      adresse: '970 Toa Payoh North #07-04, Singapour 318992',
    },
  ],
  rgpd: {
    emailContact: 'tom.romandmalaure@icloud.com',
  },
  miseAJour: 'avril 2026',
}

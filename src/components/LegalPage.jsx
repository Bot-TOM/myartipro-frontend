import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-slate-900 mb-2">{title}</h2>
      <div className="space-y-2 text-slate-600">{children}</div>
    </section>
  )
}

function LegalPage({ title, updatedAt, children }) {
  return (
    <div className="min-h-screen bg-[#EFF2F8]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm mb-8 transition"
        >
          <ArrowLeft size={15} />
          Retour
        </Link>

        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">{title}</h1>
        <p className="text-xs text-slate-400 mb-6">Dernière mise à jour : {updatedAt}</p>

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 space-y-7 text-sm leading-relaxed">
          {children}
        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-400">
          <Link to="/mentions-legales" className="hover:text-primary-600 transition">Mentions légales</Link>
          <Link to="/politique-confidentialite" className="hover:text-primary-600 transition">Politique de confidentialité</Link>
          <Link to="/conditions-utilisation" className="hover:text-primary-600 transition">Conditions d'utilisation</Link>
        </div>
      </div>
    </div>
  )
}

LegalPage.Section = Section

export default LegalPage

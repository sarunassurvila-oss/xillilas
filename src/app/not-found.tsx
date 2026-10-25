import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="wrap page">
      <div className="empty">
        <h3>Puslapis nerastas</h3>
        <p>Skelbimas galėjo būti ištrintas, pristabdytas arba nebegalioja.</p>
        <Link className="btn btn-ghost" href="/">Grįžti į paiešką</Link>
      </div>
    </div>
  )
}

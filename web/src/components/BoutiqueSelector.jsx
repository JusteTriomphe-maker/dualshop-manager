import { useState, useEffect } from 'react'
import api from '../api/client'

export default function BoutiqueSelector({ value, onChange, className = '' }) {
  const [boutiques, setBoutiques] = useState([])

  useEffect(() => {
    api.get('/boutiques').then(res => setBoutiques(res.data)).catch(() => {})
  }, [])

  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className={`select-control ${className}`}
    >
      <option value="">Choisir boutique</option>
      {boutiques.map(b => (
        <option key={b.id} value={b.id}>{b.nom}</option>
      ))}
    </select>
  )
}

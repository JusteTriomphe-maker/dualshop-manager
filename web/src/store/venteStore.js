import { create } from 'zustand'

const useVenteStore = create((set, get) => ({
  lignes: [],

  addProduit: (produit) => {
    const lignes = get().lignes
    const exist = lignes.find(l => l.produitId === produit.id)
    if (exist) {
      set({
        lignes: lignes.map(l =>
          l.produitId === produit.id
            ? { ...l, quantite: l.quantite + 1, sousTotal: (l.quantite + 1) * l.prixUnit }
            : l
        )
      })
    } else {
      set({
        lignes: [...lignes, {
          produitId: produit.id,
          nom: produit.nom,
          quantite: 1,
          prixUnit: produit.prix,
          sousTotal: produit.prix,
        }]
      })
    }
  },

  updateQuantite: (produitId, quantite) => {
    if (quantite <= 0) {
      set({ lignes: get().lignes.filter(l => l.produitId !== produitId) })
    } else {
      set({
        lignes: get().lignes.map(l =>
          l.produitId === produitId
            ? { ...l, quantite, sousTotal: quantite * l.prixUnit }
            : l
        )
      })
    }
  },

  removeLigne: (produitId) => {
    set({ lignes: get().lignes.filter(l => l.produitId !== produitId) })
  },

  clear: () => set({ lignes: [] }),

  total: () => get().lignes.reduce((s, l) => s + l.sousTotal, 0),
}))

export default useVenteStore

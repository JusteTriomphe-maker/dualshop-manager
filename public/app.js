const els={status:document.getElementById('status'),boutiqueSelect:document.getElementById('boutiqueSelect'),viewTitle:document.getElementById('viewTitle'),viewBody:document.getElementById('viewBody')};
const btns={rapports:document.getElementById('btnRapports'),produits:document.getElementById('btnProduits'),stock:document.getElementById('btnStock'),ventes:document.getElementById('btnVentes'),depenses:document.getElementById('btnDepenses')};
const state={boutiqueId:null};

function setStatus(msg, type='info'){els.status.textContent=msg;els.status.style.color=type==='error'?'#ef4444':'#64748b';}

async function api(path, body){
  const res=await fetch(path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  const data=await res.json().catch(()=>({}));
  if(!res.ok){throw new Error(data.error||data.message||'Erreur API');}
  return data;
}
async function apiPost(path, body){
  const res=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error||data.message||'Erreur API');
  return data;
}

function optionize(rows){return rows.map(r=>`<option value="${r.id}">${escapeHtml(r.nom)}</option>`).join('');}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#39;'
  }[c]));
}

async function loadBoutiques(){
  const boutiques=await api('/api/boutiques');
  els.boutiqueSelect.innerHTML=optionize(boutiques);
  state.boutiqueId=Number(els.boutiqueSelect.value);
  els.boutiqueSelect.addEventListener('change',()=>{state.boutiqueId=Number(els.boutiqueSelect.value);renderCurrent();});
}

function view(html,title){els.viewTitle.textContent=title||'';els.viewBody.innerHTML=html;}

let currentAction=null;
function renderCurrent(){
  if(currentAction==='rapports') return renderRapports();
  if(currentAction==='produits') return renderProduits();
  if(currentAction==='stock') return renderStock();
  if(currentAction==='ventes') return renderVentes();
  if(currentAction==='depenses') return renderDepenses();
  view('<div class="muted">Sélectionne une action.</div>','');
}

btns.rapports.addEventListener('click',()=>{currentAction='rapports';renderRapports();});
btns.produits.addEventListener('click',()=>{currentAction='produits';renderProduits();});
btns.stock.addEventListener('click',()=>{currentAction='stock';renderStock();});
btns.ventes.addEventListener('click',()=>{currentAction='ventes';renderVentes();});
btns.depenses.addEventListener('click',()=>{currentAction='depenses';renderDepenses();});

async function renderRapports(){
  try{
    const periode='7j';
    view('<div class="muted">Chargement...</div>','Rapports (derniers 7 jours)');
    const data=await api(`/api/rapports?boutique_id=${state.boutiqueId}&periode=${periode}`);
    const stockRows=data.stock_actuel||[];
    view(`
      <div class="grid2">
        <div>
          <div class="small">CA</div><div style="font-size:22px;font-weight:700">${data.ca.toFixed(2)}</div>
          <div class="small" style="margin-top:6px">Dépenses</div><div style="font-size:18px;font-weight:600">${data.depenses.toFixed(2)}</div>
          <div class="small" style="margin-top:6px">Résultat net (approx)</div><div style="font-size:18px;font-weight:700">${data.resultat_net.toFixed(2)}</div>
          <div class="small" style="margin-top:6px">Nombre ventes: ${data.nb_ventes} | Nombre dépenses: ${data.nb_depenses}</div>
        </div>
        <div>
          <div class="small">Stock actuel (quantités > 0)</div>
          <table class="table"><thead><tr><th>Produit</th><th>Qté</th><th>Prix vente</th></tr></thead>
          <tbody>${stockRows.length?stockRows.map(r=>`<tr><td>${escapeHtml(r.nom)}</td><td>${Number(r.quantite).toFixed(2)} ${escapeHtml(r.unite||'')}</td><td>${Number(r.prix_vente).toFixed(2)}</td></tr>`).join(''):`<tr><td colspan="3" class="muted">Stock vide</td></tr>`}</tbody></table>
        </div>
      </div>
    `,'Rapports (derniers 7 jours)');
  }catch(e){setStatus(e.message,'error');view('', '');}
}

async function renderProduits(){
  try{
    view('<div class="muted">Chargement...</div>','Produits');
    const produits=await api('/api/produits');
    const form=`
      <div class="form-row">
        <div><label>Nom<input id="p_nom" placeholder="Ex: Sucre" /></label></div>
        <div><label>Unité<input id="p_unite" placeholder="kg" /></label></div>
      </div>
      <div class="form-row" style="margin-top:10px">
        <div><label>Prix achat<input id="p_prix_achat" type="number" step="0.01" value="0" /></label></div>
        <div><label>Prix vente<input id="p_prix_vente" type="number" step="0.01" value="0" /></label></div>
      </div>
      <div style="margin-top:10px"><button class="primary" id="btnAjouterProduit">Ajouter produit</button></div>
    `;

    const table=`<table class="table"><thead><tr><th>Nom</th><th>Unité</th><th>Prix achat</th><th>Prix vente</th><th></th></tr></thead>
      <tbody>${produits.map(p=>`<tr>
        <td>${escapeHtml(p.nom)}</td>
        <td>${escapeHtml(p.unite||'')}</td>
        <td>${Number(p.prix_achat).toFixed(2)}</td>
        <td>${Number(p.prix_vente).toFixed(2)}</td>
        <td><button data-del="${p.id}">Supprimer</button></td>
      </tr>`).join('')}</tbody></table>`;

    view(form+table,'Produits');

    document.getElementById('btnAjouterProduit').addEventListener('click', async ()=>{
      const nom=document.getElementById('p_nom').value.trim();
      const unite=document.getElementById('p_unite').value.trim();
      const prix_achat=Number(document.getElementById('p_prix_achat').value||0);
      const prix_vente=Number(document.getElementById('p_prix_vente').value||0);
      if(!nom||!unite) return setStatus('Nom et unité requis','error');
      await apiPost('/api/produits',{nom,unite,prix_achat,prix_vente});
      setStatus('Produit ajouté');
      renderProduits();
    });

    document.querySelectorAll('button[data-del]').forEach(b=>{
      b.addEventListener('click', async ()=>{
        const id=Number(b.getAttribute('data-del'));
        await fetch(`/api/produits/${id}`,{method:'DELETE'});
        setStatus('Produit supprimé');
        renderProduits();
      });
    });
  }catch(e){setStatus(e.message,'error');}
}

async function renderStock(){
  try{
    view('<div class="muted">Chargement...</div>','Stock');
    const [stock,mouv]=await Promise.all([
      api(`/api/stock/${state.boutiqueId}`),
      api(`/api/stock-mouvements/${state.boutiqueId}`)
    ]);

    const produits=await api('/api/produits');
    const opt=produits.map(p=>`<option value="${p.id}">${escapeHtml(p.nom)} (${escapeHtml(p.unite||'')})</option>`).join('');

    const form=`
      <div class="grid2">
        <div>
          <label>Produit<select id="s_produit">${opt}</select></label>
          <label style="margin-top:10px">Type
            <select id="s_type">
              <option value="ENTREE">ENTREE</option>
              <option value="SORTIE">SORTIE</option>
            </select>
          </label>
        </div>
        <div>
          <label>Quantité<input id="s_qte" type="number" step="0.01" min="0.01" value="1" /></label>
          <label style="margin-top:10px">Prix coût unitaire (pour ENTREE)
            <input id="s_prix_cout" type="number" step="0.01" min="0" value="0" />
          </label>
        </div>
      </div>
      <label style="margin-top:10px">Motif<input id="s_motif" placeholder="Ex: achat / casse" /></label>
      <div style="margin-top:10px"><button class="primary" id="btnMouvement">Valider mouvement stock</button></div>
    `;

    const table1=`<table class="table"><thead><tr><th>Produit</th><th>Qté</th><th>Prix coût</th><th>Prix vente</th></tr></thead>
      <tbody>${stock.map(r=>`<tr><td>${escapeHtml(r.nom)}</td><td>${Number(r.quantite).toFixed(2)} ${escapeHtml(r.unite||'')}</td><td>${Number(r.prix_cout_unitaire).toFixed(2)}</td><td>${Number(r.prix_vente).toFixed(2)}</td></tr>`).join('')}${!stock.length?'<tr><td colspan="4" class="muted">Aucun produit</td></tr>':''}</tbody></table>`;

    const table2=`<div class="small" style="margin-top:14px">Derniers mouvements (200)</div>
      <table class="table"><thead><tr><th>Date</th><th>Type</th><th>Produit</th><th>Qté</th><th>Motif</th></tr></thead>
      <tbody>${mouv.map(m=>`<tr><td>${escapeHtml(m.date_mouvement||'')}</td><td>${escapeHtml(m.type)}</td><td>${escapeHtml(m.produit_nom||'')}</td><td>${Number(m.quantite).toFixed(2)}</td><td>${escapeHtml(m.motif||'')}</td></tr>`).join('')}${!mouv.length?'<tr><td colspan="5" class="muted">Aucun mouvement</td></tr>':''}</tbody></table>`;

    view(form + table1 + table2,'Stock');

    document.getElementById('btnMouvement').addEventListener('click', async ()=>{
      const boutique_id=state.boutiqueId;
      const produit_id=Number(document.getElementById('s_produit').value);
      const type=document.getElementById('s_type').value;
      const quantite=Number(document.getElementById('s_qte').value);
      const prix_cout_unitaire=Number(document.getElementById('s_prix_cout').value);
      const motif=document.getElementById('s_motif').value.trim();
      await apiPost('/api/stock-mouvements',{boutique_id,produit_id,type,quantite,prix_cout_unitaire,motif});
      setStatus('Mouvement enregistré');
      renderStock();
    });
  }catch(e){setStatus(e.message,'error');}
}

async function renderVentes(){
  try{
    const produits=await api('/api/produits');
    const opt=produits.map(p=>`<option value="${p.id}" data-unite="${escapeHtml(p.unite||'')}">${escapeHtml(p.nom)}</option>`).join('');

    let lignes=[]; // {produit_id, nom, q, pu, total}

    function renderTable(){
      const tb=document.getElementById('v_tb');
      if(!tb) return;
      if(!lignes.length){
        tb.innerHTML="<tr><td colspan='5' class='muted'>Ajoute des lignes</td></tr>";
        return;
      }
      tb.innerHTML=lignes.map((l,i)=>`<tr>
        <td>${escapeHtml(l.nom)}</td>
        <td>${Number(l.q).toFixed(2)}</td>
        <td>${Number(l.pu).toFixed(2)}</td>
        <td>${Number(l.total).toFixed(2)}</td>
        <td><button data-rm="${i}">Retirer</button></td>
      </tr>`).join('');
    }

    function recomputeTotal(){
      const t=lignes.reduce((a,x)=>a+Number(x.total),0);
      document.getElementById('v_total').textContent=t.toFixed(2);
    }

    view(`
      <div class="grid2">
        <div>
          <label>Produit<select id="v_produit">${opt}</select></label>
          <label style="margin-top:10px">Quantité<input id="v_q" type="number" step="0.01" min="0.01" value="1" /></label>
        </div>
        <div>
          <label>Prix unitaire<input id="v_pu" type="number" step="0.01" min="0" value="0" /></label>
          <div style="margin-top:10px"><button class="primary" id="btnAjLigne">Ajouter ligne</button></div>
          <div class="small" style="margin-top:8px">Total lignes: <b id="v_total">0</b></div>
        </div>
      </div>
      <div class="small" style="margin-top:14px">Lignes de vente</div>
      <table class="table"><thead><tr><th>Produit</th><th>Qté</th><th>PU</th><th>Total</th><th></th></tr></thead>
      <tbody id="v_tb"><tr><td colspan="5" class="muted">Ajoute des lignes</td></tr></tbody></table>
      <label style="margin-top:10px">Référence (optionnel)<input id="v_ref" placeholder="Ticket / facture" /></label>
      <div class="form-row" style="margin-top:10px">
        <div><label>Mode paiement<select id="v_pai">
          <option value="especes">espèces</option>
          <option value="carte">carte</option>
          <option value="virement">virement</option>
        </select></label></div>
      </div>
      <div style="margin-top:10px"><button class="primary" id="btnValiderVente">Enregistrer vente</button></div>
    `,'Ventes');

    document.getElementById('btnAjLigne').addEventListener('click', ()=>{
      const pid=Number(document.getElementById('v_produit').value);
      const prod=produits.find(p=>p.id===pid);
      const nom=prod?.nom||'';
      const q=Number(document.getElementById('v_q').value);
      const pu=Number(document.getElementById('v_pu').value);

      if(!pid||!prod) return setStatus('Produit invalide','error');
      if(!Number.isFinite(q)||q<=0) return setStatus('Quantité invalide','error');
      if(!Number.isFinite(pu)||pu<0) return setStatus('Prix unitaire invalide','error');

      lignes.push({produit_id:pid, nom, q, pu, total: q*pu});
      renderTable();
      recomputeTotal();
    });

    // Event delegation: un seul listener pour retirer
    document.getElementById('v_tb').addEventListener('click', (e)=>{
      const btn=e.target && e.target.closest && e.target.closest('button[data-rm]');
      if(!btn) return;
      const i=Number(btn.getAttribute('data-rm'));
      if(!Number.isFinite(i) || i<0 || i>=lignes.length) return;
      lignes.splice(i,1);
      renderTable();
      recomputeTotal();
    });

    document.getElementById('btnValiderVente').addEventListener('click', async ()=>{
      if(!lignes.length) return setStatus('Ajoute au moins une ligne','error');
      const payload={
        boutique_id: state.boutiqueId,
        reference: (document.getElementById('v_ref').value||'').trim()||null,
        mode_paiement: document.getElementById('v_pai').value,
        lignes: lignes.map(l=>({produit_id:l.produit_id, quantite:l.q, prix_unitaire:l.pu}))
      };
      await apiPost('/api/ventes', payload);
      setStatus('Vente enregistrée');
      lignes=[];
      renderTable();
      recomputeTotal();
    });

    // init
    renderTable();
    recomputeTotal();

  }catch(e){setStatus(e.message,'error');}
}

async function renderDepenses(){
  try{
    view(`
      <div class="grid2">
        <div>
          <label>Catégorie<input id="d_cat" placeholder="Ex: Courses" /></label>
          <label style="margin-top:10px">Montant<input id="d_mont" type="number" step="0.01" min="0" value="0" /></label>
        </div>
        <div>
          <label>Description (optionnel)<textarea id="d_desc" placeholder="Détails"></textarea></label>
        </div>
      </div>
      <div style="margin-top:10px"><button class="primary" id="btnEnrDep">Enregistrer dépense</button></div>
      <div class="small" style="margin-top:14px">Astuce: ajoute ensuite une entrée/sortie stock via l’écran Stock si nécessaire.</div>
    `,'Dépenses');
    document.getElementById('btnEnrDep').addEventListener('click', async ()=>{
      const categorie=document.getElementById('d_cat').value.trim();
      const montant=Number(document.getElementById('d_mont').value);
      const description=document.getElementById('d_desc').value.trim();
      if(!categorie) return setStatus('Catégorie requise','error');
      if(!Number.isFinite(montant)||montant<=0) return setStatus('Montant invalide','error');
      await apiPost('/api/depenses',{boutique_id:state.boutiqueId,categorie,montant,description: description||null});
      setStatus('Dépense enregistrée');
      renderDepenses();
    });
  }catch(e){setStatus(e.message,'error');}
}

(async function init(){
  try{
    setStatus('Initialisation...');
    await loadBoutiques();
    currentAction='rapports';
    renderCurrent();
    setStatus('Prêt');
  }catch(e){setStatus(e.message,'error');}
})();


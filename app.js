// Estado global
let state = {
  view: 'lista',
  pacientes: [],
  pacienteAtual: null,
  avaliacoes: [],
  avaliacaoAtual: null,
  tab: 'roteiro',
  modalNovoPaciente: false,
};

const UTIs = ['Azul','Amarela','Branca','Cinza','Laranja','Verde','Lilás','Rosa','Dourada','Prata'];
const COMORBIDADES = ['HAS','DM','ICC','DPOC','Cirrose','Neoplasia','Cardiopatia/CATE'];
const GATILHOS = ['Sepse','Pneumonia','ITU','Contraste','AINEs','Rabdomiólise','Obstrutiva','Hipovolemia','Cardiorrenal'];
const POSOP = ['RM','Troca valvar','CATE','Outro'];

// Render principal
async function render() {
  const app = document.getElementById('app');
  switch(state.view) {
    case 'lista': app.innerHTML = await renderLista(); break;
    case 'paciente': app.innerHTML = await renderPaciente(); break;
    case 'roteiro': app.innerHTML = renderRoteiro(); break;
    case 'prescricao': app.innerHTML = renderPrescricao(); break;
  }
  bindEvents();
}

// ── LISTA DE PACIENTES ──
async function renderLista() {
  state.pacientes = await DB.getAll('pacientes');
  state.pacientes.sort((a,b) => (b.updatedAt||0) - (a.updatedAt||0));

  const items = state.pacientes.length === 0
    ? `<div class="empty-state"><div class="icon">🏥</div><p>Nenhum paciente cadastrado</p><p style="font-size:13px;margin-top:8px;color:#aaa;">Toque + para adicionar</p></div>`
    : state.pacientes.map(p => {
        const av = p.ultimaAvaliacao;
        const conduta = av?.conduta || '';
        const badgeClass = conduta === 'hd_hoje' || conduta === 'hd_amanha' ? 'hd' : conduta === 'alta' ? 'alta' : '';
        const badgeText = conduta === 'hd_hoje' ? 'HD HOJE' : conduta === 'hd_amanha' ? 'HD AMANHÃ' : conduta === 'conservador' ? 'CONSERVADOR' : '';
        return `<div class="patient-item" data-id="${p.id}">
          <div class="patient-info">
            <div class="patient-name">${p.nome}</div>
            <div class="patient-meta">${p.uti ? 'UTI '+p.uti : ''} ${p.leito ? '· Leito '+p.leito : ''} ${p.status ? '· '+p.status : ''}</div>
          </div>
          ${badgeText ? `<span class="patient-badge ${badgeClass}">${badgeText}</span>` : ''}
        </div>`;
      }).join('');

  return `
    <div class="header">
      <h1>Nefrologia UTI</h1>
      <button class="header-btn" onclick="showModalNovoPaciente()">+ Paciente</button>
    </div>
    <div class="card" style="margin-top:16px;">
      ${items}
    </div>
    ${renderModalNovoPaciente()}
  `;
}

function renderModalNovoPaciente() {
  if (!state.modalNovoPaciente) return '';
  return `
    <div class="modal-overlay" onclick="if(event.target===this)fecharModal()">
      <div class="modal">
        <button class="modal-close" onclick="fecharModal()">✕</button>
        <div class="modal-title">Novo Paciente</div>
        
        <div class="form-group" style="margin-bottom:12px;">
          <div class="form-row">
            <span class="form-label">Nome</span>
            <input class="form-input" id="np-nome" placeholder="Nome completo" autofocus>
          </div>
          <div class="form-row">
            <span class="form-label">Leito</span>
            <input class="form-input" id="np-leito" placeholder="Ex: 12" type="text">
          </div>
          <div class="form-row">
            <span class="form-label">Convênio</span>
            <input class="form-input" id="np-convenio" placeholder="Ex: SUS">
          </div>
          <div class="form-row">
            <span class="form-label">Status</span>
            <select class="form-select" id="np-status">
              <option value="IRA">IRA</option>
              <option value="DRC-A">DRC-A</option>
              <option value="DRC-5D">DRC-5D</option>
            </select>
          </div>
        </div>
        
        <div class="form-section-title">UTI</div>
        <div class="form-group">
          <div class="uti-selector" id="np-uti-sel">
            ${UTIs.map(u => `<span class="uti-badge" data-uti="${u}" onclick="selecionarUTI(this,'np')">${u}</span>`).join('')}
          </div>
        </div>
        
        <button class="btn btn-primary" style="width:100%;margin-top:16px;" onclick="salvarNovoPaciente()">Cadastrar Paciente</button>
      </div>
    </div>`;
}

// ── PACIENTE ──
async function renderPaciente() {
  const p = state.pacienteAtual;
  state.avaliacoes = await DB.getByIndex('avaliacoes','pacienteId', p.id);
  state.avaliacoes.sort((a,b) => b.data - a.data);

  const ultimaAv = state.avaliacoes[0];
  const diasHD = p.dataInicioHD ? Math.floor((Date.now() - p.dataInicioHD) / 86400000) : null;
  const diasInt = p.dataInternacao ? Math.floor((Date.now() - p.dataInternacao) / 86400000) : null;

  return `
    <div class="header">
      <button class="back-btn" onclick="voltarLista()">‹</button>
      <h1>${p.nome}</h1>
      <button class="header-btn" onclick="novaAvaliacao()">+ Avaliar</button>
    </div>
    
    <div class="tabs">
      <div class="tab ${state.tab==='info'?'active':''}" onclick="setTab('info')">Dados</div>
      <div class="tab ${state.tab==='historico'?'active':''}" onclick="setTab('historico')">Histórico</div>
      ${ultimaAv ? `<div class="tab ${state.tab==='ultima'?'active':''}" onclick="setTab('ultima')">Última Av.</div>` : ''}
    </div>
    
    ${state.tab === 'info' ? renderInfoPaciente(p, diasHD, diasInt) : ''}
    ${state.tab === 'historico' ? renderHistorico() : ''}
    ${state.tab === 'ultima' && ultimaAv ? renderUltimaAvaliacao(ultimaAv) : ''}
    
    <div class="bottom-actions">
      <button class="btn btn-secondary" onclick="editarPaciente()">Editar</button>
      <button class="btn btn-primary" onclick="novaAvaliacao()">Nova Avaliação</button>
    </div>
  `;
}

function renderInfoPaciente(p, diasHD, diasInt) {
  return `
    <div class="card" style="margin-top:12px;">
      <div class="card-header">IDENTIFICAÇÃO</div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:14px;">
          <div><span style="color:#666;">UTI:</span> <b>${p.uti||'—'}</b></div>
          <div><span style="color:#666;">Leito:</span> <b>${p.leito||'—'}</b></div>
          <div><span style="color:#666;">Status:</span> <b>${p.status||'—'}</b></div>
          <div><span style="color:#666;">Convênio:</span> <b>${p.convenio||'—'}</b></div>
          ${diasInt !== null ? `<div><span style="color:#666;">D. Internação:</span> <b>${diasInt}d</b></div>` : ''}
          ${diasHD !== null ? `<div><span style="color:#666;">D. HD:</span> <b>${diasHD}d</b></div>` : ''}
        </div>
      </div>
    </div>
    
    ${p.comorbidades?.length ? `
    <div class="card">
      <div class="card-header">COMORBIDADES</div>
      <div class="card-body">
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${p.comorbidades.map(c => `<span style="background:#1a3a5c;color:white;border-radius:12px;padding:3px 10px;font-size:12px;">${c}</span>`).join('')}
        </div>
      </div>
    </div>` : ''}
    
    ${p.gatilhos?.length ? `
    <div class="card">
      <div class="card-header">CAUSAS / GATILHOS</div>
      <div class="card-body">
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${p.gatilhos.map(g => `<span style="background:#c0392b;color:white;border-radius:12px;padding:3px 10px;font-size:12px;">${g}</span>`).join('')}
        </div>
      </div>
    </div>` : ''}
  `;
}

function renderHistorico() {
  if (state.avaliacoes.length === 0) {
    return `<div class="empty-state"><div class="icon">📋</div><p>Sem avaliações</p></div>`;
  }
  return `
    <div class="card" style="margin-top:12px;">
      <div class="card-header">HISTÓRICO DE AVALIAÇÕES</div>
      ${state.avaliacoes.map(av => {
        const d = new Date(av.data);
        const condutaLabel = {hd_hoje:'HD HOJE', hd_amanha:'HD AMANHÃ', conservador:'CONSERVADOR'}[av.conduta] || av.conduta;
        return `
        <div class="historico-item" onclick="abrirAvaliacao('${av.id}')">
          <div class="historico-date">${d.toLocaleDateString('pt-BR')} — <b>${condutaLabel}</b></div>
          <div class="historico-labs">
            Ur ${av.labs?.ureia_hoje||'—'} · Cr ${av.labs?.creat_hoje||'—'} · K ${av.labs?.pot_hoje||'—'} · Bic ${av.labs?.bic_hoje||'—'}
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

function renderUltimaAvaliacao(av) {
  const d = new Date(av.data);
  return `
    <div class="card" style="margin-top:12px;">
      <div class="card-header">ÚLTIMA AVALIAÇÃO — ${d.toLocaleDateString('pt-BR')}</div>
      <div class="card-body" style="font-size:14px;">
        <div style="margin-bottom:8px;"><b>Conduta:</b> ${{hd_hoje:'HD HOJE',hd_amanha:'HD AMANHÃ',conservador:'CONSERVADOR'}[av.conduta]||'—'}</div>
        <div><b>Labs:</b> Ur ${av.labs?.ureia_hoje||'—'} / Cr ${av.labs?.creat_hoje||'—'} / Na ${av.labs?.sodio_hoje||'—'} / K ${av.labs?.pot_hoje||'—'} / Bic ${av.labs?.bic_hoje||'—'}</div>
        ${av.observacoes ? `<div style="margin-top:8px;color:#666;">${av.observacoes}</div>` : ''}
      </div>
    </div>
    <div style="padding:0 16px;">
      ${av.conduta?.startsWith('hd') ? `<button class="btn btn-danger" style="width:100%;margin-top:8px;" onclick="gerarPrescricao('${av.id}')">📄 Gerar Prescrição HD</button>` : ''}
    </div>`;
}

// ── ROTEIRO DE AVALIAÇÃO ──
function renderRoteiro() {
  const p = state.pacienteAtual;
  const av = state.avaliacaoAtual;
  const prev = state.avaliacoes[0]; // última avaliação para pré-preencher labs

  return `
    <div class="header">
      <button class="back-btn" onclick="voltarPaciente()">‹</button>
      <h1>${p.nome}</h1>
    </div>
    
    <!-- PRIORIDADE -->
    <div class="form-group" style="margin:12px 16px 0;">
      <div class="prioridade-bar">
        <span>⚠ PRIORIDADE</span>
        <div class="prioridade-toggle">
          <button class="prio-btn ${av.prioridade==='sim'?'selected':''}" onclick="setPrioridade('sim')">Sim</button>
          <button class="prio-btn ${av.prioridade!=='sim'?'selected':''}" onclick="setPrioridade('nao')">Não</button>
        </div>
      </div>
    </div>
    
    <!-- BEIRA LEITO -->
    <div class="form-section">
      <div class="form-section-title">☐ Beira Leito</div>
      <div class="form-group">
        <div class="form-row">
          <span class="form-label">Estado Geral</span>
          <select class="form-select" id="eg" onchange="updateAv('eg',this.value)">
            <option value="">—</option>
            <option value="Estável" ${av.eg==='Estável'?'selected':''}>Estável</option>
            <option value="Grave" ${av.eg==='Grave'?'selected':''}>Grave</option>
            <option value="Gravíssimo" ${av.eg==='Gravíssimo'?'selected':''}>Gravíssimo</option>
          </select>
        </div>
        <div class="form-row">
          <span class="form-label">Consciência</span>
          <select class="form-select" id="consciencia" onchange="updateAv('consciencia',this.value)">
            <option value="">—</option>
            ${['Consciente e orientado','Confuso','Torporoso','Sedado','Comatoso','Agitado'].map(c => 
              `<option value="${c}" ${av.consciencia===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <span class="form-label">Respiração</span>
          <select class="form-select" id="resp" onchange="updateAv('resp',this.value)">
            <option value="">—</option>
            ${['Eupneico em AA','Cat. Nasal','Máscara','COT/VM','TQT/VM','VNI'].map(r => 
              `<option value="${r}" ${av.resp===r?'selected':''}>${r}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <span class="form-label">SatO2 %</span>
          <input class="form-input" type="number" id="sat" value="${av.sat||''}" placeholder="98" onchange="updateAv('sat',this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">PAM mmHg</span>
          <input class="form-input" type="text" id="pam" value="${av.pam||''}" placeholder="Ex: 85/60" onchange="updateAv('pam',this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">Vasopressores</span>
          <input class="form-input" type="text" id="vasopress" value="${av.vasopress||''}" placeholder="Ex: Nora 8ml/h" onchange="updateAv('vasopress',this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">Volemia</span>
          <select class="form-select" id="volemia" onchange="updateAv('volemia',this.value)">
            <option value="">—</option>
            <option value="Sem edema" ${av.volemia==='Sem edema'?'selected':''}>Sem edema</option>
            <option value="Edema 1+/6+" ${av.volemia==='Edema 1+/6+'?'selected':''}>Edema 1+/6+</option>
            <option value="Edema 2+/6+" ${av.volemia==='Edema 2+/6+'?'selected':''}>Edema 2+/6+</option>
            <option value="Edema 3+/6+" ${av.volemia==='Edema 3+/6+'?'selected':''}>Edema 3+/6+</option>
            <option value="Edema 4+/6+" ${av.volemia==='Edema 4+/6+'?'selected':''}>Edema 4+/6+</option>
            <option value="Edema 5+/6+" ${av.volemia==='Edema 5+/6+'?'selected':''}>Edema 5+/6+</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- BH & DIURÉTICO -->
    <div class="form-section">
      <div class="form-section-title">☐ BH & Diurético</div>
      <div class="form-group">
        <div class="form-row">
          <span class="form-label">Ganhos ml</span>
          <input class="form-input" type="number" id="ganhos" value="${av.ganhos||''}" placeholder="2000" onchange="updateAv('ganhos',this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">Diurese ml</span>
          <input class="form-input" type="number" id="diurese" value="${av.diurese||''}" placeholder="1500" onchange="updateAv('diurese',this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">Furosemida</span>
          <select class="form-select" id="furo_tipo" onchange="updateAv('furo_tipo',this.value)">
            <option value="sem" ${av.furo_tipo==='sem'?'selected':''}>Sem furosemida</option>
            <option value="amp" ${av.furo_tipo==='amp'?'selected':''}>Ampola</option>
            <option value="cp" ${av.furo_tipo==='cp'?'selected':''}>Comprimido</option>
          </select>
        </div>
        ${av.furo_tipo && av.furo_tipo !== 'sem' ? `
        <div class="form-row">
          <span class="form-label">Dose / intervalo</span>
          <input class="form-input" type="text" id="furo_dose" value="${av.furo_dose||''}" placeholder="Ex: 2 amp 12/12h" onchange="updateAv('furo_dose',this.value)">
        </div>` : ''}
      </div>
    </div>
    
    <!-- ÚLTIMA HD -->
    <div class="form-section">
      <div class="form-section-title">☐ Última HD</div>
      <div class="form-group">
        <div class="form-row">
          <span class="form-label">Data</span>
          <input class="form-input" type="date" id="ultima_hd_data" value="${av.ultima_hd_data||''}" onchange="updateAv('ultima_hd_data',this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">Acesso</span>
          <select class="form-select" id="acesso" onchange="updateAv('acesso',this.value)">
            <option value="">—</option>
            <option value="CDL" ${av.acesso==='CDL'?'selected':''}>CDL</option>
            <option value="FAV" ${av.acesso==='FAV'?'selected':''}>FAV</option>
          </select>
        </div>
        <div class="form-row">
          <span class="form-label">Duração P/O</span>
          <input class="form-input" type="text" id="duracao_po" value="${av.duracao_po||''}" placeholder="Ex: 4h / 3h30" onchange="updateAv('duracao_po',this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">UF P/O ml</span>
          <input class="form-input" type="text" id="uf_po" value="${av.uf_po||''}" placeholder="Ex: 2000 / 1800" onchange="updateAv('uf_po',this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">Anticoag</span>
          <select class="form-select" id="anticoag_hd" onchange="updateAv('anticoag_hd',this.value)">
            <option value="">—</option>
            <option value="sem" ${av.anticoag_hd==='sem'?'selected':''}>S/heparina</option>
            <option value="com" ${av.anticoag_hd==='com'?'selected':''}>Com heparina</option>
            <option value="fluxo" ${av.anticoag_hd==='fluxo'?'selected':''}>Fluxo alto</option>
          </select>
        </div>
        <div class="form-row">
          <span class="form-label">Intercorrências</span>
          <input class="form-input" type="text" id="interc" value="${av.interc||''}" placeholder="Nenhuma" onchange="updateAv('interc',this.value)">
        </div>
      </div>
    </div>
    
    <!-- LABORATÓRIO -->
    <div class="form-section">
      <div class="form-section-title">☐ Laboratório (Basal / Ant. / Hoje)</div>
      <div class="form-group">
        <div class="labs-row">
          <div class="labs-cell labs-header"></div>
          <div class="labs-cell labs-header">Basal</div>
          <div class="labs-cell labs-header">Ant.</div>
          <div class="labs-cell labs-header">Hoje</div>
        </div>
        ${[
          ['Ureia','ureia','mg/dL'],
          ['Creatinina','creat','mg/dL'],
          ['Sódio','sodio','mEq/L'],
          ['Potássio','pot','mEq/L'],
          ['Bicarbonato','bic','mEq/L'],
        ].map(([label, key, unit]) => `
        <div class="labs-row">
          <div class="labs-cell" style="font-size:12px;color:#666;">${label}<br><span style="font-size:10px;color:#aaa;">${unit}</span></div>
          <div class="labs-cell"><input type="number" step="0.1" value="${av.labs?.[key+'_basal'] || prev?.labs?.[key+'_hoje'] || ''}" placeholder="—" onchange="updateLab('${key}_basal',this.value)"></div>
          <div class="labs-cell"><input type="number" step="0.1" value="${av.labs?.[key+'_ant'] || prev?.labs?.[key+'_hoje'] || ''}" placeholder="—" onchange="updateLab('${key}_ant',this.value)"></div>
          <div class="labs-cell"><input type="number" step="0.1" value="${av.labs?.[key+'_hoje']||''}" placeholder="—" onchange="updateLab('${key}_hoje',this.value)"></div>
        </div>`).join('')}
      </div>
      
      <!-- ALERTA K+ -->
      ${(parseFloat(av.labs?.pot_hoje) > 5.5) ? `
      <div class="alerta danger">⚠ K+ elevado — checar: IECA, BRA, Entresto, Aldactone, Finerenona</div>` : ''}
    </div>
    
    <!-- CONDUTA -->
    <div class="form-section">
      <div class="form-section-title">☐ Conduta / Conclusão</div>
      
      <div class="conduta-row">
        <button class="conduta-btn hd-hoje ${av.conduta==='hd_hoje'?'selected':''}" onclick="setConduta('hd_hoje')">HD HOJE</button>
        <button class="conduta-btn hd-amanha ${av.conduta==='hd_amanha'?'selected':''}" onclick="setConduta('hd_amanha')">HD AMANHÃ</button>
        <button class="conduta-btn conservador ${av.conduta==='conservador'?'selected':''}" onclick="setConduta('conservador')">CONSERVADOR</button>
      </div>
      
      <!-- PARÂMETROS HD -->
      <div class="hd-params ${av.conduta==='hd_hoje'?'visible':''}" id="hd-params">
        <div class="form-group">
          <div class="form-row">
            <span class="form-label">Duração h</span>
            <input class="form-input" type="number" id="hd_dur" value="${av.hd_dur||''}" placeholder="4" onchange="updateAv('hd_dur',this.value)">
          </div>
          <div class="form-row">
            <span class="form-label">UF ml</span>
            <input class="form-input" type="number" id="hd_uf" value="${av.hd_uf||''}" placeholder="2000" onchange="updateAv('hd_uf',this.value)">
          </div>
          <div class="form-row">
            <span class="form-label">Anticoag</span>
            <select class="form-select" id="anticoag" onchange="updateAv('anticoag',this.value)">
              <option value="sem" ${av.anticoag==='sem'||!av.anticoag?'selected':''}>Sem heparina</option>
              <option value="com" ${av.anticoag==='com'?'selected':''}>Com heparina</option>
              <option value="fluxo" ${av.anticoag==='fluxo'?'selected':''}>Fluxo alto</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- OUTRAS CONDUTAS -->
      <div class="form-group" style="margin-top:8px;">
        <div class="form-row">
          <span class="form-label">Volemia</span>
          <input class="form-input" type="text" id="cond_volemia" value="${av.cond_volemia||''}" placeholder="Ex: Restrição / Fluidos 1L SF" onchange="updateAv('cond_volemia',this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">Eletrólitos</span>
          <input class="form-input" type="text" id="cond_elet" value="${av.cond_elet||''}" placeholder="Ex: Repor K, Mg" onchange="updateAv('cond_elet',this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">Outras</span>
          <input class="form-input" type="text" id="cond_outras" value="${av.cond_outras||''}" placeholder="Ex: Sacar CDL" onchange="updateAv('cond_outras',this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">Desfecho</span>
          <select class="form-select" id="desfecho" onchange="updateAv('desfecho',this.value)">
            <option value="">—</option>
            <option value="alta" ${av.desfecho==='alta'?'selected':''}>Alta</option>
            <option value="paliativo" ${av.desfecho==='paliativo'?'selected':''}>Tratamento Paliativo</option>
            <option value="obito" ${av.desfecho==='obito'?'selected':''}>Óbito</option>
          </select>
        </div>
      </div>
      
      <!-- OBSERVAÇÕES -->
      <div class="form-group" style="margin-top:8px;">
        <textarea class="form-textarea" id="observacoes" placeholder="Observações..." onchange="updateAv('observacoes',this.value)">${av.observacoes||''}</textarea>
      </div>
    </div>
    
    <div style="height:80px;"></div>
    
    <div class="bottom-actions">
      <button class="btn btn-secondary" onclick="voltarPaciente()">Cancelar</button>
      <button class="btn btn-primary" onclick="salvarAvaliacao()">Salvar</button>
      ${av.conduta?.startsWith('hd') ? `<button class="btn btn-danger" onclick="irPrescricao()">Prescrição</button>` : ''}
    </div>
  `;
}

// ── PRESCRIÇÃO HD ──
function renderPrescricao() {
  const av = state.avaliacaoAtual;
  const p = state.pacienteAtual;

  return `
    <div class="header">
      <button class="back-btn" onclick="voltarRoteiro()">‹</button>
      <h1>Prescrição HD</h1>
    </div>
    
    <div class="form-section" style="margin-top:12px;">
      <div class="form-section-title">Modalidade</div>
      <div class="form-group">
        <div class="form-row">
          <span class="form-label">Tipo</span>
          <select class="form-select" id="p_modalidade" onchange="updateAv('modalidade',this.value)">
            <option value="hd" ${av.modalidade==='hd'||!av.modalidade?'selected':''}>HD</option>
            <option value="uf" ${av.modalidade==='uf'?'selected':''}>UF isolada</option>
            <option value="uf_hd" ${av.modalidade==='uf_hd'?'selected':''}>UF isolada → HD</option>
            <option value="hd_uf" ${av.modalidade==='hd_uf'?'selected':''}>HD → UF isolada</option>
          </select>
        </div>
        <div class="form-row">
          <span class="form-label">Duração h</span>
          <input class="form-input" type="number" id="p_hd_horas" value="${av.hd_dur||''}" placeholder="4" onchange="updateAv('hd_horas',this.value)">
        </div>
      </div>
    </div>
    
    <div class="form-section">
      <div class="form-section-title">Fluxos</div>
      <div class="form-group">
        <div class="form-row">
          <span class="form-label">Sangue ml/min</span>
          <input class="form-input" type="number" id="fluxo_sangue" value="${av.fluxo_sangue||'300'}" onchange="updateAv('fluxo_sangue',this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">Banho ml/min</span>
          <input class="form-input" type="number" id="fluxo_banho" value="${av.fluxo_banho||'500'}" onchange="updateAv('fluxo_banho',this.value)">
        </div>
      </div>
    </div>
    
    <div class="form-section">
      <div class="form-section-title">Perdas</div>
      <div class="form-group">
        <div class="form-row">
          <span class="form-label">UF HD ml</span>
          <input class="form-input" type="number" id="uf_hd" value="${av.uf_hd||''}" placeholder="2000" onchange="updateAv('uf_hd',this.value);calcUFEfetiva()">
        </div>
        <div class="form-row">
          <span class="form-label">UF isolada ml</span>
          <input class="form-input" type="number" id="uf_isolada" value="${av.uf_isolada||'0'}" onchange="updateAv('uf_isolada',this.value);calcUFEfetiva()">
        </div>
        <div class="form-row" style="background:#eee;">
          <span class="form-label"><b>UF efetiva ml</b></span>
          <input class="form-input" type="number" id="uf_efetiva" value="${av.uf_efetiva||''}" style="font-weight:bold;" onchange="updateAv('uf_efetiva',this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">Priming ml</span>
          <input class="form-input" type="number" id="priming" value="${av.priming||'200'}" onchange="updateAv('priming',this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">Lavagens ml</span>
          <input class="form-input" type="number" id="lavagens" value="${av.lavagens||'300'}" onchange="updateAv('lavagens',this.value)">
        </div>
      </div>
    </div>
    
    <div class="form-section">
      <div class="form-section-title">Anticoagulação</div>
      <div class="form-group">
        <div class="form-row">
          <span class="form-label">Tipo</span>
          <select class="form-select" id="p_anticoag" onchange="updateAv('anticoag',this.value)">
            <option value="sem" ${av.anticoag==='sem'||!av.anticoag?'selected':''}>Sem heparina</option>
            <option value="com" ${av.anticoag==='com'?'selected':''}>Com heparina</option>
            <option value="fluxo" ${av.anticoag==='fluxo'?'selected':''}>Fluxo alto</option>
          </select>
        </div>
        ${av.anticoag === 'com' ? `
        <div class="form-row">
          <span class="form-label">Volume ml</span>
          <input class="form-input" type="number" id="hep_vol" value="${av.heparina_vol||''}" placeholder="Ex: 2" onchange="updateAv('heparina_vol',this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">Bolus ml</span>
          <input class="form-input" type="number" id="hep_bolus" value="${av.heparina_bolus||''}" onchange="updateAv('heparina_bolus',this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">Taxa ml/h</span>
          <input class="form-input" type="number" id="hep_taxa" value="${av.heparina_taxa||''}" onchange="updateAv('heparina_taxa',this.value)">
        </div>` : ''}
      </div>
    </div>
    
    <div class="form-section">
      <div class="form-section-title">Dialisato</div>
      <div class="form-group">
        <div class="form-row">
          <span class="form-label">Sódio mEq/l</span>
          <input class="form-input" type="number" id="dial_sodio" value="${av.dialisato_sodio||'138'}" onchange="updateAv('dialisato_sodio',this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">Temperatura °C</span>
          <input class="form-input" type="number" id="dial_temp" value="${av.dialisato_temp||'37'}" onchange="updateAv('dialisato_temp',this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">Bicarbonato mEq/l</span>
          <input class="form-input" type="number" id="dial_bic" value="${av.dialisato_bic||'35'}" onchange="updateAv('dialisato_bic',this.value)">
        </div>
      </div>
    </div>
    
    <div class="form-section">
      <div class="form-section-title">Preenchimento do Cateter</div>
      <div class="form-group">
        <div class="form-row">
          <span class="form-label">Solução</span>
          <select class="form-select" id="cateter" onchange="updateAv('cateter',this.value)">
            <option value="bic" ${av.cateter==='bic'||!av.cateter?'selected':''}>Bic. Na 8,4%</option>
            <option value="salina" ${av.cateter==='salina'?'selected':''}>Sol. salina heparinizada</option>
          </select>
        </div>
      </div>
    </div>
    
    <div style="height:80px;"></div>
    
    <div class="bottom-actions">
      <button class="btn btn-secondary" onclick="voltarRoteiro()">Voltar</button>
      <button class="btn btn-success" onclick="gerarPDFPrescricao()">📄 Gerar PDF</button>
    </div>
  `;
}

// ── AÇÕES ──
function showModalNovoPaciente() {
  state.modalNovoPaciente = true;
  render();
}

function fecharModal() {
  state.modalNovoPaciente = false;
  render();
}

function selecionarUTI(el, prefix) {
  document.querySelectorAll(`[data-uti]`).forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
}

async function salvarNovoPaciente() {
  const nome = document.getElementById('np-nome')?.value?.trim();
  if (!nome) { alert('Nome obrigatório'); return; }
  
  const utiEl = document.querySelector('[data-uti].selected');
  const paciente = {
    id: 'p_' + Date.now(),
    nome,
    leito: document.getElementById('np-leito')?.value,
    convenio: document.getElementById('np-convenio')?.value,
    status: document.getElementById('np-status')?.value,
    uti: utiEl?.dataset.uti || '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    comorbidades: [],
    gatilhos: [],
  };
  
  await DB.put('pacientes', paciente);
  state.modalNovoPaciente = false;
  state.pacienteAtual = paciente;
  state.tab = 'info';
  state.view = 'paciente';
  state.avaliacoes = [];
  render();
}

async function abrirPaciente(id) {
  state.pacienteAtual = await DB.get('pacientes', id);
  state.avaliacoes = await DB.getByIndex('avaliacoes', 'pacienteId', id);
  state.avaliacoes.sort((a,b) => b.data - a.data);
  state.tab = 'ultima';
  if (state.avaliacoes.length === 0) state.tab = 'info';
  state.view = 'paciente';
  render();
}

function voltarLista() {
  state.view = 'lista';
  state.pacienteAtual = null;
  render();
}

function voltarPaciente() {
  state.view = 'paciente';
  state.tab = 'historico';
  render();
}

function voltarRoteiro() {
  state.view = 'roteiro';
  render();
}

function setTab(tab) {
  state.tab = tab;
  render();
}

async function novaAvaliacao() {
  const prev = state.avaliacoes[0];
  state.avaliacaoAtual = {
    id: 'av_' + Date.now(),
    pacienteId: state.pacienteAtual.id,
    data: Date.now(),
    prioridade: 'nao',
    conduta: 'conservador',
    labs: {},
    // pré-preencher labs basais da avaliação anterior
    ...(prev ? {
      labs: {
        ureia_basal: prev.labs?.ureia_basal || prev.labs?.ureia_hoje,
        creat_basal: prev.labs?.creat_basal || prev.labs?.creat_hoje,
        sodio_basal: prev.labs?.sodio_basal || prev.labs?.sodio_hoje,
        pot_basal: prev.labs?.pot_basal || prev.labs?.pot_hoje,
        bic_basal: prev.labs?.bic_basal || prev.labs?.bic_hoje,
        ureia_ant: prev.labs?.ureia_hoje,
        creat_ant: prev.labs?.creat_hoje,
        sodio_ant: prev.labs?.sodio_hoje,
        pot_ant: prev.labs?.pot_hoje,
        bic_ant: prev.labs?.bic_hoje,
      }
    } : {}),
  };
  state.view = 'roteiro';
  render();
}

async function abrirAvaliacao(id) {
  state.avaliacaoAtual = await DB.get('avaliacoes', id);
  state.view = 'roteiro';
  render();
}

function updateAv(key, value) {
  state.avaliacaoAtual[key] = value;
}

function updateLab(key, value) {
  if (!state.avaliacaoAtual.labs) state.avaliacaoAtual.labs = {};
  state.avaliacaoAtual.labs[key] = value;
}

function setPrioridade(val) {
  state.avaliacaoAtual.prioridade = val;
  render();
}

function setConduta(val) {
  state.avaliacaoAtual.conduta = val;
  render();
}

function calcUFEfetiva() {
  const hd = parseFloat(document.getElementById('uf_hd')?.value) || 0;
  const iso = parseFloat(document.getElementById('uf_isolada')?.value) || 0;
  const ef = hd + iso;
  const el = document.getElementById('uf_efetiva');
  if (el && ef > 0) { el.value = ef; updateAv('uf_efetiva', ef); }
}

async function salvarAvaliacao() {
  const av = state.avaliacaoAtual;
  await DB.put('avaliacoes', av);
  
  // Atualizar resumo no paciente
  const p = state.pacienteAtual;
  p.updatedAt = Date.now();
  p.ultimaAvaliacao = { conduta: av.conduta, data: av.data };
  await DB.put('pacientes', p);
  
  state.avaliacoes = await DB.getByIndex('avaliacoes', 'pacienteId', p.id);
  state.avaliacoes.sort((a,b) => b.data - a.data);
  state.view = 'paciente';
  state.tab = 'ultima';
  render();
}

function irPrescricao() {
  salvarAvaliacao().then(() => {
    state.view = 'prescricao';
    render();
  });
}

async function gerarPrescricao(avId) {
  state.avaliacaoAtual = await DB.get('avaliacoes', avId);
  state.view = 'prescricao';
  render();
}

function gerarPDFPrescricao() {
  // Salvar antes de gerar
  DB.put('avaliacoes', state.avaliacaoAtual);
  PDF.gerarPrescricao(state.avaliacaoAtual, state.pacienteAtual);
}

function editarPaciente() {
  // Simplificado — abre modal de edição (a implementar)
  alert('Em desenvolvimento');
}

// ── BIND EVENTS ──
function bindEvents() {
  document.querySelectorAll('.patient-item').forEach(el => {
    el.addEventListener('click', () => abrirPaciente(el.dataset.id));
  });
}

// ── INIT ──
async function init() {
  await DB.init();
  render();
}

init();

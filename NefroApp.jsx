import { useState, useEffect } from "react";

// ── DADOS INICIAIS ──
const UTIs = ['Azul','Amarela','Branca','Cinza','Laranja','Verde','Lilás','Rosa','Dourada','Prata'];
const COMORBIDADES = ['HAS','DM','ICC','DPOC','Cirrose','Neoplasia','Cardiopatia/CATE'];
const GATILHOS = ['Sepse','Pneumonia','ITU','Contraste','AINEs','Rabdomiólise','Obstrutiva','Hipovolemia','Cardiorrenal'];

const DEMO_PACIENTES = [
  {
    id: 'p1', nome: 'João Silva', leito: '12', convenio: 'SUS', status: 'IRA',
    uti: 'Azul', comorbidades: ['HAS','DM'], gatilhos: ['Sepse'],
    dataInicioHD: Date.now() - 5*86400000,
    ultimaAvaliacao: { conduta: 'hd_amanha', data: Date.now() - 86400000 }
  },
  {
    id: 'p2', nome: 'Maria Santos', leito: '7', convenio: 'Particular', status: 'DRC-5D',
    uti: 'Verde', comorbidades: ['ICC','HAS'], gatilhos: ['Cardiorrenal'],
    dataInicioHD: Date.now() - 30*86400000,
    ultimaAvaliacao: { conduta: 'hd_hoje', data: Date.now() - 86400000 }
  },
];

const DEMO_AVALIACOES = {
  p1: [{
    id: 'av1', pacienteId: 'p1', data: Date.now() - 86400000,
    conduta: 'hd_amanha', eg: 'Estável', consciencia: 'Consciente e orientado',
    resp: 'Eupneico em AA', sat: '97', pam: '88/65', volemia: 'Edema 2+/6+',
    ganhos: '2100', diurese: '400', furo_tipo: 'amp', furo_dose: '2 amp 12/12h',
    ultima_hd_data: '', acesso: 'CDL', duracao_po: '4h/4h', uf_po: '2000/2000',
    anticoag_hd: 'sem', interc: 'Nenhuma',
    labs: { ureia_basal:'180', creat_basal:'8.2', sodio_basal:'138', pot_basal:'4.8', bic_basal:'16',
            ureia_ant:'145', creat_ant:'7.1', sodio_ant:'139', pot_ant:'4.5', bic_ant:'18',
            ureia_hoje:'128', creat_hoje:'6.4', sodio_hoje:'138', pot_hoje:'4.2', bic_hoje:'20' },
    prioridade: 'nao', observacoes: ''
  }]
};

// ── ESTILOS ──
const S = {
  app: { fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', background: '#f4f4f0', minHeight: '100vh', maxWidth: 480, margin: '0 auto' },
  header: { background: '#1a3a5c', color: 'white', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 100 },
  h1: { fontSize: 18, fontWeight: 700, flex: 1, margin: 0 },
  backBtn: { background: 'none', border: 'none', color: 'white', fontSize: 26, cursor: 'pointer', padding: '0 4px', lineHeight: 1 },
  headerBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: 6, fontSize: 13, cursor: 'pointer' },
  card: { background: 'white', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', margin: '12px 16px', overflow: 'hidden' },
  cardHeader: { background: '#1a3a5c', color: 'white', padding: '8px 14px', fontWeight: 700, fontSize: 11, letterSpacing: '0.5px', textTransform: 'uppercase' },
  patientItem: { display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #eee', cursor: 'pointer' },
  patientName: { fontWeight: 700, fontSize: 16 },
  patientMeta: { fontSize: 13, color: '#888', marginTop: 2 },
  badge: { borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: 'white', marginLeft: 8 },
  emptyState: { textAlign: 'center', padding: '48px 24px', color: '#aaa' },
  formSection: { margin: '12px 16px' },
  formLabel: { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888', marginBottom: 6, padding: '0 2px' },
  formGroup: { background: 'white', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 8 },
  formRow: { display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #f0f0f0', gap: 12 },
  label: { fontSize: 13, color: '#666', minWidth: 110, flexShrink: 0 },
  input: { flex: 1, border: 'none', outline: 'none', fontSize: 15, textAlign: 'right', background: 'transparent', fontFamily: 'inherit' },
  select: { flex: 1, border: 'none', outline: 'none', fontSize: 14, textAlign: 'right', background: 'transparent', fontFamily: 'inherit', appearance: 'none' },
  tabs: { display: 'flex', background: 'white', borderBottom: '1px solid #eee', position: 'sticky', top: 52, zIndex: 90 },
  tab: { flex: 1, padding: '12px 8px', textAlign: 'center', fontSize: 13, fontWeight: 500, color: '#888', cursor: 'pointer', borderBottom: '3px solid transparent' },
  tabActive: { color: '#1a3a5c', borderBottom: '3px solid #1a3a5c', fontWeight: 700 },
  bottomActions: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: 'white', borderTop: '1px solid #eee', padding: '12px 16px', display: 'flex', gap: 10 },
  btn: { flex: 1, padding: 13, border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  condutaRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '12px 16px' },
  condutaBtn: { padding: '14px 8px', border: '2px solid #ddd', borderRadius: 8, background: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center' },
  prioBar: { background: '#1a3a5c', color: 'white', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 },
  alerta: { background: '#fdecea', borderLeft: '4px solid #c0392b', padding: '10px 14px', fontSize: 13, margin: '8px 16px', borderRadius: '0 8px 8px 0' },
  labsGrid: { display: 'grid', gridTemplateColumns: '90px 1fr 1fr 1fr' },
  labCell: { padding: '8px 8px', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontSize: 13 },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'flex-end' },
  modalBox: { background: 'white', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 480, margin: '0 auto', maxHeight: '85vh', overflowY: 'auto', padding: '20px 16px 40px' },
  utiGrid: { display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px 14px' },
  utiBadge: { padding: '6px 12px', borderRadius: 16, border: '1.5px solid #ddd', fontSize: 13, cursor: 'pointer', background: 'white' },
  checkGrid: { display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 14px' },
  checkItem: { padding: '6px 10px', border: '1.5px solid #ddd', borderRadius: 20, fontSize: 13, cursor: 'pointer', background: 'white' },
};

// ── COMPONENTES ──
function Badge({ conduta }) {
  const map = { hd_hoje: ['HD HOJE', '#c0392b'], hd_amanha: ['HD AMANHÃ', '#e67e22'], conservador: ['CONSERVADOR', '#27ae60'], alta: ['ALTA', '#888'] };
  const [label, color] = map[conduta] || ['', ''];
  if (!label) return null;
  return <span style={{ ...S.badge, background: color }}>{label}</span>;
}

function FormRow({ label, children }) {
  return <div style={S.formRow}><span style={S.label}>{label}</span>{children}</div>;
}

function Section({ title, children }) {
  return (
    <div style={S.formSection}>
      <div style={S.formLabel}>{title}</div>
      <div style={S.formGroup}>{children}</div>
    </div>
  );
}

// ── APP PRINCIPAL ──
export default function NefroApp() {
  const [view, setView] = useState('lista');
  const [pacientes, setPacientes] = useState(DEMO_PACIENTES);
  const [avaliacoes, setAvaliacoes] = useState(DEMO_AVALIACOES);
  const [pacAtual, setPacAtual] = useState(null);
  const [avAtual, setAvAtual] = useState(null);
  const [tab, setTab] = useState('ultima');
  const [showModal, setShowModal] = useState(false);
  const [novoPac, setNovoPac] = useState({ nome:'', leito:'', convenio:'', status:'IRA', uti:'', comorbidades:[], gatilhos:[] });

  function abrirPaciente(p) {
    setPacAtual(p);
    const avs = avaliacoes[p.id] || [];
    setTab(avs.length > 0 ? 'ultima' : 'info');
    setView('paciente');
  }

  function novaAvaliacao() {
    const avs = avaliacoes[pacAtual.id] || [];
    const prev = avs[0];
    const novo = {
      id: 'av_' + Date.now(), pacienteId: pacAtual.id, data: Date.now(),
      conduta: 'conservador', prioridade: 'nao', labs: {},
      eg:'', consciencia:'', resp:'', sat:'', pam:'', volemia:'',
      ganhos:'', diurese:'', furo_tipo:'sem', furo_dose:'',
      ultima_hd_data:'', acesso:'CDL', duracao_po:'', uf_po:'',
      anticoag_hd:'sem', interc:'Nenhuma', observacoes:'',
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
      } : {})
    };
    setAvAtual(novo);
    setView('roteiro');
  }

  function salvarAvaliacao() {
    const avs = avaliacoes[pacAtual.id] || [];
    const novas = [avAtual, ...avs.filter(a => a.id !== avAtual.id)];
    setAvaliacoes({ ...avaliacoes, [pacAtual.id]: novas });
    const pacs = pacientes.map(p => p.id === pacAtual.id
      ? { ...p, ultimaAvaliacao: { conduta: avAtual.conduta, data: avAtual.data } } : p);
    setPacientes(pacs);
    setPacAtual(pacs.find(p => p.id === pacAtual.id));
    setTab('ultima');
    setView('paciente');
  }

  function salvarNovoPaciente() {
    if (!novoPac.nome.trim()) return;
    const p = { ...novoPac, id: 'p_' + Date.now(), updatedAt: Date.now() };
    setPacientes([p, ...pacientes]);
    setAvaliacoes({ ...avaliacoes, [p.id]: [] });
    setPacAtual(p);
    setNovoPac({ nome:'', leito:'', convenio:'', status:'IRA', uti:'', comorbidades:[], gatilhos:[] });
    setShowModal(false);
    setTab('info');
    setView('paciente');
  }

  function upAv(key, val) { setAvAtual(a => ({ ...a, [key]: val })); }
  function upLab(key, val) { setAvAtual(a => ({ ...a, labs: { ...a.labs, [key]: val } })); }

  const avs = pacAtual ? (avaliacoes[pacAtual.id] || []) : [];
  const ultimaAv = avs[0];

  // ── VIEWS ──
  if (view === 'lista') return (
    <div style={S.app}>
      <div style={S.header}>
        <h1 style={S.h1}>Nefrologia UTI</h1>
        <button style={S.headerBtn} onClick={() => setShowModal(true)}>+ Paciente</button>
      </div>

      <div style={{ ...S.card, marginTop: 16 }}>
        {pacientes.length === 0
          ? <div style={S.emptyState}><div style={{ fontSize: 48 }}>🏥</div><p>Nenhum paciente</p></div>
          : pacientes.map(p => (
            <div key={p.id} style={S.patientItem} onClick={() => abrirPaciente(p)}>
              <div style={{ flex: 1 }}>
                <div style={S.patientName}>{p.nome}</div>
                <div style={S.patientMeta}>
                  {p.uti && `UTI ${p.uti}`}{p.leito && ` · Leito ${p.leito}`}{p.status && ` · ${p.status}`}
                </div>
              </div>
              <Badge conduta={p.ultimaAvaliacao?.conduta} />
              <span style={{ marginLeft: 8, color: '#ccc', fontSize: 20 }}>›</span>
            </div>
          ))
        }
      </div>

      {showModal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ ...S.modalBox, maxWidth: 480, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 18, fontWeight: 700 }}>Novo Paciente</span>
              <button onClick={() => setShowModal(false)} style={{ background: '#f0f0f0', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={S.formGroup}>
              {[['Nome','nome','text'], ['Leito','leito','text'], ['Convênio','convenio','text']].map(([lbl,key,type]) => (
                <FormRow key={key} label={lbl}>
                  <input style={S.input} type={type} value={novoPac[key]} onChange={e => setNovoPac(n => ({...n, [key]: e.target.value}))} placeholder={lbl} />
                </FormRow>
              ))}
              <FormRow label="Status">
                <select style={S.select} value={novoPac.status} onChange={e => setNovoPac(n => ({...n, status: e.target.value}))}>
                  {['IRA','DRC-A','DRC-5D'].map(s => <option key={s}>{s}</option>)}
                </select>
              </FormRow>
            </div>
            <div style={S.formLabel}>UTI</div>
            <div style={{ ...S.formGroup, marginBottom: 12 }}>
              <div style={S.utiGrid}>
                {UTIs.map(u => (
                  <span key={u} style={{ ...S.utiBadge, ...(novoPac.uti === u ? { background: '#1a3a5c', color: 'white', borderColor: '#1a3a5c' } : {}) }}
                    onClick={() => setNovoPac(n => ({ ...n, uti: u }))}>{u}</span>
                ))}
              </div>
            </div>
            <div style={S.formLabel}>Comorbidades</div>
            <div style={{ ...S.formGroup, marginBottom: 12 }}>
              <div style={S.checkGrid}>
                {COMORBIDADES.map(c => (
                  <span key={c} style={{ ...S.checkItem, ...(novoPac.comorbidades.includes(c) ? { background: '#1a3a5c', color: 'white', borderColor: '#1a3a5c' } : {}) }}
                    onClick={() => setNovoPac(n => ({ ...n, comorbidades: n.comorbidades.includes(c) ? n.comorbidades.filter(x => x!==c) : [...n.comorbidades, c] }))}>{c}</span>
                ))}
              </div>
            </div>
            <div style={S.formLabel}>Causas / Gatilhos</div>
            <div style={{ ...S.formGroup, marginBottom: 16 }}>
              <div style={S.checkGrid}>
                {GATILHOS.map(g => (
                  <span key={g} style={{ ...S.checkItem, ...(novoPac.gatilhos.includes(g) ? { background: '#c0392b', color: 'white', borderColor: '#c0392b' } : {}) }}
                    onClick={() => setNovoPac(n => ({ ...n, gatilhos: n.gatilhos.includes(g) ? n.gatilhos.filter(x => x!==g) : [...n.gatilhos, g] }))}>{g}</span>
                ))}
              </div>
            </div>
            <button style={{ ...S.btn, background: '#1a3a5c', color: 'white', width: '100%' }} onClick={salvarNovoPaciente}>Cadastrar</button>
          </div>
        </div>
      )}
    </div>
  );

  if (view === 'paciente') {
    const diasHD = pacAtual.dataInicioHD ? Math.floor((Date.now() - pacAtual.dataInicioHD) / 86400000) : null;
    return (
      <div style={S.app}>
        <div style={S.header}>
          <button style={S.backBtn} onClick={() => setView('lista')}>‹</button>
          <h1 style={S.h1}>{pacAtual.nome}</h1>
          <button style={S.headerBtn} onClick={novaAvaliacao}>+ Avaliar</button>
        </div>

        <div style={S.tabs}>
          {[['info','Dados'], ['historico','Histórico'], ...(ultimaAv ? [['ultima','Última Av.']] : [])].map(([t, lbl]) => (
            <div key={t} style={{ ...S.tab, ...(tab === t ? S.tabActive : {}) }} onClick={() => setTab(t)}>{lbl}</div>
          ))}
        </div>

        {tab === 'info' && (
          <>
            <div style={S.card}>
              <div style={S.cardHeader}>Identificação</div>
              <div style={{ padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 14 }}>
                {[['UTI', pacAtual.uti], ['Leito', pacAtual.leito], ['Status', pacAtual.status], ['Convênio', pacAtual.convenio], ...(diasHD !== null ? [['D. HD', diasHD + 'd']] : [])].map(([k,v]) => (
                  <div key={k}><span style={{ color: '#888' }}>{k}:</span> <b>{v || '—'}</b></div>
                ))}
              </div>
            </div>
            {pacAtual.comorbidades?.length > 0 && (
              <div style={S.card}>
                <div style={S.cardHeader}>Comorbidades</div>
                <div style={{ padding: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {pacAtual.comorbidades.map(c => <span key={c} style={{ ...S.badge, background: '#1a3a5c' }}>{c}</span>)}
                </div>
              </div>
            )}
            {pacAtual.gatilhos?.length > 0 && (
              <div style={S.card}>
                <div style={S.cardHeader}>Causas / Gatilhos</div>
                <div style={{ padding: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {pacAtual.gatilhos.map(g => <span key={g} style={{ ...S.badge, background: '#c0392b' }}>{g}</span>)}
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'historico' && (
          <div style={S.card}>
            <div style={S.cardHeader}>Histórico</div>
            {avs.length === 0
              ? <div style={S.emptyState}><p>Sem avaliações</p></div>
              : avs.map(av => (
                <div key={av.id} style={{ padding: '12px 14px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                  onClick={() => { setAvAtual(av); setView('roteiro'); }}>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
                    {new Date(av.data).toLocaleDateString('pt-BR')} — <b>{{hd_hoje:'HD HOJE',hd_amanha:'HD AMANHÃ',conservador:'CONSERVADOR'}[av.conduta]}</b>
                  </div>
                  <div style={{ fontSize: 13, fontFamily: 'monospace' }}>
                    Ur {av.labs?.ureia_hoje||'—'} · Cr {av.labs?.creat_hoje||'—'} · K {av.labs?.pot_hoje||'—'} · Bic {av.labs?.bic_hoje||'—'}
                  </div>
                </div>
              ))}
          </div>
        )}

        {tab === 'ultima' && ultimaAv && (
          <>
            <div style={S.card}>
              <div style={S.cardHeader}>Última Avaliação — {new Date(ultimaAv.data).toLocaleDateString('pt-BR')}</div>
              <div style={{ padding: 14, fontSize: 14 }}>
                <div style={{ marginBottom: 8 }}><b>Conduta:</b> {{hd_hoje:'HD HOJE',hd_amanha:'HD AMANHÃ',conservador:'CONSERVADOR'}[ultimaAv.conduta]}</div>
                <div style={{ marginBottom: 8 }}><b>Estado:</b> {ultimaAv.eg} · {ultimaAv.consciencia}</div>
                <div style={{ marginBottom: 8 }}><b>PA:</b> {ultimaAv.pam} · SatO2: {ultimaAv.sat}%</div>
                <div style={{ marginBottom: 8 }}><b>BH:</b> Ganhos {ultimaAv.ganhos}ml · Diurese {ultimaAv.diurese}ml</div>
                <div style={{ fontFamily: 'monospace', background: '#f4f4f0', padding: 8, borderRadius: 6 }}>
                  Ur {ultimaAv.labs?.ureia_hoje||'—'} / Cr {ultimaAv.labs?.creat_hoje||'—'} / Na {ultimaAv.labs?.sodio_hoje||'—'} / K {ultimaAv.labs?.pot_hoje||'—'} / Bic {ultimaAv.labs?.bic_hoje||'—'}
                </div>
                {ultimaAv.observacoes && <div style={{ marginTop: 8, color: '#666' }}>{ultimaAv.observacoes}</div>}
              </div>
            </div>
            {ultimaAv.conduta?.startsWith('hd') && (
              <div style={{ padding: '0 16px' }}>
                <button style={{ ...S.btn, background: '#c0392b', color: 'white', width: '100%' }}
                  onClick={() => { setAvAtual(ultimaAv); setView('prescricao'); }}>📄 Gerar Prescrição HD</button>
              </div>
            )}
          </>
        )}

        <div style={{ height: 80 }} />
        <div style={S.bottomActions}>
          <button style={{ ...S.btn, background: '#f0f0f0' }} onClick={() => setView('lista')}>Voltar</button>
          <button style={{ ...S.btn, background: '#1a3a5c', color: 'white' }} onClick={novaAvaliacao}>Nova Avaliação</button>
        </div>
      </div>
    );
  }

  if (view === 'roteiro' && avAtual) {
    const potHoje = parseFloat(avAtual.labs?.pot_hoje);
    return (
      <div style={S.app}>
        <div style={S.header}>
          <button style={S.backBtn} onClick={() => setView('paciente')}>‹</button>
          <h1 style={S.h1}>{pacAtual.nome}</h1>
        </div>

        {/* PRIORIDADE */}
        <div style={{ ...S.prioBar, margin: '12px 16px 0', borderRadius: 8 }}>
          <span>⚠ PRIORIDADE</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {['sim','nao'].map(v => (
              <button key={v} onClick={() => upAv('prioridade', v)}
                style={{ padding: '4px 12px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.4)', background: avAtual.prioridade === v ? 'white' : 'transparent', color: avAtual.prioridade === v ? '#1a3a5c' : 'white', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>
                {v === 'sim' ? 'Sim' : 'Não'}
              </button>
            ))}
          </div>
        </div>

        {/* BEIRA LEITO */}
        <Section title="☐ Beira Leito">
          <FormRow label="Estado Geral">
            <select style={S.select} value={avAtual.eg} onChange={e => upAv('eg', e.target.value)}>
              <option value="">—</option>
              {['Estável','Grave','Gravíssimo'].map(v => <option key={v}>{v}</option>)}
            </select>
          </FormRow>
          <FormRow label="Consciência">
            <select style={S.select} value={avAtual.consciencia} onChange={e => upAv('consciencia', e.target.value)}>
              <option value="">—</option>
              {['Consciente e orientado','Confuso','Torporoso','Sedado','Comatoso','Agitado'].map(v => <option key={v}>{v}</option>)}
            </select>
          </FormRow>
          <FormRow label="Respiração">
            <select style={S.select} value={avAtual.resp} onChange={e => upAv('resp', e.target.value)}>
              <option value="">—</option>
              {['Eupneico em AA','Cat. Nasal','Máscara','COT/VM','TQT/VM','VNI'].map(v => <option key={v}>{v}</option>)}
            </select>
          </FormRow>
          <FormRow label="SatO2 %"><input style={S.input} type="number" value={avAtual.sat} onChange={e => upAv('sat', e.target.value)} placeholder="98" /></FormRow>
          <FormRow label="PAM mmHg"><input style={S.input} type="text" value={avAtual.pam} onChange={e => upAv('pam', e.target.value)} placeholder="85/65" /></FormRow>
          <FormRow label="Vasopressores"><input style={S.input} type="text" value={avAtual.vasopress || ''} onChange={e => upAv('vasopress', e.target.value)} placeholder="Ex: Nora 8ml/h" /></FormRow>
          <FormRow label="Nefrotóxicos">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {['Amicacina','Polimixina B','Anfotericina B'].map(n => (
                <button key={n} onClick={() => {
                  const atual = avAtual.nefrotoxicos || [];
                  upAv('nefrotoxicos', atual.includes(n) ? atual.filter(x => x !== n) : [...atual, n]);
                }} style={{ padding: '4px 8px', borderRadius: 12, border: '1.5px solid #ddd', fontSize: 12, cursor: 'pointer', background: (avAtual.nefrotoxicos||[]).includes(n) ? '#c0392b' : 'white', color: (avAtual.nefrotoxicos||[]).includes(n) ? 'white' : '#333' }}>{n}</button>
              ))}
            </div>
          </FormRow>
          <FormRow label="Volemia">
            <select style={S.select} value={avAtual.volemia} onChange={e => upAv('volemia', e.target.value)}>
              <option value="">—</option>
              {['Sem edema','Edema 1+/6+','Edema 2+/6+','Edema 3+/6+','Edema 4+/6+'].map(v => <option key={v}>{v}</option>)}
            </select>
          </FormRow>
        </Section>

        {/* BH */}
        <Section title="☐ BH & Diurético">
          <FormRow label="Ganhos ml"><input style={S.input} type="number" value={avAtual.ganhos} onChange={e => upAv('ganhos', e.target.value)} placeholder="2000" /></FormRow>
          <FormRow label="Diurese ml"><input style={S.input} type="number" value={avAtual.diurese} onChange={e => upAv('diurese', e.target.value)} placeholder="1500" /></FormRow>
          <FormRow label="Furosemida">
            <select style={S.select} value={avAtual.furo_tipo} onChange={e => upAv('furo_tipo', e.target.value)}>
              <option value="sem">Sem furosemida</option>
              <option value="amp">Ampola</option>
              <option value="cp">Comprimido</option>
            </select>
          </FormRow>
          {avAtual.furo_tipo !== 'sem' && (
            <FormRow label="Dose/intervalo"><input style={S.input} type="text" value={avAtual.furo_dose} onChange={e => upAv('furo_dose', e.target.value)} placeholder="Ex: 2 amp 12/12h" /></FormRow>
          )}
        </Section>

        {/* ÚLTIMA HD */}
        <Section title="☐ Última HD">
          <FormRow label="Data"><input style={S.input} type="date" value={avAtual.ultima_hd_data} onChange={e => upAv('ultima_hd_data', e.target.value)} /></FormRow>
          <FormRow label="Acesso">
            <select style={S.select} value={avAtual.acesso} onChange={e => upAv('acesso', e.target.value)}>
              <option>CDL</option><option>FAV</option>
            </select>
          </FormRow>
          <FormRow label="Duração P/O"><input style={S.input} type="text" value={avAtual.duracao_po} onChange={e => upAv('duracao_po', e.target.value)} placeholder="4h / 3h30" /></FormRow>
          <FormRow label="UF P/O ml"><input style={S.input} type="text" value={avAtual.uf_po} onChange={e => upAv('uf_po', e.target.value)} placeholder="2000 / 1800" /></FormRow>
          <FormRow label="Anticoag">
            <select style={S.select} value={avAtual.anticoag_hd} onChange={e => upAv('anticoag_hd', e.target.value)}>
              <option value="sem">S/hep</option><option value="com">C/hep</option><option value="fluxo">Fluxo alto</option>
            </select>
          </FormRow>
          <FormRow label="Intercorrências"><input style={S.input} type="text" value={avAtual.interc} onChange={e => upAv('interc', e.target.value)} placeholder="Nenhuma" /></FormRow>
        </Section>

        {/* LABS */}
        <div style={S.formSection}>
          <div style={S.formLabel}>☐ Laboratório (Basal / Ant. / Hoje)</div>
          <div style={S.formGroup}>
            <div style={S.labsGrid}>
              {['', 'Basal', 'Ant.', 'Hoje'].map((h,i) => (
                <div key={i} style={{ ...S.labCell, background: '#f4f4f0', fontWeight: 700, fontSize: 11, color: '#888', textAlign: 'center' }}>{h}</div>
              ))}
            </div>
            {[['Ureia','ureia','mg/dL'], ['Creatinina','creat','mg/dL'], ['Sódio','sodio','mEq/L'], ['Potássio','pot','mEq/L'], ['Bicarbonato','bic','mEq/L']].map(([lbl, key]) => (
              <div key={key} style={S.labsGrid}>
                <div style={{ ...S.labCell, fontSize: 12, color: '#666' }}>{lbl}</div>
                {['basal','ant','hoje'].map(t => (
                  <div key={t} style={{ ...S.labCell, padding: 4 }}>
                    <input type="number" step="0.1" value={avAtual.labs?.[`${key}_${t}`] || ''}
                      onChange={e => upLab(`${key}_${t}`, e.target.value)}
                      style={{ width: '100%', border: 'none', outline: 'none', fontSize: 13, textAlign: 'center', fontFamily: 'monospace', background: t === 'hoje' ? '#f4f4f0' : 'transparent' }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
          {potHoje > 5.5 && (
            <div style={S.alerta}>⚠ K+ elevado — checar: IECA, BRA, Entresto, Aldactone, Finerenona</div>
          )}
        </div>

        {/* CONDUTA */}
        <div style={S.formSection}>
          <div style={S.formLabel}>☐ Conduta / Conclusão</div>
          <div style={S.condutaRow}>
            {[['hd_hoje','HD HOJE','#c0392b'],['hd_amanha','HD AMANHÃ','#e67e22'],['conservador','CONSERVADOR','#27ae60']].map(([val, lbl, color]) => (
              <button key={val} onClick={() => upAv('conduta', val)}
                style={{ ...S.condutaBtn, ...(avAtual.conduta === val ? { background: color, color: 'white', borderColor: color } : {}) }}>{lbl}</button>
            ))}
          </div>

          {avAtual.conduta === 'hd_hoje' && (
            <div style={{ background: '#fff5f5', borderTop: '2px solid #c0392b', padding: '12px 14px', margin: '0 0 8px' }}>
              <div style={S.formGroup}>
                <FormRow label="Duração h"><input style={S.input} type="number" value={avAtual.hd_dur||''} onChange={e => upAv('hd_dur', e.target.value)} placeholder="4" /></FormRow>
                <FormRow label="UF ml"><input style={S.input} type="number" value={avAtual.hd_uf||''} onChange={e => upAv('hd_uf', e.target.value)} placeholder="2000" /></FormRow>
                <FormRow label="Anticoag">
                  <select style={S.select} value={avAtual.anticoag||'sem'} onChange={e => upAv('anticoag', e.target.value)}>
                    <option value="sem">Sem heparina</option><option value="com">Com heparina</option><option value="fluxo">Fluxo alto</option>
                  </select>
                </FormRow>
              </div>
            </div>
          )}

          <div style={S.formGroup}>
            <FormRow label="Volemia"><input style={S.input} type="text" value={avAtual.cond_volemia||''} onChange={e => upAv('cond_volemia', e.target.value)} placeholder="Ex: Restrição" /></FormRow>
            <FormRow label="Eletrólitos"><input style={S.input} type="text" value={avAtual.cond_elet||''} onChange={e => upAv('cond_elet', e.target.value)} placeholder="Ex: Repor K, Mg" /></FormRow>
            <FormRow label="Outras"><input style={S.input} type="text" value={avAtual.cond_outras||''} onChange={e => upAv('cond_outras', e.target.value)} placeholder="Ex: Sacar CDL" /></FormRow>
            <FormRow label="Nefrotóxico">
              <select style={S.select} value={avAtual.cond_nefrotox||''} onChange={e => upAv('cond_nefrotox', e.target.value)}>
                <option value="">—</option>
                <option value="suspender">Suspender</option>
                <option value="trocar">Trocar</option>
              </select>
            </FormRow>
            <FormRow label="Desfecho">
              <select style={S.select} value={avAtual.desfecho||''} onChange={e => upAv('desfecho', e.target.value)}>
                <option value="">—</option>
                <option value="rfr">Avaliar RFR</option><option value="alta">Alta</option><option value="paliativo">T. Paliativo</option><option value="obito">Óbito</option>
              </select>
            </FormRow>
          </div>

          <div style={S.formGroup}>
            <textarea value={avAtual.observacoes||''} onChange={e => upAv('observacoes', e.target.value)}
              placeholder="Observações..."
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', background: 'transparent', resize: 'none', padding: '10px 14px', minHeight: 80 }} />
          </div>
        </div>

        <div style={{ height: 80 }} />
        <div style={S.bottomActions}>
          <button style={{ ...S.btn, background: '#f0f0f0' }} onClick={() => setView('paciente')}>Cancelar</button>
          <button style={{ ...S.btn, background: '#1a3a5c', color: 'white' }} onClick={salvarAvaliacao}>Salvar</button>
          {avAtual.conduta?.startsWith('hd') && (
            <button style={{ ...S.btn, background: '#c0392b', color: 'white' }} onClick={() => { salvarAvaliacao(); setView('prescricao'); }}>Prescrição</button>
          )}
        </div>
      </div>
    );
  }

  if (view === 'prescricao' && avAtual) {
    const calcUFEf = () => (parseFloat(avAtual.uf_hd)||0) + (parseFloat(avAtual.uf_isolada)||0);
    const calcUFTot = () => calcUFEf() + (parseFloat(avAtual.priming)||0) + (parseFloat(avAtual.lavagens)||0);

    return (
      <div style={S.app}>
        <div style={S.header}>
          <button style={S.backBtn} onClick={() => setView('roteiro')}>‹</button>
          <h1 style={S.h1}>Prescrição HD</h1>
        </div>

        <Section title="Modalidade">
          <FormRow label="Tipo">
            <select style={S.select} value={avAtual.modalidade||'hd'} onChange={e => upAv('modalidade', e.target.value)}>
              {[['hd','HD'],['uf','UF isolada'],['uf_hd','UF → HD'],['hd_uf','HD → UF']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </FormRow>
          <FormRow label="Duração h"><input style={S.input} type="number" value={avAtual.hd_horas||avAtual.hd_dur||''} onChange={e => upAv('hd_horas', e.target.value)} placeholder="4" /></FormRow>
        </Section>

        <Section title="Fluxos">
          <FormRow label="Sangue ml/min"><input style={S.input} type="number" value={avAtual.fluxo_sangue||'300'} onChange={e => upAv('fluxo_sangue', e.target.value)} /></FormRow>
          <FormRow label="Banho ml/min"><input style={S.input} type="number" value={avAtual.fluxo_banho||'500'} onChange={e => upAv('fluxo_banho', e.target.value)} /></FormRow>
        </Section>

        <Section title="Perdas">
          <FormRow label="UF HD ml"><input style={S.input} type="number" value={avAtual.uf_hd||avAtual.hd_uf||''} onChange={e => upAv('uf_hd', e.target.value)} placeholder="2000" /></FormRow>
          <FormRow label="UF isolada ml"><input style={S.input} type="number" value={avAtual.uf_isolada||'0'} onChange={e => upAv('uf_isolada', e.target.value)} /></FormRow>
          <FormRow label="UF efetiva ml">
            <span style={{ fontWeight: 700, fontSize: 15 }}>{calcUFEf() || '—'}</span>
          </FormRow>
          <FormRow label="Priming ml"><input style={S.input} type="number" value={avAtual.priming||'200'} onChange={e => upAv('priming', e.target.value)} /></FormRow>
          <FormRow label="Lavagens ml"><input style={S.input} type="number" value={avAtual.lavagens||'300'} onChange={e => upAv('lavagens', e.target.value)} /></FormRow>
          <FormRow label="UF total ml">
            <span style={{ fontWeight: 700, fontSize: 15, color: '#1a3a5c' }}>{calcUFTot() || '—'}</span>
          </FormRow>
        </Section>

        <Section title="Anticoagulação">
          <FormRow label="Tipo">
            <select style={S.select} value={avAtual.anticoag||'sem'} onChange={e => upAv('anticoag', e.target.value)}>
              <option value="sem">Sem heparina</option><option value="com">Com heparina</option><option value="fluxo">Fluxo alto</option>
            </select>
          </FormRow>
          {avAtual.anticoag === 'com' && (<>
            <FormRow label="Volume ml"><input style={S.input} type="number" value={avAtual.heparina_vol||''} onChange={e => upAv('heparina_vol', e.target.value)} /></FormRow>
            <FormRow label="Bolus ml"><input style={S.input} type="number" value={avAtual.heparina_bolus||''} onChange={e => upAv('heparina_bolus', e.target.value)} /></FormRow>
            <FormRow label="Taxa ml/h"><input style={S.input} type="number" value={avAtual.heparina_taxa||''} onChange={e => upAv('heparina_taxa', e.target.value)} /></FormRow>
          </>)}
        </Section>

        <Section title="Dialisato">
          <FormRow label="Sódio mEq/l"><input style={S.input} type="number" value={avAtual.dialisato_sodio||'138'} onChange={e => upAv('dialisato_sodio', e.target.value)} /></FormRow>
          <FormRow label="Temperatura °C"><input style={S.input} type="number" value={avAtual.dialisato_temp||'37'} onChange={e => upAv('dialisato_temp', e.target.value)} /></FormRow>
          <FormRow label="Bicarbonato mEq/l"><input style={S.input} type="number" value={avAtual.dialisato_bic||'35'} onChange={e => upAv('dialisato_bic', e.target.value)} /></FormRow>
        </Section>

        <Section title="Preenchimento do Cateter">
          <FormRow label="Solução">
            <select style={S.select} value={avAtual.cateter||'bic'} onChange={e => upAv('cateter', e.target.value)}>
              <option value="fav">FAV — não preencher</option>
              <option value="bic">Bic. Na 8,4%</option>
              <option value="hep">Heparina diluída (0,5ml + 4,5ml AD ou SF)</option>
            </select>
          </FormRow>
        </Section>

        <div style={{ padding: '10px 14px', background: '#fff3cd', margin: '0 16px 12px', borderRadius: 8, fontSize: 12, fontStyle: 'italic' }}>
          ⚠ Nunca usar heparina pura para preenchimento do cateter.
        </div>

        <Section title="Rinse">
          <div style={{ padding: '10px 14px', fontSize: 13, color: '#555' }}>
            (1) Priming: SF 500ml + 0,3ml heparina.<br/>
            (2) Antes de conectar o paciente: lavar sistema com 500ml de SF sem heparina.
          </div>
        </Section>

        <Section title="PA 30/30 min">
          <div style={{ padding: '10px 14px', fontSize: 13, color: '#555' }}>
            Em caso de <strong>hipotensão</strong>: fazer 100ml SF0,9% e comunicar plantonista.
          </div>
        </Section>

        <div style={{ height: 80 }} />
        <div style={S.bottomActions}>
          <button style={{ ...S.btn, background: '#f0f0f0' }} onClick={() => setView('roteiro')}>Voltar</button>
          <button style={{ ...S.btn, background: '#27ae60', color: 'white' }}
            onClick={() => alert('No app publicado, este botão abre a janela de impressão/PDF para enviar pelo WhatsApp.\n\nNo protótipo os dados estão todos preenchidos corretamente.')}>
            📄 Gerar PDF
          </button>
        </div>
      </div>
    );
  }

  return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Carregando...</div>;
}

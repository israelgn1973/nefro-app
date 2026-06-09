// Geração de PDF da Prescrição HD usando canvas/print
const PDF = {

  gerarPrescricao(avaliacao, paciente) {
    const w = window.open('', '_blank');
    const data = avaliacao;
    const hoje = new Date().toLocaleDateString('pt-BR');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Prescrição HD - ${paciente.nome}</title>
<style>
  @page { size: A4 landscape; margin: 0.7cm; }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
  body { font-size: 9pt; }
  
  h1 { text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 4px; }
  .subtitulo { text-align: center; font-size: 9pt; margin-bottom: 6px; }
  
  table { width: 100%; border-collapse: collapse; }
  td, th { border: 1px solid #000; padding: 2px 4px; vertical-align: middle; }
  
  .header-cinza { background: #ddd; font-weight: bold; text-align: center; font-size: 8pt; }
  .secao { background: #ddd; font-weight: bold; font-size: 8pt; }
  .label { font-size: 8pt; color: #444; }
  .campo { font-size: 9pt; font-weight: bold; }
  .destaque { background: #eee; font-weight: bold; }
  .sem-hep { font-weight: bold; }
  
  .layout { display: flex; gap: 4px; }
  .col-presc { flex: 0 0 58%; }
  .col-graf { flex: 0 0 28%; }
  .col-mat { flex: 0 0 14%; }
  
  .graf-table td { padding: 1px 3px; text-align: center; font-size: 8pt; }
  .pressao-label { background: #eee; font-weight: bold; width: 28px; }
  
  .mat-item { font-size: 8pt; font-weight: bold; padding: 3px 4px; }
  .mat-item-val { font-size: 8pt; padding: 2px 4px; min-height: 14px; }
  
  .evolucao td { height: 22px; }
  
  .uti-row td { padding: 3px 5px; font-size: 8pt; text-align: center; }
  .uti-label { background: #ddd; font-weight: bold; width: 30px; }
  .uti-check { font-size: 9pt; }
  
  @media print { body { margin: 0; } }
</style>
</head>
<body>

<h1>PRESCRIÇÃO MÉDICA / HEMODIÁLISE</h1>
<p class="subtitulo">Data: ${hoje} &nbsp;&nbsp;&nbsp; Prioridade: ${data.prioridade === 'sim' ? '( X )' : '(   )'}</p>

<div class="layout">

<!-- COLUNA ESQUERDA: PRESCRIÇÃO -->
<div class="col-presc">
<table>

<!-- IDENTIFICAÇÃO -->
<tr>
  <td class="header-cinza" colspan="3">PACIENTE</td>
  <td class="header-cinza">LEITO</td>
  <td class="header-cinza" colspan="2">CONVÊNIO</td>
</tr>
<tr>
  <td colspan="3" class="campo">${paciente.nome}</td>
  <td class="campo">${paciente.leito || ''}</td>
  <td colspan="2" class="campo">${paciente.convenio || ''}</td>
</tr>

<!-- UTI -->
<tr>
  <td class="uti-label">UTI</td>
  ${['Azul','Amarela','Branca','Cinza','Laranja','Verde','Lilás','Rosa','Dourada','Prata'].map(cor => 
    `<td class="uti-check" style="text-align:center;font-size:8pt;">${paciente.uti === cor ? '(X)' : '(  )'} ${cor}</td>`
  ).join('')}
</tr>

<!-- PRESCRIÇÃO MÉDICA -->
<tr><td class="secao" colspan="6">PRESCRIÇÃO MÉDICA / HEMODIÁLISE</td></tr>

<!-- 1. TEMPO E MODALIDADE -->
<tr><td colspan="6" style="font-weight:bold;font-size:8pt;padding:2px 4px;">1. Tempo e Modalidade</td></tr>
<tr>
  <td colspan="3" class="destaque" style="font-size:8pt;">${data.modalidade === 'hd' ? '(X)' : '(  )'} <b>HD</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; horas: <b>${data.hd_horas || '___'}</b></td>
  <td colspan="3" style="font-size:8pt;">${data.modalidade === 'uf_hd' ? '(X)' : '(  )'} UF isolada ____h → HD ____h</td>
</tr>
<tr>
  <td colspan="3" style="font-size:8pt;">${data.modalidade === 'uf' ? '(X)' : '(  )'} UF isolada ____h</td>
  <td colspan="3" style="font-size:8pt;">${data.modalidade === 'hd_uf' ? '(X)' : '(  )'} HD ____h → UF isolada ____h</td>
</tr>

<!-- 2. FLUXOS -->
<tr><td colspan="6" style="font-weight:bold;font-size:8pt;padding:2px 4px;">2. Fluxos &nbsp;&nbsp; 1) Sangue: <b>${data.fluxo_sangue || '___'}</b> ml/min &nbsp;&nbsp; 2) Banho: <b>${data.fluxo_banho || '___'}</b> ml/min</td></tr>

<!-- 3. PERDAS -->
<tr><td colspan="6" style="font-weight:bold;font-size:8pt;padding:2px 4px;">3. Perdas</td></tr>
<tr>
  <td style="background:#eee;font-size:8pt;">HD: <b>${data.uf_hd || '___'}</b> ml</td>
  <td style="background:#ddd;font-size:8pt;">UF isolada: <b>${data.uf_isolada || '___'}</b> ml</td>
  <td style="background:#bbb;font-size:8pt;font-weight:bold;">UF efetiva: <b>${data.uf_efetiva || calcUF(data)}</b> ml</td>
  <td colspan="3" style="font-size:8pt;">Priming: <b>${data.priming || '___'}</b> ml &nbsp; Lavagens: <b>${data.lavagens || '___'}</b> ml</td>
</tr>
<tr><td colspan="6" style="font-size:8pt;">UF total (UF efetiva + Priming + Lavagens): <b>${calcUFTotal(data)}</b> ml</td></tr>

<!-- 4. ANTICOAGULAÇÃO -->
<tr><td colspan="6" style="font-weight:bold;font-size:8pt;padding:2px 4px;">4. Anticoagulação</td></tr>
<tr>
  <td colspan="2" style="font-size:8pt;font-weight:bold;">${data.anticoag === 'sem' ? '(X)' : '(  )'} <b>SEM HEPARINA</b></td>
  <td colspan="4" style="font-size:8pt;">${data.anticoag === 'com' ? '(X)' : '(  )'} Heparina (5000 U/ml): <b>${data.heparina_vol || '___'}</b> ml (diluir 10ml AD ou SF 0,9%)</td>
</tr>
<tr>
  <td colspan="3" style="font-size:8pt;">Bolus: <b>${data.heparina_bolus || '___'}</b> ml &nbsp;&nbsp; Taxa (restante): <b>${data.heparina_taxa || '___'}</b> ml/h</td>
  <td colspan="3" style="font-size:8pt;font-style:italic;">⚠ Nunca usar heparina pura para preenchimento do cateter.</td>
</tr>
<tr><td colspan="6" style="font-size:7.5pt;font-style:italic;">(  ) Rinse: 1000ml SF0,9% + 0,6ml heparina: recircular 10min c/ fluxo 100ml/min; enxaguar c/ 2000ml SF0,9%</td></tr>

<!-- 5. DIALISATO -->
<tr><td colspan="6" style="font-weight:bold;font-size:8pt;padding:2px 4px;">5. Dialisato</td></tr>
<tr>
  <td colspan="2" style="font-size:8pt;">Sódio: <b>${data.dialisato_sodio || '___'}</b> mEq/l</td>
  <td colspan="2" style="font-size:8pt;">Temperatura: <b>${data.dialisato_temp || '37'}</b> °C</td>
  <td colspan="2" style="font-size:8pt;">Bicarbonato: <b>${data.dialisato_bic || '___'}</b> mEq/l</td>
</tr>

<!-- 6. HIPOTENSÃO -->
<tr><td colspan="6" style="font-size:8pt;padding:2px 4px;">6. Em caso de <b>hipotensão</b>, administrar 200ml SF0,9% em bolus e comunicar plantonista.</td></tr>

<!-- 7. PREENCHIMENTO DO CATETER -->
<tr><td colspan="6" style="font-weight:bold;font-size:8pt;padding:2px 4px;">7. Preenchimento do cateter</td></tr>
<tr><td colspan="6" style="font-size:8pt;">Após a sessão, preencher o cateter com o volume exato do priming das vias com:</td></tr>
<tr>
  <td colspan="3" style="font-size:8pt;">${data.cateter === 'bic' ? '(X)' : '(  )'} Bic. Na 8,4%</td>
  <td colspan="3" style="font-size:8pt;">${data.cateter === 'salina' ? '(X)' : '(  )'} Sol. salina heparinizada (diluir 0,5ml em 4,5ml AD ou SF0,9%)</td>
</tr>

<!-- ASSINATURA -->
<tr><td colspan="6" style="font-size:8pt;height:20px;">Assinatura / CRM:</td></tr>

<!-- EVOLUÇÃO DE ENFERMAGEM -->
<tr><td class="secao" colspan="6">EVOLUÇÃO DE ENFERMAGEM</td></tr>
${Array(5).fill('<tr class="evolucao"><td colspan="6" style="height:20px;"></td></tr>').join('')}
<tr><td colspan="6" style="font-size:8pt;">Enfermeiro(a) / COREN:</td></tr>

</table>
</div>

<!-- COLUNA CENTRAL: GRÁFICO PA -->
<div class="col-graf">
<table class="graf-table">
<tr>
  <td class="header-cinza" style="width:28px;">PA</td>
  ${['1ªH','2ªH','3ªH','4ªH','5ªH','6ªH','7ªH','8ªH'].map(h => `<td class="header-cinza">${h}</td>`).join('')}
</tr>
${[300,280,260,240,220,200,180,160,140,120,100,80,60,40,20].map(p => `
<tr>
  <td class="pressao-label">${p}</td>
  ${Array(8).fill('<td style="height:16px;"></td>').join('')}
</tr>`).join('')}

<!-- CONTROLE DE VOLUME -->
<tr><td class="header-cinza" colspan="9">CONTROLE DE VOLUME</td></tr>
<tr>
  <td class="header-cinza"></td>
  ${['1ªH','2ªH','3ªH','4ªH','5ªH','6ªH','7ªH','8ªH'].map(h => `<td class="header-cinza">${h}</td>`).join('')}
</tr>
${['UF total','SF0,9% lavagens','SF0,9% hipotensão','UF efetiva','TOTAL'].map(l => `
<tr>
  <td style="font-size:7.5pt;font-weight:bold;background:#eee;">${l}</td>
  ${Array(8).fill('<td style="height:14px;"></td>').join('')}
</tr>`).join('')}
</table>
</div>

<!-- COLUNA DIREITA: MATERIAIS -->
<div class="col-mat">
<table>
<tr><td class="header-cinza">MATERIAIS / PROCEDIMENTO 24H</td></tr>
${['CAPILAR','LINHA ARTERIAL','LINHA VENOSA','S. FISIOLÓGICO','EQUIPO','HEPARINA','SERINGAS','AGULHAS','LUVAS PROCEDIMENTOS','ÁLCOOL 70%','OUTROS'].map(m => `
<tr><td class="mat-item">${m}</td></tr>
<tr><td class="mat-item-val"></td></tr>`).join('')}
</table>
</div>

</div>

<script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

    w.document.write(html);
    w.document.close();
  }
};

function calcUF(data) {
  const hd = parseFloat(data.uf_hd) || 0;
  const iso = parseFloat(data.uf_isolada) || 0;
  const total = hd + iso;
  return total > 0 ? total : '___';
}

function calcUFTotal(data) {
  const ef = parseFloat(data.uf_efetiva) || parseFloat(calcUF(data)) || 0;
  const priming = parseFloat(data.priming) || 0;
  const lav = parseFloat(data.lavagens) || 0;
  const total = ef + priming + lav;
  return total > 0 ? total : '___';
}

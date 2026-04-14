const API_URL = "https://dataguard-4cpi.onrender.com";
const TOKEN_KEY = 'dataguard_access_token';

function getAuthToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
}

function setAuthToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

function clearAuthToken() {
    localStorage.removeItem(TOKEN_KEY);
}

function buildAuthHeaders(extraHeaders = undefined) {
    const headers = new Headers(extraHeaders || {});
    const token = getAuthToken();

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
}
const $ = (id) => document.getElementById(id);
const formatarMoeda = (valor) => {
    if (valor === null || valor === undefined || isNaN(valor)) return valor;

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
};

let dicionarioAtual = {};
let currentLang = localStorage.getItem('app-lang') || 'pt';

carregarIdioma(currentLang);

// função para carregar o arquivo JSON
async function carregarIdioma(lang) {
    try {
        const res = await fetch(`idiomas/${lang}.json`);
        dicionarioAtual = await res.json();
        updateUI(); // Atualiza a tela depois de carregar as palavras
    } catch (e) {
        console.error("Erro ao carregar o idioma:", e);
    }
}

function updateUI() {
    const dict = dicionarioAtual;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            el.textContent = dict[key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) {
            el.placeholder = dict[key];
        }
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        if (dict[key]) {
            el.innerHTML = dict[key];
        }
    });

    document.querySelectorAll('[data-i18n-val]').forEach(el => {
        const key = el.getAttribute('data-i18n-val');
        if (dict[key]) {
            const valAtual = el.value.toLowerCase();
            if (valAtual === 'valor' || valAtual === 'value') {
                el.value = dict[key];
            }
        }
    });
}

const langSelectElem = $('langSelect');
if (langSelectElem) {
    langSelectElem.value = currentLang;

    langSelectElem.addEventListener('change', async (e) => {
        currentLang = e.target.value;
        localStorage.setItem('app-lang', currentLang);
        await carregarIdioma(currentLang);
        ajustarIdiomaMobile();
        atualizarBotaoTema();

        await refreshDatasets();

        if (ultimoResultadoGlobal) {
            renderResult(ultimoResultadoGlobal, true, true);
        } else {
            const dict = dicionarioAtual;
            $('resultHint').innerHTML = dict.resultHint;
            resetarResultado();
        }
    });
}

updateUI();

function showErr(msg) {
    const box = $('errBox');
    $('errText').textContent = msg;
    box.style.display = 'block';
    $('okBox').style.display = 'none';
}

function showOk(msg) {
    const box = $('okBox');
    $('okText').textContent = msg;
    box.style.display = 'block';
    $('errBox').style.display = 'none';
    $('fileNameDisplay').classList.remove('file-ready');
    $('lblDsFile').classList.remove('file-ready');
}

function clearMsg() {
    $('errBox').style.display = 'none';
    $('okBox').style.display = 'none';
}

function fmtBytes(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (!bytes && bytes !== 0) return '--';
    let i = 0; let v = bytes;
    while (v >= 1024 && i < sizes.length - 1) { v /= 1024; i++; }
    return v.toFixed(1) + ' ' + sizes[i];
}

function tempoRelativo(dataISO) {
    const data = new Date(dataISO);
    const agora = new Date();
    const diffSegundos = Math.round((agora - data) / 1000);

    // Usa a API nativa de internacionalização do JS para traduzir o tempo!
    const rtf = new Intl.RelativeTimeFormat(currentLang, { numeric: 'auto' });

    if (diffSegundos < 60) return rtf.format(-diffSegundos, 'second');

    const diffMinutos = Math.round(diffSegundos / 60);
    if (diffMinutos < 60) return rtf.format(-diffMinutos, 'minute');

    const diffHoras = Math.round(diffMinutos / 60);
    if (diffHoras < 24) return rtf.format(-diffHoras, 'hour');

    const diffDias = Math.round(diffHoras / 24);
    if (diffDias < 7) return rtf.format(-diffDias, 'day');

    return data.toLocaleDateString(currentLang, { day: '2-digit', month: 'short', year: 'numeric' });
}

function pill(html, cls) {
    return `<span class="pill ${cls}">${html}</span>`;
}

function getAnalyzeConfig() {
    return {
        method: $('method').value,
        k: Number($('k').value),
        direction: $('direction').value,
        column: $('column').value.trim() || 'valor',
        streaming: $('streaming').value === 'true',
        max_suspeitas: Number($('maxSus').value)
    };
}

// Implementa concorrência assíncrona (Non-blocking I/O) para garantir que cálculos matemáticos pesados no servidor não interrompam a thread principal da interface.
async function apiJson(url, opts = {}) {
    opts.headers = buildAuthHeaders(opts.headers);

    const res = await fetch(API_URL + url, opts);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        if (res.status === 401) {
            clearAuthToken();
            irParaDeslogado('login');
        }

        let msg = data.detail || data.erro || ('Erro HTTP ' + res.status);
        const dict = dicionarioAtual;

        if (msg.startsWith('ERR_MISSING_COLUMN|')) {
            msg = dict.errMissingCol.replace('{col}', msg.split('|')[1]);
        } else if (msg.startsWith('ERR_FEW_DATA|')) {
            msg = dict.errFewData.replace('{col}', msg.split('|')[1]);
        } else if (msg === 'ERR_FEW_DATA_STD') {
            msg = dict.errFewDataStd;
        }

        throw new Error(msg);
    }

    return data;
}
async function refreshDatasets() {
    const tbody = $('dsTbody');
    const dict = dicionarioAtual;
    tbody.innerHTML = `<tr><td colspan="5">${dict.tblLoading}</td></tr>`;

    try {
        const list = await apiJson('/datasets');
        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5">${dict.tblEmpty}</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        for (const ds of list) {
            let nomeMetodo = '';
            if (ds.last_analysis_method) {
                const mapMetodo = {
                    'sigma': dict.optSigma ? dict.optSigma.split(' (')[0] : 'Sigma',
                    'zscore': dict.optZscore ? dict.optZscore.split(' (')[0] : 'Z-score',
                    'iqr': dict.optIqr ? dict.optIqr.split(' (')[0] : 'IQR',
                    'mad': dict.optMad ? dict.optMad.split(' (')[0] : 'MAD'
                };
                nomeMetodo = mapMetodo[ds.last_analysis_method] || ds.last_analysis_method.toUpperCase();
            }

            const last = ds.last_analysis_at
                ? pill(
                    `${nomeMetodo} · ${ds.last_suspeitas_count ?? '--'} ${dict.tblSuspects}`,
                    (ds.last_suspeitas_count || 0) > 0 ? 'pill-warn' : 'pill-ok'
                )
                : pill(dict.tblNoAnalysis, 'pill-info');
            const dataObj = new Date(ds.uploaded_at);
            const dataHumanizada = tempoRelativo(ds.uploaded_at);

            const tr = document.createElement('tr');
            tr.innerHTML = `
            <td>${escapeHtml(ds.name)}</td>
            <td>${escapeHtml(ds.original_filename)}</td>
            <td>${dataHumanizada}</td>
            <td>${last}</td>
            <td>
              <div class="actions">
                <button class="btn btn-sm" data-act="analyze" data-id="${ds.id}">${dict.btnAnalyze}</button>
                <button class="btn2 btn-sm" data-act="view" data-id="${ds.id}">${dict.btnReview}</button>
                <button class="btn2 btn-sm" data-act="rename" data-id="${ds.id}">${dict.btnRename}</button>
                <button class="btn2 btn-sm" data-act="replace" data-id="${ds.id}">${dict.btnReplace}</button>
                <button class="danger btn-sm" data-act="delete" data-id="${ds.id}">${dict.btnDelete}</button>
                <input type="file" accept=".csv,.xlsx,.xls" style="display:none" data-file="${ds.id}" />
              </div>
            </td>
          `;
            tbody.appendChild(tr);
        }
    } catch (e) {
        showErr(e.message);
    }
}

function escapeHtml(s) {
    return String(s ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

let meuGrafico = null;
let ultimoResultadoGlobal = null;

// Renderiza os vetores de dados através de projeção geométrica no Canvas, otimizando o uso de memória da GPU ao plotar milhares de pontos.
function desenharGrafico(chartData) {
    const sessaoGrafico = $('sessao-grafico');
    const dict = dicionarioAtual;

    if (!chartData) {
        sessaoGrafico.style.display = 'none';
        return;
    }

    sessaoGrafico.style.display = 'block';
    const larguraIdeal = chartData.labels.length * 10;
    $('boxGrafico').style.width = larguraIdeal > window.innerWidth ? larguraIdeal + 'px' : '100%';
    const ctx = $('graficoLinha').getContext('2d');

    if (meuGrafico) {
        meuGrafico.destroy();
    }

    const rootStyles = getComputedStyle(document.body);
    const corTexto = rootStyles.getPropertyValue('--muted').trim() || '#94a3b8';
    const corLinha = rootStyles.getPropertyValue('--brand').trim() || '#6366f1';
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const corGrid = isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)';
    const gradientArea = ctx.createLinearGradient(0, 0, 0, 350);
    gradientArea.addColorStop(0, corLinha + '33');
    gradientArea.addColorStop(1, corLinha + '00');

    meuGrafico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: dict.chartAll,
                    data: chartData.values,
                    borderColor: corLinha,
                    backgroundColor: gradientArea,
                    fill: true,
                    borderWidth: 1.5,
                    pointRadius: 2,
                    tension: 0.1
                },
                {
                    label: dict.legendSuspect,
                    data: chartData.suspeitos,
                    backgroundColor: '#ef4444',
                    borderColor: '#ef4444',
                    borderWidth: 0,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointStyle: 'circle'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    filter: function (tooltipItem, index, tooltipItems) {
                        if (tooltipItems.length > 1 && tooltipItem.datasetIndex === 0) {
                            return false;
                        }
                        return true;
                    },
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';

                            if (label === dict.chartAll) {
                                label = dict.chartNormalSingle;
                            } else if (label === dict.legendSuspect) {
                                label = dict.chartSuspectSingle;
                            }

                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatarMoeda(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: corTexto },
                    grid: { color: corGrid }
                },
                y: {
                    ticks: {
                        color: corTexto,
                        // Formata os números do eixo Y
                        callback: function (value) {
                            return formatarMoeda(value);
                        }
                    },
                    grid: { color: corGrid }
                }
            }
        }
    });
}

function fecharModal() {
    $('modalGrafico').style.display = 'none';
}

function mostrarApenasTabela() {
    fecharModal();
    $('sessao-grafico').style.display = 'none';

    $('susHead').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function mostrarGrafico(chartData) {
    fecharModal();
    desenharGrafico(chartData);
    $('sessao-grafico').style.display = 'block';

    // Deixa o gráfico focável e legível
    $('boxGrafico').setAttribute('tabindex', '0');
    $('boxGrafico').setAttribute('aria-label', `Gráfico de tendência aberto na tela.`);

    setTimeout(() => {
        $('sessao-grafico').scrollIntoView({ behavior: 'smooth', block: 'start' });
        $('boxGrafico').focus(); // Joga o foco pro gráfico pra pessoa já ouvir
    }, 50);
}

function resetarResultado() {
    $('susHead').innerHTML = '';
    $('susBody').innerHTML = '';
    $('rMethod').textContent = '--';
    $('rStats').textContent = '--';
    $('rThresh').textContent = '--';
    $('rCount').textContent = '--';
    $('sessao-grafico').style.display = 'none';
    if (meuGrafico) {
        meuGrafico.destroy();
        meuGrafico = null;
    }
}

function renderResult(result, isReview = false, skipScroll = false) {
    ultimoResultadoGlobal = result;
    const dictMsg = dicionarioAtual;
    const dataObj = new Date(result.analysis_at);
    const dataFormatada = dataObj.toLocaleDateString(currentLang, {
        day: '2-digit', month: 'short', year: 'numeric'
    }) +
        ' às ' + dataObj.toLocaleTimeString(currentLang, { hour: '2-digit', minute: '2-digit' });

    const colTraduzida = dictMsg[result.column.toLowerCase()] || result.column;
    $('resultHint').textContent = `${dictMsg.analysisIn} ${dataFormatada} · ${dictMsg.columnLabel}: ${colTraduzida}`;

    const mapMetodoResultado = {
        'sigma': dictMsg.optSigma ? dictMsg.optSigma.split(' (')[0] : 'Sigma',
        'zscore': dictMsg.optZscore ? dictMsg.optZscore.split(' (')[0] : 'Z-score',
        'iqr': dictMsg.optIqr ? dictMsg.optIqr.split(' (')[0] : 'IQR',
        'mad': dictMsg.optMad ? dictMsg.optMad.split(' (')[0] : 'MAD'
    };
    $('rMethod').textContent = mapMetodoResultado[result.method] || String(result.method || '--').toUpperCase();
    $('rCount').textContent = result.quantidade_suspeitas ?? '--';
    const statsPairs = Object.entries(result.stats || {})
        .map(([k, v]) => {
            const nomeEstatistica = dictMsg['stat_' + k] || k;
            const valorFormatado = (result.column === 'valor' || result.column === 'value') && v !== null ? formatarMoeda(v) : v;
            return `${nomeEstatistica}: ${valorFormatado}`;
        })
        .join(' • ');
    $('rStats').textContent = statsPairs || '--';
    const th = result.thresholds || {};
    const dict = dicionarioAtual;

    const minFmt = (th.lower !== null && th.lower !== undefined) ? formatarMoeda(th.lower) : '--';
    const maxFmt = (th.upper !== null && th.upper !== undefined) ? formatarMoeda(th.upper) : '--';

    $('rThresh').textContent = `${dict.lower}: ${minFmt} • ${dict.upper}: ${maxFmt}`;

    const head = $('susHead');
    const body = $('susBody');
    head.innerHTML = '';
    body.innerHTML = '';

    const rows = result.suspeitas || [];
    if (rows.length === 0) {
        head.innerHTML = '<th>Resultado</th>';
        body.innerHTML = `<tr><td>Nenhuma suspeita encontrada.</td></tr>`;
    } else {
        const cols = Object.keys(rows[0]).filter(c => {
            const nomeNormalizado = c.toLowerCase().trim();
            return nomeNormalizado !== 'id' && nomeNormalizado !== 'id transação' && nomeNormalizado !== 'id_transacao';
        });
        for (const c of cols) {
            const thEl = document.createElement('th');
            thEl.textContent = dictMsg[c.toLowerCase()] || c;
            head.appendChild(thEl);
        }
        const colAlvo = result.column;
        let linhasHTML = '';
        for (const r of rows) {

            let textoLeitor = cols.map(c => `${dictMsg[c.toLowerCase()] || c}: ${r[c]}`).join('. ');

            linhasHTML += `<tr tabindex="0" aria-label="${escapeHtml(textoLeitor)}">${cols.map(c => {
                let valorTd = r[c];

                if (c === colAlvo && !isNaN(valorTd) && valorTd !== null) {
                    valorTd = formatarMoeda(valorTd);
                }
                const nomeCol = c.toLowerCase();
                if ((nomeCol === 'data' || nomeCol === 'date' || nomeCol === 'fecha') && valorTd) {
                    const dataTransacao = new Date(valorTd);
                    if (!isNaN(dataTransacao.getTime())) {
                        valorTd = dataTransacao.toLocaleDateString(currentLang, { day: '2-digit', month: 'short', year: 'numeric' });
                    }
                }

                return `<td>${escapeHtml(valorTd)}</td>`;
            }).join('')}</tr>`;
        }
        body.innerHTML = linhasHTML;
        $('rMethod').parentElement.setAttribute('tabindex', '0');
        $('rStats').parentElement.setAttribute('tabindex', '0');
        $('rThresh').parentElement.setAttribute('tabindex', '0');
        $('rCount').parentElement.setAttribute('tabindex', '0');

        $('rMethod').parentElement.setAttribute('aria-label', `${dictMsg.cardMethod}. ${$('rMethod').textContent}`);
        $('rStats').parentElement.setAttribute('aria-label', `${dictMsg.cardStats}. ${$('rStats').textContent}`);
        $('rThresh').parentElement.setAttribute('aria-label', `${dictMsg.cardLimits}. ${$('rThresh').textContent}`);
        $('rCount').parentElement.setAttribute('aria-label', `${dictMsg.cardSuspects}. Foram encontradas ${result.quantidade_suspeitas} suspeitas.`);
        body.innerHTML = linhasHTML;

        $('truncMsg').textContent = result.truncated
            ? `⚠️ A lista de suspeitas foi limitada a ${$('maxSus').value}. Total real: ${result.quantidade_suspeitas}.`
            : '';
        $('btnDownTable').style.display = result.quantidade_suspeitas > 0 ? 'block' : 'none';

        $('sessao-grafico').style.display = 'none';

        if (result.chart_data) {
            if (isReview) {
                desenharGrafico(result.chart_data);
                $('boxGrafico').setAttribute('tabindex', '0');
                $('boxGrafico').setAttribute('aria-label', `Gráfico de linha gerado. Exibindo ${result.n_valid} transações normais e ${result.quantidade_suspeitas} suspeitas destacadas em vermelho.`);

                $('sessao-grafico').style.display = 'block';
                $('sessao-grafico').style.display = 'block';
                if (!skipScroll) {
                    setTimeout(() => {
                        $('sessao-grafico').scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                }
            } else {
                const modal = $('modalGrafico');
                const msg = $('modalMsg');
                const btnSim = $('btnSimGrafico');
                const btnNao = $('btnNaoGrafico');
                const btnX = $('btnFecharX');

                const dictMsg = dicionarioAtual;
                msg.innerHTML = `${dictMsg.modalMsg1}<b style="color: var(--danger); font-size: 16px;">${result.quantidade_suspeitas}</b>${dictMsg.modalMsg2}`;

                modal.style.display = 'flex';

                btnX.onclick = () => fecharModal();
                btnNao.onclick = () => mostrarApenasTabela();
                btnSim.onclick = () => mostrarGrafico(result.chart_data);
            }
        }
    }
}

async function handleUpload() {
    const dict = dicionarioAtual;
    const file = $('dsFile').files[0];
    if (!file) {
        showErr(dict.errNoFile);
        return;
    }

    const btn = $('btnUpload');
    btn.disabled = true;
    const fd = new FormData();
    fd.append('arquivo', file);
    const name = $('dsName').value.trim();
    if (name) fd.append('name', name);

    try {
        const ds = await apiJson('/datasets', { method: 'POST', body: fd });
        showOk(`${dict.msgSaved}`);
        $('dsName').value = '';
        $('dsFile').value = '';
        $('fileNameDisplay').textContent = dict.noFileChosen;
        $('fileNameDisplay').setAttribute('data-i18n', 'noFileChosen');
        await refreshDatasets();
    } catch (e) {
        showErr(e.message);
    } finally {
        btn.disabled = false;
    }
}

async function analyze(id) {
    clearMsg();
    const cfg = getAnalyzeConfig();

    try {
        const result = await apiJson(`/datasets/${id}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cfg)
        });
        renderResult(result);
        localStorage.setItem('ultimo-dataset-id', id);
        await refreshDatasets();
    } catch (e) {
        showErr(e.message);
    }
}

async function viewLast(id, skipScroll = false) {
    clearMsg();
    try {
        const result = await apiJson(`/datasets/${id}/result`);
        localStorage.setItem('ultimo-dataset-id', id);
        renderResult(result, true, skipScroll);
    } catch (e) {
        showErr(e.message);
    }
}
async function renameDataset(id) {
    const dict = dicionarioAtual;
    abrirModalGenerico(dict.btnRename, dict.promptRename, true, "Ex: Novo Nome", '', async (newName) => {
        if (!newName) return;
        clearMsg();
        try {
            const fd = new FormData();
            fd.append('name', newName);
            await apiJson(`/datasets/${id}`, { method: 'PUT', body: fd });
            await refreshDatasets();
            showOk(dict.msgRenamed);
        } catch (e) {
            showErr(e.message);
        }
    });
}

async function replaceFile(id) {
    const input = document.querySelector(`input[data-file="${id}"]`);
    input.click();
    input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;

        const dict = dicionarioAtual;
        clearMsg();
        try {
            const fd = new FormData();
            fd.append('arquivo', file);
            await apiJson(`/datasets/${id}`, { method: 'PUT', body: fd });
            await refreshDatasets();
            showOk(dict.msgReplaced);
        } catch (e) {
            showErr(e.message);
        } finally {
            input.value = '';
        }
    };
}

async function deleteDataset(id) {
    const dict = dicionarioAtual;
    abrirModalGenerico(dict.btnDelete, dict.confirmDelete.replace('{id}', id), false, "", 'danger', async () => {
        clearMsg();
        try {
            await apiJson(`/datasets/${id}`, { method: 'DELETE' });
            await refreshDatasets();
            showOk(dict.msgDeleted);
        } catch (e) {
            showErr(e.message);
        }
    });
}
$('btnUpload').addEventListener('click', handleUpload);
$('btnCloseErr').addEventListener('click', () => $('errBox').style.display = 'none');
$('btnCloseOk').addEventListener('click', () => $('okBox').style.display = 'none');

$('method').addEventListener('change', () => {
    const m = $('method').value;
    const defaults = { sigma: 3, zscore: 3, iqr: 1.5, mad: 3.5 };
    $('k').value = defaults[m] ?? 3;
});

$('dsTbody').addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;

    const act = btn.getAttribute('data-act');
    const id = btn.getAttribute('data-id');
    if (!act || !id) return;

    if (act === 'analyze') analyze(id);
    if (act === 'view') viewLast(id);
    if (act === 'rename') renameDataset(id);
    if (act === 'replace') replaceFile(id);
    if (act === 'delete') deleteDataset(id);
});
$('dsFile').addEventListener('change', (e) => {
    const display = $('fileNameDisplay');
    const label = $('lblDsFile');

    if (e.target.files.length > 0) {
        display.textContent = e.target.files[0].name;
        display.removeAttribute('data-i18n');

        display.classList.add('file-ready');
        label.classList.add('file-ready');
    } else {
        display.setAttribute('data-i18n', 'noFileChosen');
        display.classList.remove('file-ready');
        label.classList.remove('file-ready');
        updateUI();
    }
});
// Sistema de Login e Controle de Telas
function aplicarTelaImediata() {
    const telaSalva = localStorage.getItem('currentScreen') || 'landing';
    $('landingPage').style.display = telaSalva === 'landing' ? 'flex' : 'none';
    $('loginOverlay').style.display = telaSalva === 'login' ? 'flex' : 'none';
    $('dashboardApp').style.display = telaSalva === 'dashboard' ? 'block' : 'none';
  
    if (telaSalva !== 'dashboard') {
        if ($('btnHamburger')) $('btnHamburger').style.display = 'none';
        if ($('a11yFloating')) $('a11yFloating').style.display = 'flex';
    } else {
        if ($('btnHamburger')) $('btnHamburger').style.display = 'flex';
        if ($('a11yFloating')) $('a11yFloating').style.display = 'none';
    }
    
    return telaSalva;
}
async function checkLogin() {
    const telaSalva = aplicarTelaImediata();
    const token = getAuthToken();

    if (!token) {
        irParaDeslogado(telaSalva);
        return;
    }

    let data;

    //Isolado para Autenticação (Apenas Comunicação com a API)
    try {
        const res = await fetch(API_URL + '/me', {
            headers: buildAuthHeaders()
        });

        if (!res.ok) {
            clearAuthToken();
            irParaDeslogado(telaSalva);
            return;
        }
        data = await res.json();
    } catch (e) {
        console.error("Erro na validação do token com a API:", e);
        clearAuthToken();
        irParaDeslogado(telaSalva);
        return;
    }

    // Ir para Interface (Se algo der errado aqui, NÃO desloga o usuário)
    try {
        if ($('userNameDisplay')) $('userNameDisplay').textContent = data.nome || 'Usuário';
        if ($('userEmailDisplay')) $('userEmailDisplay').textContent = data.email || '';
        if ($('userAvatar')) $('userAvatar').textContent = (data.nome || 'U').charAt(0).toUpperCase();

        if (telaSalva === 'landing') {
            $('landingPage').style.display = 'flex';
            $('loginOverlay').style.display = 'none';
            $('dashboardApp').style.display = 'none';
            if ($('btnHamburger')) $('btnHamburger').style.display = 'none';
        } else if (telaSalva === 'login') {
            $('landingPage').style.display = 'none';
            $('loginOverlay').style.display = 'flex';
            $('dashboardApp').style.display = 'none';
            if ($('btnHamburger')) $('btnHamburger').style.display = 'none';
        } else {
            localStorage.setItem('currentScreen', 'dashboard');
            $('landingPage').style.display = 'none';
            $('loginOverlay').style.display = 'none';
            $('dashboardApp').style.display = 'block';

            if ($('btnHamburger')) $('btnHamburger').style.display = 'flex';

            // Dá 250ms para o HTML "respirar" e renderizar antes de disparar o tutorial
            setTimeout(() => {
                try {
                    startTutorial(data.email);
                } catch (err) {
                    console.error("Erro isolado ao rodar o tutorial (O usuário continua logado):", err);
                }
            }, 250);

            refreshDatasets().then(() => {
                const lastId = localStorage.getItem('ultimo-dataset-id');
                if (lastId) viewLast(lastId, true);
            }).catch(e => showErr(e.message));
        }
    } catch (e) {
        console.error("Erro ao montar a interface (O usuário continua logado):", e);
    }
}

function irParaDeslogado(telaDesejada) {
    $('dashboardApp').style.display = 'none';

    // FORÇA O FECHAMENTO E OCULTAÇÃO DO MENU QUANDO DESLOGADO
    if ($('btnHamburger')) $('btnHamburger').style.display = 'none';
    if (typeof fecharSidebar === 'function') fecharSidebar();

    if (telaDesejada === 'login') {
        $('landingPage').style.display = 'none';
        $('loginOverlay').style.display = 'flex';
        localStorage.setItem('currentScreen', 'login');

        // Lembra se a pessoa estava na tela de Login ou de Cadastro!
        const formSalvo = localStorage.getItem('activeForm') || 'login';
        if (formSalvo === 'cadastro') {
            $('boxLogin').style.display = 'none';
            $('boxCadastro').style.display = 'block';
        }
    } else {
        $('loginOverlay').style.display = 'none';
        $('landingPage').style.display = 'flex';
        localStorage.setItem('currentScreen', 'landing');
    }
}
// Enviar Login
$('btnLogar').addEventListener('click', async () => {
    const identificador = $('identificadorLogin').value.trim();
    const senha = $('senhaLogin').value;

    if (!identificador || !senha) {
       mostrarToast(dicionarioAtual.errLoginEmpty || '⚠️ Preencha todos os campos.', 'danger');
        return;
    }

    const btn = $('btnLogar');
    btn.textContent = dicionarioAtual.statusChecking || 'Verificando...';
    btn.disabled = true;

    const fd = new FormData();
    fd.append('identificador', identificador);
    fd.append('senha', senha);

    try {
        const res = await fetch(API_URL + '/login', {
            method: 'POST',
            body: fd
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
            if (!data.access_token) {
                throw new Error('Token não recebido no login.');
            }

            setAuthToken(data.access_token);
            $('loginErro').style.display = 'none';
            $('senhaLogin').value = '';
            localStorage.setItem('currentScreen', 'dashboard');
            checkLogin();
        } else {
            mostrarToast('⚠️ ' + (data.detail || dicionarioAtual.errLogin || 'Erro ao entrar.'), 'danger');
        }
    } catch (e) {
       mostrarToast('⚠️ ' + (e.message || 'Erro de conexão.'), 'danger');
    }

    btn.textContent = dicionarioAtual.btnLogin || 'Entrar';
    btn.disabled = false;
});

// Alternar entre Login e Cadastro
$('btnIrCadastro').addEventListener('click', () => {
    $('boxLogin').style.display = 'none';
    $('boxCadastro').style.display = 'block';
    localStorage.setItem('activeForm', 'cadastro');
});

$('btnIrLogin').addEventListener('click', () => {
    $('boxCadastro').style.display = 'none';
    $('boxLogin').style.display = 'block';
    localStorage.setItem('activeForm', 'login');
});

// Mostrar senha no Login e cadastro
$('mostrarSenhaBtn').addEventListener('change', (e) => {
    $('senhaLogin').type = e.target.checked ? 'text' : 'password';
});

$('mostrarSenhaCadastroBtn').addEventListener('change', (e) => {
    $('senhaCadastro').type = e.target.checked ? 'text' : 'password';
});
// Enviar Cadastro
$('btnCadastrar').addEventListener('click', async () => {
    const aceiteLgpd = document.getElementById('regLgpd').checked;
    if (!aceiteLgpd) {
        mostrarToast(dicionarioAtual.errLgpd || "Você precisa aceitar os Termos de Privacidade para criar uma conta.", false, '', '', () => { });
        return;
    }
    const msgBox = $('cadastroMsg');
    const nome = $('nomeCadastro').value;
    const email = $('emailCadastro').value;
    const senha = $('senhaCadastro').value;

    const dictMsg = dicionarioAtual; // Puxa o idioma atual

    // VALIDAÇÃO DE E-MAIL
    const dominios = ['@gmail.com', '@hotmail.com', '@outlook.com'];
   if (!dominios.some(d => email.toLowerCase().endsWith(d))) {
        mostrarToast(dictMsg.errEmailFormat, 'danger');
        return;
    }

    // VALIDAÇÃO DE SENHA RIGOROSA
    const regexSenha = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
 if (!regexSenha.test(senha)) {
        mostrarToast(dictMsg.errPassFormat, 'danger');
        return;
    }

    const btn = $('btnCadastrar');
    btn.textContent = dicionarioAtual.statusCreating || 'Criando...';
    btn.disabled = true;

    const fd = new FormData();
    fd.append('nome', nome);
    fd.append('email', email);
    fd.append('senha', senha);

    try {
        const res = await fetch(API_URL + '/register', { method: 'POST', body: fd });
        const data = await res.json();

        msgBox.style.display = 'block';
        if (res.ok) {
            msgBox.style.color = 'var(--brand)';
            msgBox.textContent = data.mensagem;
            setTimeout(() => $('btnIrLogin').click(), 1500);
        } else {
           mostrarToast(data.detail || 'Erro ao cadastrar', 'danger');
        }
    } catch (e) {
mostrarToast('Erro de conexão', 'danger');
    }

    btn.textContent = 'Criar Minha Conta';
    btn.disabled = false;
});

//EXIBIÇÃO DOS TERMOS DE PRIVACIDADE (LGPD)
const linkTermos = document.getElementById('linkTermos');
if (linkTermos) {
    linkTermos.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        const termoTexto = dicionarioAtual.termsContent || "TERMOS DE PRIVACIDADE E TRATAMENTO DE DADOS (LGPD)\n\n1. Coleta de Dados: Coletamos apenas as informações estritamente necessárias para a criação da conta.\n2. Finalidade: Seus dados serão utilizados exclusivamente para autenticação, controle de acesso e validação de maioridade no sistema DataGuard.\n3. Tratamento de Arquivos: Os dados financeiros e planilhas enviados para análise são processados em memória e/ou armazenados temporariamente sob sigilo, não sendo utilizados para outros fins.\n4. Seus Direitos: Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode solicitar a exclusão da sua conta e de todos os seus dados a qualquer momento.\n\n* Este é um projeto acadêmico sem fins comerciais.";

        const modalTitle = document.getElementById('modalGenTitle');
        const modalMsg = document.getElementById('modalGenMsg');
        const modalInput = document.getElementById('modalGenInput');
        const btnCancel = document.getElementById('btnGenCancel');
        const btnConfirm = document.getElementById('btnGenConfirm');
        const overlay = document.getElementById('modalGenerico');

        if (!overlay) return;

        modalTitle.textContent = dicionarioAtual.termsTitle || 'Termos de Privacidade';
        modalMsg.innerText = termoTexto;
        modalMsg.style.textAlign = 'left';
        modalMsg.style.whiteSpace = 'pre-wrap';

        modalInput.style.display = 'none';
        btnCancel.style.display = 'none';
        btnConfirm.textContent = dicionarioAtual.btnClose || 'Fechar';

        overlay.style.display = 'flex';

        btnConfirm.onclick = function () {
            overlay.style.display = 'none';
            btnCancel.style.display = 'block';
            modalMsg.style.textAlign = 'center';
            modalMsg.style.whiteSpace = 'normal';
        };
    });
}
function mostrarToast(mensagem, tipo = 'danger') {
    // Remove um toast anterior se houver, para não empilhar
    const oldToast = document.getElementById('app-toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = `toast toast-${tipo}`;

    toast.innerHTML = `
        <span>${mensagem}</span>
        <button onclick="this.parentElement.remove()" aria-label="Fechar">&times;</button>
    `;

    document.body.appendChild(toast);

    // Auto-remover após 5 segundos
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.style.animation = window.innerWidth <= 600
                ? 'slideOutRight 0.3s forwards'
                : 'slideOutRight 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}
//LÓGICA DE SAIR
$('btnSair').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const dict = dicionarioAtual;
    if ($('userDropdown')) $('userDropdown').style.display = 'none';
    if (typeof fecharSidebar === 'function') fecharSidebar();

    abrirModalGenerico(dict.logoutTitle, dict.logoutMsg, false, "", 'danger', () => {
        const btn = $('btnSair');
        btn.textContent = dict.statusLoggingOut || 'Saindo...';

        // Dispara o logout em segundo plano
        fetch(API_URL + '/logout', {
            method: 'POST',
            headers: buildAuthHeaders()
        }).catch(() => { });

        // Limpa os dados instantaneamente e expulsa o usuário para a tela inicial
        clearAuthToken();
        localStorage.removeItem('ultimo-dataset-id');
        irParaDeslogado('landing');
        resetarResultado();

        $('dsTbody').innerHTML = `<tr><td colspan="5">Sessão encerrada.</td></tr>`;

        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> <span data-i18n="btnLogout">${dict.btnLogout || 'Sair'}</span>`;
    });
});
//ACESSIBILIDADE
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if ($('modalGrafico') && $('modalGrafico').style.display === 'flex') {
            fecharModal();
        }
    }
});
//FUNCIONALIDADES DE ACESSIBILIDADE
// Leitura Confortável
$('btnA11yLeitura').addEventListener('click', () => {
    document.body.classList.toggle('modo-leitura');
});

// Modo Daltônico
$('btnA11yDaltonico').addEventListener('click', () => {
    document.body.classList.toggle('modo-daltonico');
    if (meuGrafico) meuGrafico.update();
});

// Leitor de Tela Interativo (Navegação por Tab)
let leitorAtivo = false;

$('btnA11yAudio').addEventListener('click', () => {
    leitorAtivo = !leitorAtivo;
    const btn = $('btnA11yAudio');
    const dictMsg = dicionarioAtual;

    if (leitorAtivo) {
        // Deixa o botão pintado para mostrar que está ligado
        btn.style.background = 'var(--brand)';
        btn.style.color = 'white';
        falar(currentLang === 'pt' ? 'Leitor ativado. Navegue com a tecla Tab.' :
            currentLang === 'en' ? 'Reader activated. Navigate with Tab.' :
                'Lector activado. Navega con Tab.');
    } else {
        // Desliga o botão e cala a boca do robô
        btn.style.background = '';
        btn.style.color = '';
        window.speechSynthesis.cancel();
    }
});

// Fica "escutando" para onde o foco do teclado vai
document.addEventListener('focusin', (e) => {
    if (!leitorAtivo) return; // Só lê se o modo áudio estiver ligado

    const el = e.target;

    // Tenta descobrir o que ler: o texto escondido (aria-label), o placeholder, o valor, ou o texto do botão
    let textoParaLer = el.getAttribute('aria-label')
        || el.getAttribute('placeholder')
        || (el.tagName === 'SELECT' ? el.options[el.selectedIndex].text : '')
        || el.innerText
        || el.value;

    if (textoParaLer) {
        falar(textoParaLer.trim());
    }
});

// Função central que controla a voz e o sotaque
function falar(texto) {
    window.speechSynthesis.cancel(); // Para de falar a frase anterior
    const utterance = new SpeechSynthesisUtterance(texto);

    // Define qual idioma queremos
    let targetLang = 'pt-BR';
    if (currentLang === 'en') targetLang = 'en-US';
    if (currentLang === 'es') targetLang = 'es-ES';

    utterance.lang = targetLang;

    // FORÇA O NAVEGADOR A USAR UMA VOZ NATIVA DESSE IDIOMA
    const vozes = window.speechSynthesis.getVoices();
    if (vozes.length > 0) {
        // Procura uma voz que bata com o idioma selecionado
        const vozNativa = vozes.find(v => v.lang.replace('_', '-').startsWith(targetLang)) ||
            vozes.find(v => v.lang.replace('_', '-').startsWith(targetLang.split('-')[0]));

        if (vozNativa) {
            utterance.voice = vozNativa;
        }
    }

    window.speechSynthesis.speak(utterance);
}
if ($('btnA11yLeituraFloat')) {
    $('btnA11yLeituraFloat').addEventListener('click', () => $('btnA11yLeitura').click());
    $('btnA11yDaltonicoFloat').addEventListener('click', () => $('btnA11yDaltonico').click());
    $('btnA11yAudioFloat').addEventListener('click', () => $('btnA11yAudio').click());
}
// MENU DO USUÁRIO E ACESSIBILIDADE
const btnThemeToggle = $('btnThemeToggle');
const htmlEl = document.documentElement;
const savedTheme = localStorage.getItem('app-theme') || 'dark';

function atualizarBotaoTema() {
    if (!btnThemeToggle) return;
    const currentTheme = htmlEl.getAttribute('data-theme');
    const themeIcon = $('themeIcon');

    // Altera o ícone dependendo do tema atual
    if (currentTheme === 'light') {
        if (themeIcon) themeIcon.textContent = '🌙';
    } else {
        if (themeIcon) themeIcon.textContent = '☀️';
    }
}

function ajustarIdiomaMobile() {
    const select = $('langSelect');
    if (!select) return;

Array.from(select.options).forEach(opt => {
        if (opt.value === 'pt') opt.text = '🇧🇷 PT';
        if (opt.value === 'en') opt.text = '🇺🇸 EN';
        if (opt.value === 'es') opt.text = '🇪🇸 ES';
    });
    }
}

// Aplica o tema salvo logo que a página carrega
if (savedTheme === 'light') {
    htmlEl.setAttribute('data-theme', 'light');
} else {
    htmlEl.removeAttribute('data-theme');
}

// Ouve o clique no botão para alternar tudo
if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const currentTheme = htmlEl.getAttribute('data-theme');

        if (currentTheme === 'light') {
            htmlEl.removeAttribute('data-theme');
            localStorage.setItem('app-theme', 'dark');
        } else {
            htmlEl.setAttribute('data-theme', 'light');
            localStorage.setItem('app-theme', 'light');
        }

        atualizarBotaoTema();

        // Faz o gráfico piscar para recalcular a cor da grade
        if (typeof meuGrafico !== 'undefined' && meuGrafico) {
            meuGrafico.update();
        }
    });
}

window.addEventListener('resize', ajustarIdiomaMobile);
atualizarBotaoTema();
ajustarIdiomaMobile();
//LÓGICA DO MENU LATERAL
const btnHamburger = $('btnHamburger');
const sidebarMenu = $('sidebarMenu');
const sidebarOverlay = $('sidebarOverlay');

function fecharSidebar() {
    sidebarMenu.classList.remove('sidebar-open');
    sidebarOverlay.style.display = 'none';
}

if (btnHamburger) {
    btnHamburger.addEventListener('click', () => {
        sidebarMenu.classList.add('sidebar-open');
        sidebarOverlay.style.display = 'block';
    });
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', fecharSidebar);
}

// Lógica de Informações do Sistema
$('btnSysInfo').addEventListener('click', () => {
    fecharSidebar();

    abrirModalGenerico(

        dicionarioAtual.sysInfoTitle || "Manual do Sistema",
        dicionarioAtual.sysInfoText || "Informações do sistema.",
        false, "", "", () => { }
    );
    $('modalGenerico').querySelector('.panel').style.maxWidth = '750px';
    $('modalGenerico').querySelector('.panel').style.width = '95%';
    $('btnGenCancel').style.display = 'none';
    $('btnGenConfirm').textContent = dicionarioAtual.btnClose || 'Fechar';
});

// Lógica de Rever Tutorial
$('btnReplayTour').addEventListener('click', () => {
    fecharSidebar();
    const email = $('userEmailDisplay').textContent;
    localStorage.removeItem('tutorialVisto_' + email);
    setTimeout(() => {
        startTutorial(email);
    }, 350);
});
// DOWNLOAD DA TABELA (Converte o JSON para CSV na hora)
$('btnDownTable').addEventListener('click', () => {
    if (!ultimoResultadoGlobal || !ultimoResultadoGlobal.suspeitas) return;
    const rows = ultimoResultadoGlobal.suspeitas;
    if (rows.length === 0) return;

    const colunas = Object.keys(rows[0]);
    const cabecalho = colunas.join(',') + '\n';
    const corpo = rows.map(r => colunas.map(c => `"${r[c] || ''}"`).join(',')).join('\n');

    const blob = new Blob([cabecalho + corpo], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'analise_suspeitas.csv';
    link.click();
});

//DOWNLOAD DO GRÁFICO (Tira uma "foto" do Canvas)
$('btnDownChart').addEventListener('click', () => {
    const canvas = $('graficoLinha');
    const link = document.createElement('a');
    link.download = 'tendencia_anomalias.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});

// LÓGICA DE RECUPERAÇÃO DE SENHA
$('btnOpenReset').addEventListener('click', (e) => {
    e.preventDefault();
    $('boxLogin').style.display = 'none';
    $('boxReset').style.display = 'block';
    $('emailReset').value = '';
    $('senhaReset').value = '';
    $('resetMsg').style.display = 'none';
});

$('btnVoltarLoginReset').addEventListener('click', (e) => {
    e.preventDefault();
    $('boxReset').style.display = 'none';
    $('boxLogin').style.display = 'block';
});

// Fechar com ESC também
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('modalReset').style.display === 'flex') {
        $('modalReset').style.display = 'none';
    }
});

$('btnEnviarReset').addEventListener('click', async () => {
    const email = $('emailReset').value.trim();
    const senhaNova = $('senhaReset').value;
    const msgBox = $('resetMsg');
    const dictMsg = dicionarioAtual;

    // Validação de segurança parecida com a do cadastro
    const regexSenha = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!regexSenha.test(senhaNova)) {
        msgBox.style.display = 'block';
        msgBox.style.color = 'var(--danger)';
        msgBox.textContent = dictMsg.errPassFormat;
        return;
    }

    const btn = $('btnEnviarReset');
    btn.textContent = dictMsg.statusSaving || 'Salvando...';
    btn.disabled = true;

    const fd = new FormData();
    fd.append('email', email);
    fd.append('nova_senha', senhaNova);

    try {
        const res = await fetch(API_URL + '/reset-password', { method: 'POST', body: fd });
        const data = await res.json();

        msgBox.style.display = 'block';
        if (res.ok) {
            msgBox.style.color = 'var(--brand)';
            msgBox.textContent = data.mensagem;
            setTimeout(() => {
                $('boxReset').style.display = 'none';
                $('boxLogin').style.display = 'block';
            }, 2000);
        } else {
            msgBox.style.color = 'var(--danger)';
            msgBox.textContent = data.detail || 'Erro ao redefinir.';
        }
    } catch (e) {
        msgBox.style.display = 'block';
        msgBox.style.color = 'var(--danger)';
        msgBox.textContent = 'Erro de conexão.';
    }

    btn.textContent = dictMsg.btnReset || 'Salvar Nova Senha';
    btn.disabled = false;
});

//SISTEMA DE POP-UP GENÉRICO
function abrirModalGenerico(titulo, mensagem, isInput, placeholder, tipoBotaoConfirmar, callbackConfirmacao) {
    $('modalGenerico').querySelector('.panel').style.maxWidth = '340px';
    $('modalGenerico').querySelector('.panel').style.width = '90%';
    $('btnGenCancel').style.display = 'block';

    $('modalGenTitle').textContent = titulo;
    $('modalGenMsg').innerHTML = mensagem;

    const inputEl = $('modalGenInput');
    if (isInput) {
        inputEl.style.display = 'block';
        inputEl.value = '';
        inputEl.placeholder = placeholder || '';
        setTimeout(() => inputEl.focus(), 100);
    } else {
        inputEl.style.display = 'none';
    }

    const btnConfirm = $('btnGenConfirm');
    btnConfirm.className = 'btn';
    if (tipoBotaoConfirmar === 'danger') {
        btnConfirm.classList.add('danger');
    }

    $('modalGenerico').style.display = 'flex';

    // Truque para limpar eventos de cliques antigos clonando os botões
    const novoBtnCancel = $('btnGenCancel').cloneNode(true);
    $('btnGenCancel').replaceWith(novoBtnCancel);
    const novoBtnConfirm = btnConfirm.cloneNode(true);
    btnConfirm.replaceWith(novoBtnConfirm);

    $('btnGenCancel').addEventListener('click', () => {
        $('modalGenerico').style.display = 'none';
    });

    $('btnGenConfirm').addEventListener('click', () => {
        $('modalGenerico').style.display = 'none';
        if (isInput) {
            callbackConfirmacao($('modalGenInput').value.trim());
        } else {
            callbackConfirmacao();
        }
    });
}
// Navegação entre Landing Page e Login
$('btnAcessarLanding').addEventListener('click', () => {
    localStorage.setItem('currentScreen', 'login');
    $('landingPage').style.display = 'none';
    $('loginOverlay').style.display = 'flex';
    $('dashboardApp').style.display = 'none';
    // Código Anti-Bloqueio de Navegador
    const vid = $('bgVideo');
    if (vid) {
        vid.muted = true;
        vid.play().catch((err) => {
            console.error("O Navegador bloqueou o vídeo:", err);
        });
    }
});

// Gatilho para iniciar o tutorial com Driver.js
function startTutorial(userEmail) {
    // Trava: Se a biblioteca Driver.js (CDN) falhar em carregar, cancela sem dar erro
    if (!window.driver || !window.driver.js) {
        console.warn("Aviso: Biblioteca Driver.js não carregou a tempo.");
        return;
    }

    const storageKey = 'tutorialVisto_' + userEmail;

    if (localStorage.getItem(storageKey) === 'true') return;

    const dict = dicionarioAtual;
    const driver = window.driver.js.driver;

    const driverObj = driver({
        showProgress: true,
        nextBtnText: dict.tourNext || 'Próximo →',
        prevBtnText: dict.tourPrev || '← Anterior',
        doneBtnText: dict.tourDone || 'Mãos à obra!',
        progressText: dict.tourProgress || 'Passo {{current}} de {{total}}',

        steps: [
            { element: '#logoSistemaHeader', popover: { title: dict.tourS1Title, description: dict.tourS1Desc, side: "bottom", align: 'start' } },
            // CORREÇÃO: Apontando para o label visível (#lblDsFile) em vez do input invisível (#dsFile)
            { element: '#lblDsFile', popover: { title: dict.tourS2Title, description: dict.tourS2Desc, side: "top", align: 'start' } },
            { element: '#method', popover: { title: dict.tourS3Title, description: dict.tourS3Desc, side: "left", align: 'start' } },
            { element: '#dsTbody', popover: { title: dict.tourS4Title, description: dict.tourS4Desc, side: "top", align: 'start' } },
            { element: '#rMethod', popover: { title: dict.tourS5Title || 'Exportar Resultados 📊', description: dict.tourS5Desc || 'Assim que a análise terminar, é nesta área que aparecerão os botões para baixar a Tabela (CSV) e o Gráfico (PNG).', side: "bottom", align: 'start' } },
            { element: '#btnHamburger', popover: { title: dict.tourS9Title || 'Menu Principal ☰', description: 'Aqui você acessa seu Perfil, Acessibilidade, Tema e o Manual do Sistema. Aproveite!', side: "right", align: 'start' } }
        ],

        onDestroyStarted: () => {
            if (!driverObj.hasNextStep()) {
                driverObj.destroy();
                localStorage.setItem(storageKey, 'true');
                return;
            }

            abrirModalGenerico(
                dict.tourSkipTitle || "Sair do Tutorial",
                dict.tourSkip || "Deseja pular o tutorial e ir direto para o sistema?",
                false, "", "danger",
                () => {
                    driverObj.destroy();
                    localStorage.setItem(storageKey, 'true');
                }
            );
        }
    });

    driverObj.start();
}
// Inicializa o sistema verificando se o usuário já tem um acesso salvo
checkLogin();
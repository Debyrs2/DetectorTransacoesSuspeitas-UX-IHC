const $ = (id) => document.getElementById(id);
const formatarMoeda = (valor) => {
    if (valor === null || valor === undefined || isNaN(valor)) return valor;

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
};

const i18n = {
    pt: {
        loginTitle: "Entre na sua conta",
        loginDesc: "Identifique-se para acessar o painel.",
        showPass: "Ver senha",
        btnEnter: "Entrar no Sistema",
        btnGoRegister: "Não tem conta? Cadastre-se",
        errLogin: "Credenciais incorretas.",
        regTitle: "Criar Conta",
        regDesc: "Preencha seus dados para começar.",
        btnRegister: "Criar Minha Conta",
        btnGoLogin: "Já tem conta? Entrar",
        rulePass: "A senha deve ter no mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo especial (ex: *).",
        phUserOrEmail: "E-mail ou Nome de Usuário",
        phPassword: "Senha",
        phName: "Seu Nome",
        phEmail: "Seu E-mail",
        phCreatePassword: "Crie uma Senha",
        errEmailFormat: "⚠️ Entre com um email válido (@gmail.com, @hotmail.com ou @outlook.com).",
        errPassFormat: "⚠️ A senha não cumpre os requisitos de segurança.",
        forgotPass: "Esqueceu a senha?",
        resetTitle: "Recuperar Senha",
        resetDesc: "Ambiente de teste: digite seu e-mail cadastrado e a nova senha diretamente abaixo.",
        btnReset: "Salvar Nova Senha",
        title: "Detecção de Transações Suspeitas",
        themeLight: "Tema Claro",
        themeDark: "Tema Escuro",
        btnLogout: "Sair",
        dirUpper: "Apenas gastos muito altos",
        dirLower: "Apenas gastos muito baixos",
        dirBoth: "Qualquer anomalia (Altos ou Baixos)",
        lower: "Mínimo esperado",
        upper: "Máximo esperado",
        secUpload: "Enviar Arquivo",
        secConfig: "Configuração da Análise",
        secDatabase: "Base de dados",
        secResult: "Resultado da Análise",
        secChart: "Gráfico de Tendência e Anomalias",
        labelName: "Nome da base de dados (opcional)",
        labelFile: "Arquivo (.csv, .xlsx, .xls)",
        btnUpload: "Salvar base de dados",
        labelMethod: "Método",
        labelDirection: "O que procurar?",
        labelColumn: "Coluna",
        labelStreaming: "Modo Arquivos Pesados (CSV)",
        labelMaxSus: "Máx. suspeitas",
        placeholderName: "Ex.: Semana 02 - Pagamentos",
        hintUpload: "Dica: a coluna padrão é <b>valor</b> (você pode trocar em “Coluna”).",
        hintBatch: "Dica: Ative para evitar travamentos ao analisar planilhas gigantes.",
        resultHint: "Selecione <b>Analisar</b> em alguma base de dados.",
        chartSubtitle: "Os pontos a vermelho destacam os valores considerados suspeitos.",
        legendNormal: "Transações Normais",
        legendSuspect: "Transações Suspeitas",
        modalTitle: "Análise Concluída! 🚀",
        btnTableOnly: "Apenas Tabela",
        btnViewChart: "📉 Ver Gráfico",
        chartAll: "Todos os Valores",
        chartNormalSingle: "Transação Normal",
        chartSuspectSingle: "Transação Suspeita",
        modalMsg1: "Foram encontradas ",
        modalMsg2: " transações suspeitas.<br><br>Deseja visualizar o gráfico de tendência agora?",
        thID: "ID",
        thName: "Nome",
        thFile: "Arquivo",
        thSize: "Tamanho",
        thDate: "Data de Envio",
        thLast: "Última análise",
        thActions: "Ações",
        analysisIn: "Análise em",
        columnLabel: "coluna",
        btnDownTable: "Baixar Tabela (CSV)",
        btnDownChart: "Baixar Gráfico (PNG)",
        menuProfile: "Meu Perfil",
        "data": "data",
        "id transação": "id transação",
        "nome": "nome",
        "categoria": "categoria",
        "estabelecimento": "estabelecimento",
        "método de pagamento": "método de pagamento",
        "cidade/uf": "cidade/uf",
        "valor": "valor",
        btnClose: "Fechar",
        btnAnalyze: "Analisar",
        btnReview: "Rever análise",
        btnRename: "Renomear",
        btnReplace: "Substituir",
        btnDelete: "Excluir",
        tblLoading: "Carregando...",
        tblEmpty: "Nenhum dataset salvo ainda.",
        tblNoAnalysis: "sem análise",
        tblSuspects: "suspeitas",
        cardMethod: "Método",
        cardStats: "Estatísticas",
        cardLimits: "Limites",
        cardSuspects: "Suspeitas",
        stat_mean: "Média de gastos",
        stat_std: "Variação comum",
        stat_median: "Valor central",
        btnBrowse: "Procurar...",
        noFileChosen: "Nenhum arquivo selecionado.",
        optNo: "Não",
        optYesBatch: "Sim (média/desvio)",
        defColumn: "valor",
        footerText: "Detecção de Transações Suspeitas - Por",
        errMissingCol: "A planilha precisa ter uma coluna chamada '{col}'.",
        errFewData: "Poucos dados na coluna '{col}' para calcular estatísticas.",
        errFewDataStd: "Poucos dados na coluna para calcular desvio padrão.",
        promptRename: "Novo nome do dataset:",
        confirmDelete: "Tem certeza que deseja excluir esta base de dados?",
        msgRenamed: "Nome atualizado.",
        msgReplaced: "Arquivo substituído. (Resultado anterior limpo)",
        msgDeleted: "Dataset excluído.",
        msgSaved: "Dataset salvo:",
        errNoFile: "Escolha um arquivo.",
        optSigma: "Análise Padrão (Recomendado)",
        optZscore: "Análise Direta (Z-score)",
        optIqr: "Análise por Faixa Esperada",
        optMad: "Análise Rigorosa",
    },
    en: {
        loginTitle: "Login to your account",
        loginDesc: "Identify yourself to access the dashboard.",
        showPass: "Show password",
        btnEnter: "Enter System",
        btnGoRegister: "No account? Register",
        errLogin: "Invalid credentials.",
        regTitle: "Create Account",
        regDesc: "Fill in your details to start.",
        btnRegister: "Create My Account",
        btnGoLogin: "Already have an account? Login",
        rulePass: "Password must have at least 8 characters, with uppercase, lowercase, number, and special symbol.",
        phUserOrEmail: "E-mail or Username",
        phPassword: "Password",
        phName: "Your Name",
        phEmail: "Your E-mail",
        phCreatePassword: "Create a Password",
        errEmailFormat: "⚠️ Enter a valid email (@gmail.com, @hotmail.com, or @outlook.com).",
        errPassFormat: "⚠️ Password does not meet security requirements.",
        forgotPass: "Forgot password?",
        resetTitle: "Recover Password",
        resetDesc: "Test environment: enter your registered e-mail and the new password directly below.",
        btnReset: "Save New Password",
        title: "Suspicious Transaction Detection",
        themeLight: "Light Theme",
        themeDark: "Dark Theme",
        btnLogout: "Logout",
        dirUpper: "Only very high spending",
        dirLower: "Only very low spending",
        dirBoth: "Any anomaly (High or Low)",
        lower: "Expected minimum",
        upper: "Maximum expected",
        secUpload: "Upload File",
        secConfig: "Analysis Configuration",
        secDatabase: "Database",
        secResult: "Analysis Result",
        secChart: "Trend and Anomalies Chart",
        labelName: "Dataset name (optional)",
        labelFile: "File (.csv, .xlsx, .xls)",
        btnUpload: "Save dataset",
        labelMethod: "Method",
        labelDirection: "What to look for?",
        labelColumn: "Column",
        labelStreaming: "Heavy Files Mode (CSV)",
        labelMaxSus: "Max. suspects",
        placeholderName: "e.g., Week 02 - Payments",
        hintUpload: "Tip: the default column is <b>value</b> (you can change it under “Column”).",
        hintBatch: "Tip: Enable to avoid crashes when analyzing large spreadsheets.",
        resultHint: "Select <b>Analyze</b> in a database.",
        chartSubtitle: "Red dots highlight values considered suspicious.",
        legendNormal: "Normal Transactions",
        legendSuspect: "Suspicious Transactions",
        modalTitle: "Analysis Completed! 🚀",
        btnTableOnly: "Table Only",
        btnViewChart: "📉 View Chart",
        chartAll: "All Values",
        chartNormalSingle: "Normal Transaction",
        chartSuspectSingle: "Suspicious Transaction",
        modalMsg1: "Found ",
        modalMsg2: " suspicious transactions.<br><br>Would you like to view the trend chart now?",
        thID: "ID",
        thName: "Name",
        thFile: "File",
        thSize: "Size",
        thDate: "Upload Date",
        thLast: "Last Analysis",
        thActions: "Actions",
        analysisIn: "Analyzed on",
        columnLabel: "column",
        btnDownTable: "Download Table (CSV)",
        btnDownChart: "Download Chart (PNG)",
        menuProfile: "My Profile",
        "data": "date",
        "id transação": "transaction id",
        "nome": "name",
        "categoria": "category",
        "estabelecimento": "establishment",
        "método de pagamento": "payment method",
        "cidade/uf": "city/state",
        "valor": "value",
        btnClose: "Close",
        btnAnalyze: "Analyze",
        btnReview: "Review analysis",
        btnRename: "Rename",
        btnReplace: "Replace",
        btnDelete: "Delete",
        tblLoading: "Loading...",
        tblEmpty: "No dataset saved yet.",
        tblNoAnalysis: "no analysis",
        tblSuspects: "suspects",
        cardMethod: "Method",
        cardStats: "Statistics",
        cardLimits: "Limits",
        cardSuspects: "Suspects",
        stat_mean: "Average spending",
        stat_std: "Common variation",
        stat_median: "Central value",
        btnBrowse: "Browse...",
        noFileChosen: "No file chosen.",
        optNo: "No",
        optYesBatch: "Yes (mean/std)",
        defColumn: "value",
        footerText: "Suspicious Transaction Detection - By",
        errMissingCol: "The spreadsheet must have a column named '{col}'.",
        errFewData: "Not enough data in column '{col}' to calculate statistics.",
        errFewDataStd: "Not enough data to calculate standard deviation.",
        promptRename: "New dataset name:",
        confirmDelete: "Are you sure you want to delete this database?",
        msgRenamed: "Name updated.",
        msgReplaced: "File replaced. (Previous result cleared)",
        msgDeleted: "Dataset deleted.",
        msgSaved: "Dataset saved:",
        errNoFile: "Please choose a file.",
        optSigma: "Standard Analysis",
        optZscore: "Direct Analysis",
        optIqr: "Expected Range Analysis",
        optMad: "Strict Analysis",
    },
    es: {
        loginTitle: "Inicia sesión",
        loginDesc: "Identifícate para acceder al sistema.",
        showPass: "Mostrar contraseña",
        btnEnter: "Ingresar al Sistema",
        btnGoRegister: "¿No tienes cuenta? Regístrate",
        errLogin: "Credenciales incorrectas.",
        regTitle: "Crear Cuenta",
        regDesc: "Ingresa tus datos para comenzar.",
        btnRegister: "Crear Mi Cuenta",
        btnGoLogin: "¿Ya tienes cuenta? Inicia sesión",
        rulePass: "La contraseña debe tener al menos 8 caracteres, incluir mayúscula, minúscula, número y un símbolo (ej: *).",
        errEmailFormat: "⚠️ Ingresa un correo válido (@gmail.com, @hotmail.com o @outlook.com).",
        errPassFormat: "⚠️ La contraseña no cumple con los requisitos de seguridad.",
        forgotPass: "¿Olvidaste tu contraseña?",
        resetTitle: "Recuperar Contraseña",
        resetDesc: "Entorno de prueba: ingresa tu correo registrado y la nueva contraseña directamente abajo.",
        btnReset: "Guardar Nueva Contraseña",
        title: "Detección de Transacciones Sospechosas",
        themeLight: "Tema Claro",
        themeDark: "Tema Oscuro",
        btnLogout: "Salir",
        dirUpper: "Solo gastos excesivamente altos",
        dirLower: "Solo gastos inusualmente bajos",
        dirBoth: "Cualquier anomalía (Altos o Bajos)",
        lower: "Mínimo esperado",
        upper: "Máximo esperado",
        secUpload: "Subir Archivo",
        secConfig: "Configuración del Análisis",
        secDatabase: "Base de Datos",
        secResult: "Resultados del Análisis",
        secChart: "Gráfico de Tendencias y Anomalías",
        labelName: "Nombre del conjunto de datos (opcional)",
        labelFile: "Archivo (.csv, .xlsx, .xls)",
        btnUpload: "Guardar base de datos",
        labelMethod: "Método de cálculo",
        labelDirection: "¿Qué buscar?",
        labelColumn: "Columna a analizar",
        labelStreaming: "Modo para archivos pesados (CSV)",
        labelMaxSus: "Límite de sospechas",
        placeholderName: "Ej.: Semana 02 - Pagos",
        hintUpload: "Consejo: la columna por defecto es <b>valor</b> (puedes cambiarla en “Columna a analizar”).",
        hintBatch: "Consejo: Actívalo para evitar bloqueos al analizar hojas de cálculo gigantes.",
        resultHint: "Selecciona <b>Analizar</b> en alguna base de datos.",
        chartSubtitle: "Los puntos rojos resaltan los valores considerados sospechosos.",
        legendNormal: "Transacciones Normales",
        legendSuspect: "Transacciones Sospechosas",
        modalTitle: "¡Análisis Completado! 🚀",
        btnTableOnly: "Ver solo la tabla",
        btnViewChart: "📉 Ver el Gráfico",
        chartAll: "Todos los valores",
        chartNormalSingle: "Transacción Normal",
        chartSuspectSingle: "Transacción Sospechosa",
        modalMsg1: "Se encontraron ",
        modalMsg2: " transacciones sospechosas.<br><br>¿Deseas ver el gráfico de tendencias ahora?",
        thID: "ID",
        thName: "Nombre",
        thFile: "Archivo",
        thSize: "Tamaño",
        thDate: "Fecha de Subida",
        thLast: "Último Análisis",
        thActions: "Acciones",
        analysisIn: "Analizado el",
        columnLabel: "columna",
        btnDownTable: "Descargar Tabla (CSV)",
        btnDownChart: "Descargar Gráfico (PNG)",
        menuProfile: "Mi Perfil",
        "data": "fecha",
        "id transação": "id de transacción",
        "nome": "nombre",
        "categoria": "categoría",
        "estabelecimento": "establecimiento",
        "método de pagamento": "método de pago",
        "cidade/uf": "ciudad/estado",
        "valor": "valor",
        btnClose: "Cerrar",
        btnAnalyze: "Analizar",
        btnReview: "Revisar análisis",
        btnRename: "Renombrar",
        btnReplace: "Reemplazar",
        btnDelete: "Eliminar",
        tblLoading: "Cargando...",
        tblEmpty: "Aún no hay datos guardados.",
        tblNoAnalysis: "sin analizar",
        tblSuspects: "sospechas",
        cardMethod: "Método usado",
        cardStats: "Estadísticas",
        cardLimits: "Límites calculados",
        cardSuspects: "Total Sospechosas",
        stat_mean: "Gasto promedio",
        stat_std: "Variación común",
        stat_median: "Valor central",
        btnBrowse: "Examinar...",
        noFileChosen: "Ningún archivo seleccionado.",
        optNo: "No",
        optYesBatch: "Sí (media/desviación)",
        defColumn: "valor",
        footerText: "Detección de Transacciones Sospechosas - Por",
        errMissingCol: "La hoja de cálculo debe tener una columna llamada '{col}'.",
        errFewData: "No hay suficientes datos en la columna '{col}' para calcular estadísticas.",
        errFewDataStd: "No hay suficientes datos para calcular la desviación estándar.",
        promptRename: "Nuevo nombre del archivo:",
        confirmDelete: "¿Estás seguro de que deseas eliminar esta base de datos?",
        msgRenamed: "Nombre actualizado.",
        msgReplaced: "Archivo reemplazado. (Resultados anteriores borrados)",
        msgDeleted: "Archivo eliminado.",
        msgSaved: "Archivo guardado exitosamente:",
        errNoFile: "Por favor, elige un archivo.",
        optSigma: "Análisis Estándar (Recomendado)",
        optZscore: "Análisis Directo (Z-score)",
        optIqr: "Análisis por Rango Esperado",
        optMad: "Análisis Riguroso",
        phUserOrEmail: "Correo o Usuario",
        phPassword: "Contraseña",
        phName: "Tu Nombre",
        phEmail: "Tu Correo",
        phCreatePassword: "Crea una Contraseña",
    },
};

let currentLang = localStorage.getItem('app-lang') || 'pt';

function updateUI() {
    const dict = i18n[currentLang] || i18n['pt'];
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
        updateUI();

        await refreshDatasets();

        if (ultimoResultadoGlobal) {
            renderResult(ultimoResultadoGlobal, true, true);
        } else {
            const dict = i18n[currentLang] || i18n['pt'];
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
    const res = await fetch(url, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        let msg = data.detail || data.erro || ('Erro HTTP ' + res.status);
        const dict = i18n[currentLang] || i18n['pt'];
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
    const dict = i18n[currentLang] || i18n['pt'];
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
    const dict = i18n[currentLang] || i18n['pt'];

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
    const dictMsg = i18n[currentLang] || i18n['pt'];
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
    const dict = i18n[currentLang] || i18n['pt'];

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

                const dictMsg = i18n[currentLang] || i18n['pt'];
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
    const dict = i18n[currentLang] || i18n['pt'];
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
    const dict = i18n[currentLang] || i18n['pt'];
    const newName = prompt(dict.promptRename);
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
}

async function replaceFile(id) {
    const input = document.querySelector(`input[data-file="${id}"]`);
    input.click();
    input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;

        const dict = i18n[currentLang] || i18n['pt'];
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
    const dict = i18n[currentLang] || i18n['pt'];
    if (!confirm(dict.confirmDelete.replace('{id}', id))) return;

    clearMsg();
    try {
        await apiJson(`/datasets/${id}`, { method: 'DELETE' });
        await refreshDatasets();
        showOk(dict.msgDeleted);
    } catch (e) {
        showErr(e.message);
    }
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

const btnThemeToggle = $('btnThemeToggle');
const themeIcon = $('themeIcon');
const htmlEl = document.documentElement;

const savedTheme = localStorage.getItem('app-theme') || 'dark';

// Verifica o tema inicial e ajusta a etiqueta de tradução
if (savedTheme === 'light') {
    htmlEl.setAttribute('data-theme', 'light');
    $('themeIcon').textContent = '🌙';
    $('themeText').setAttribute('data-i18n', 'themeDark');
    updateUI(); // Chama a tradução para ajustar o texto na hora
}

btnThemeToggle.addEventListener('click', () => {
    const currentTheme = htmlEl.getAttribute('data-theme');
    if (currentTheme === 'light') {
        htmlEl.removeAttribute('data-theme');
        localStorage.setItem('app-theme', 'dark');
        $('themeIcon').textContent = '☀️';
        $('themeText').setAttribute('data-i18n', 'themeLight');
    } else {
        htmlEl.setAttribute('data-theme', 'light');
        localStorage.setItem('app-theme', 'light');
        $('themeIcon').textContent = '🌙';
        $('themeText').setAttribute('data-i18n', 'themeDark');
    }

    updateUI();

    if (meuGrafico) {
        meuGrafico.update();
    }
});
$('dsFile').addEventListener('change', (e) => {
    const display = $('fileNameDisplay');
    if (e.target.files.length > 0) {
        display.textContent = e.target.files[0].name;
        display.removeAttribute('data-i18n');
    } else {
        display.setAttribute('data-i18n', 'noFileChosen');
        updateUI();
    }
});
//Sistema de Login
async function checkLogin() {
    try {
        const res = await fetch('/me');
        if (res.ok) {
            const data = await res.json();
            $('loginOverlay').style.display = 'none';
            $('userMenuContainer').style.display = 'block';
            $('userNameDisplay').textContent = data.nome;
            $('userEmailDisplay').textContent = data.email;
            $('dropdownEmail').textContent = data.email;
            $('userAvatar').textContent = data.nome.charAt(0).toUpperCase();

            refreshDatasets().then(() => {
                const lastId = localStorage.getItem('ultimo-dataset-id');
                if (lastId) {
                    viewLast(lastId, true);
                }
            }).catch(e => showErr(e.message));
        } else {
            $('loginOverlay').style.display = 'flex';
            $('btnSair').style.display = 'none';
        }
    } catch (e) {
        $('loginOverlay').style.display = 'flex';
    }
}

// Enviar Login
$('btnLogar').addEventListener('click', async () => {
    const identificador = $('identificadorLogin').value.trim();
    const senha = $('senhaLogin').value;

    if (!identificador || !senha) {
        $('loginErro').style.display = 'block';
        $('loginErro').innerHTML = '⚠️ Preencha todos os campos.';
        return;
    }

    const btn = $('btnLogar');
    btn.textContent = 'Verificando...';
    btn.disabled = true;

    const fd = new FormData();
    fd.append('identificador', identificador);
    fd.append('senha', senha);

    try {
        const res = await fetch('/login', { method: 'POST', body: fd });
        const data = await res.json();

        if (res.ok) {
            $('loginErro').style.display = 'none';
            $('senhaLogin').value = '';
            checkLogin();
        } else {
            $('loginErro').style.display = 'block';
            $('loginErro').innerHTML = '⚠️ ' + (data.detail || 'Erro ao entrar.');
        }
    } catch (e) {
        $('loginErro').style.display = 'block';
        $('loginErro').innerHTML = '⚠️ Erro de conexão.';
    }

    btn.textContent = 'Entrar no Sistema';
    btn.disabled = false;
});

// Alternar entre Login e Cadastro
$('btnIrCadastro').addEventListener('click', () => {
    $('boxLogin').style.display = 'none';
    $('boxCadastro').style.display = 'block';
});

$('btnIrLogin').addEventListener('click', () => {
    $('boxCadastro').style.display = 'none';
    $('boxLogin').style.display = 'block';
});

// Mostrar senha SÓ no Login
$('mostrarSenhaBtn').addEventListener('change', (e) => {
    $('senhaLogin').type = e.target.checked ? 'text' : 'password';
});

// Mostrar senha SÓ no Cadastro
$('mostrarSenhaCadastroBtn').addEventListener('change', (e) => {
    $('senhaCadastro').type = e.target.checked ? 'text' : 'password';
});
// Enviar Cadastro
$('btnCadastrar').addEventListener('click', async () => {
    const msgBox = $('cadastroMsg');
    const nome = $('nomeCadastro').value;
    const email = $('emailCadastro').value;
    const senha = $('senhaCadastro').value;

    const dictMsg = i18n[currentLang] || i18n['pt']; // Puxa o idioma atual

    // --- VALIDAÇÃO DE E-MAIL ---
    const dominios = ['@gmail.com', '@hotmail.com', '@outlook.com'];
    if (!dominios.some(d => email.toLowerCase().endsWith(d))) {
        msgBox.style.display = 'block';
        msgBox.style.color = 'var(--danger)';
        msgBox.textContent = dictMsg.errEmailFormat;
        return;
    }

    // --- VALIDAÇÃO DE SENHA RIGOROSA ---
    const regexSenha = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!regexSenha.test(senha)) {
        msgBox.style.display = 'block';
        msgBox.style.color = 'var(--danger)';
        msgBox.textContent = dictMsg.errPassFormat;
        return;
    }

    const btn = $('btnCadastrar');
    btn.textContent = 'Criando...';
    btn.disabled = true;

    const fd = new FormData();
    fd.append('nome', nome);
    fd.append('email', email);
    fd.append('senha', senha);

    try {
        const res = await fetch('/register', { method: 'POST', body: fd });
        const data = await res.json();

        msgBox.style.display = 'block';
        if (res.ok) {
            msgBox.style.color = 'var(--brand)';
            msgBox.textContent = data.mensagem;
            setTimeout(() => $('btnIrLogin').click(), 1500);
        } else {
            msgBox.style.color = 'var(--danger)';
            msgBox.textContent = data.detail || 'Erro ao cadastrar';
        }
    } catch (e) {
        msgBox.style.color = 'var(--danger)';
        msgBox.textContent = 'Erro de conexão';
    }

    btn.textContent = 'Criar Minha Conta';
    btn.disabled = false;
});

// --- LÓGICA DE SAIR (LOGOUT) ---
$('btnSair').addEventListener('click', async () => {
    try {
        await fetch('/logout', { method: 'POST' });
        localStorage.removeItem('ultimo-dataset-id');
        location.reload();
    } catch (e) {
        console.error("Erro ao sair", e);
    }
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
    const dictMsg = i18n[currentLang] || i18n['pt'];

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
// MENU DO USUÁRIO
$('userProfile').addEventListener('click', (e) => {
    e.stopPropagation(); // Evita fechar na mesma hora
    const drop = $('userDropdown');
    drop.style.display = drop.style.display === 'none' ? 'flex' : 'none';
});

// Fecha o menu se clicar em qualquer outro lugar da tela
document.addEventListener('click', () => {
    if ($('userDropdown')) $('userDropdown').style.display = 'none';
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
    $('modalReset').style.display = 'flex';
    $('emailReset').value = '';
    $('senhaReset').value = '';
    $('resetMsg').style.display = 'none';
});

$('btnFecharReset').addEventListener('click', () => {
    $('modalReset').style.display = 'none';
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
    const dictMsg = i18n[currentLang] || i18n['pt'];

    // Validação de segurança parecida com a do cadastro
    const regexSenha = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!regexSenha.test(senhaNova)) {
        msgBox.style.display = 'block';
        msgBox.style.color = 'var(--danger)';
        msgBox.textContent = dictMsg.errPassFormat;
        return;
    }

    const btn = $('btnEnviarReset');
    btn.textContent = 'Salvando...';
    btn.disabled = true;

    const fd = new FormData();
    fd.append('email', email);
    fd.append('nova_senha', senhaNova);

    try {
        const res = await fetch('/reset-password', { method: 'POST', body: fd });
        const data = await res.json();

        msgBox.style.display = 'block';
        if (res.ok) {
            msgBox.style.color = 'var(--brand)';
            msgBox.textContent = data.mensagem;
            setTimeout(() => {
                $('modalReset').style.display = 'none';
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
// Inicializa o sistema verificando se o usuário já tem um acesso salvo
checkLogin();
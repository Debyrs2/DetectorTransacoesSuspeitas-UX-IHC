from __future__ import annotations

import base64
import hashlib
import hmac
import os
import io
import json
import math
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Tuple
import re

import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Request, Response, Depends
from supabase import create_client, Client
from fastapi.responses import JSONResponse
from fastapi import Request
import traceback
import pdfplumber
import storage

APP_DIR = Path(__file__).resolve().parent
#INDEX_HTML = APP_DIR.parent "index.html"

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

app = FastAPI(title="Detecção de Transações Suspeitas")
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print("🔥 ERRO FATAL CAPTURADO:")
    traceback.print_exc() 
    
    return JSONResponse(
        status_code=500,
        content={"detail": f"Erro interno revelado: {str(exc)}"},
        headers={"Access-Control-Allow-Origin": "*"} 
    )

# Sistema de Login com bd
SUPABASE_URL = "https://qhmxiezjzodhrduxfjlo.supabase.co"
SUPABASE_KEY = "sb_publishable_7HfOvVPG_Rl1Hu7A1QLrBQ_pH2ND2bb"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

SECRET_KEY = os.getenv("APP_SECRET_KEY", "troque-esta-chave-no-render")
TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 dias
 
def _load_users() -> Dict[str, Any]:
    # Busca todos os usuários na tabela 'users'
    response = supabase.table("users").select("*").execute()
    # Converte o formato de lista do banco para o dicionário que seu código já usa
    return {u['email']: {"nome": u['nome'], "senha": u['senha']} for u in response.data}

def _write_users(users_data: Dict[str, Any]) -> None:
    # Como o registro agora é individual, o ideal é usar o método de registro abaixo
    pass

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def gerar_token(email: str) -> str:
    payload = {
        "sub": email.strip().lower(),
        "exp": int(time.time()) + TOKEN_TTL_SECONDS
    }
    payload_b64 = _b64url_encode(
        json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    )
    assinatura = hmac.new(
        SECRET_KEY.encode("utf-8"),
        payload_b64.encode("utf-8"),
        hashlib.sha256
    ).digest()

    return f"{payload_b64}.{_b64url_encode(assinatura)}"


def validar_token(token: str) -> str:
    try:
        payload_b64, assinatura_b64 = token.split(".", 1)
        assinatura_recebida = _b64url_decode(assinatura_b64)
    except Exception:
        raise HTTPException (status_code=401, detail="errInvalidToken")

    assinatura_esperada = hmac.new(
        SECRET_KEY.encode("utf-8"),
        payload_b64.encode("utf-8"),
        hashlib.sha256
    ).digest()

    if not hmac.compare_digest(assinatura_recebida, assinatura_esperada):
        raise HTTPException(status_code=401, detail="errInvalidToken")

    try:
        payload = json.loads(_b64url_decode(payload_b64).decode("utf-8"))
        email = str(payload.get("sub", "")).strip().lower()
        exp = int(payload.get("exp", 0))
    except Exception:
        raise HTTPException(status_code=401, detail="errInvalidToken")

    if not email:
        raise HTTPException(status_code=401, detail="errInvalidToken")

    if exp < int(time.time()):
        raise HTTPException(status_code=401, detail="errTokenExpired")
    return email


def _extrair_token_request(request: Request) -> Optional[str]:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1].strip()
    return None


def verifica_sessao(request: Request):
    bearer_token = _extrair_token_request(request)
    if bearer_token:
        return validar_token(bearer_token)

    # Fallback temporário para sessões antigas por cookie
    cookie_token = request.cookies.get("sessao_app")
    if cookie_token:
        users = _load_users()
        if cookie_token in users:
            return cookie_token

    raise HTTPException(status_code=401, detail="errNotAuthorized")


class LoginOut(BaseModel):
    status: str
    nome: str
    email: str
    access_token: str
    token_type: str = "Bearer"
    expires_in: int

@app.post("/login", response_model=LoginOut)
def login(identificador: str = Form(...), senha: str = Form(...)):
    ident_limpo = identificador.strip().lower()

    try:
        # Tenta autenticar na segurança do Supabase
        res = supabase.auth.sign_in_with_password({
            "email": ident_limpo,
            "password": senha
        })

        # Pega o nome do usuário dos metadados
        user_info = res.user
        nome = user_info.user_metadata.get("nome", "Usuário")

        # Gera o token
        access_token = gerar_token(ident_limpo)

        return {
            "status": "ok",
            "nome": nome,
            "email": ident_limpo,
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": TOKEN_TTL_SECONDS
        }
    except Exception as e:
        erro_msg = str(e).lower()
        if "email not confirmed" in erro_msg:
            raise HTTPException(status_code=401, detail="errEmailNotConfirmed")
        
        # Verifica se o usuário sequer existe no banco
        check = supabase.table("users").select("email").eq("email", ident_limpo).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="errUserNotFound")
            
        raise HTTPException(status_code=401, detail="errLogin")
    
@app.post("/register")
def register(nome: str = Form(...), email: str = Form(...), senha: str = Form(...)):
    email_limpo = email.strip().lower()
    try:
        # Verifica se o e-mail já existe na nossa tabela antes de tentar o Auth
        check = supabase.table("users").select("email").eq("email", email_limpo).execute()
        if check.data:
            raise HTTPException(status_code=400, detail="errEmailExists")
            
        res = supabase.auth.sign_up({
            "email": email_limpo,
            "password": senha,
            "options": {"data": {"nome": nome.strip()}}
        })
        return {"status": "ok", "mensagem": "msgLinkSent"}
    except HTTPException as he:
        raise he
    except Exception:
        # Se o Supabase rejeitar por domínio inválido ou erro de servidor
        raise HTTPException(status_code=400, detail="errRealEmailRequired")
    
@app.post("/logout")
def logout():
    return {"status": "deslogado"}


@app.get("/me")
def get_me(request: Request):
    email = verifica_sessao(request)
    users = _load_users()
    user = users[email]
    return {"status": "logado", "nome": user["nome"], "email": email}

ALLOWED_ORIGINS = [
    "https://debyrs2.github.io",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
class FeedbackInput(BaseModel):
    rating: int
    texto: Optional[str] = ""

@app.post("/feedback", dependencies=[Depends(verifica_sessao)])
def receber_feedback(req: FeedbackInput, request: Request):
    email = verifica_sessao(request)
    
    try:
        # Insere o feedback direto na tabela do Supabase
        supabase.table("feedbacks").insert({
            "email": email,
            "rating": req.rating,
            "texto": req.texto
        }).execute()
        
        return {"status": "ok", "msg": "feedbackSuccess"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="feedbackError")

class DatasetOut(BaseModel):
    id: str
    name: str
    original_filename: str
    size_bytes: int
    uploaded_at: str
    updated_at: str
    last_analysis_at: Optional[str] = None
    last_analysis_method: Optional[str] = None
    last_suspeitas_count: Optional[int] = None
    last_thresholds: Optional[Dict[str, Any]] = None

class AnalyzeRequest(BaseModel):
    method: Literal["sigma", "zscore", "iqr", "mad"] = "sigma"
    # "k" é o multiplicador/limiar principal do método.
    k: float = Field(default=3.0, ge=0.0)
    direction: Literal["upper", "lower", "both"] = "upper"
    column: str = "valor"
    streaming: bool = False
    max_suspeitas: int = Field(default=500, ge=1, le=5000)

def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    # Padroniza tudo para minúsculo e remove espaços em branco 
    df.columns = df.columns.astype(str).str.strip().str.lower()
   
    # Lista de nomes comuns que os bancos usam para a coluna de valores e datas
    mapeamento_bancos = {
        "valor": ["r$", "saída", "saídas", "entrada", "entradas", "lançamentos", "lançamento", "amount", "value", "importância", "débito", "crédito", "Emissão e envio"],
        "data": ["date", "fecha", "dia", "data lançamento", "data da transação"]
    }
    
    #Varre as colunas e renomeia se encontrar um dos sinônimos
    for coluna_padrao, sinonimos in mapeamento_bancos.items():
        if coluna_padrao not in df.columns:
            for col in df.columns:
                if col in sinonimos:
                    df.rename(columns={col: coluna_padrao}, inplace=True)
                    break                  
    return df

def _coerce_ptbr_numeric(series: pd.Series) -> pd.Series:
    if series.dtype == "object":
        s = series.astype(str).str.strip()
        
        # Limpeza inicial (tira R$ e espaços invisíveis)
        s = s.str.replace("R$", "", regex=False).str.replace("\u00A0", "", regex=False).str.replace(" ", "", regex=False)
        
        s = s.apply(lambda x: "-" + str(x).replace("-", "") if str(x).endswith("-") else x)
        
        # Converte a vírgula brasileira para o ponto americano do Python
        ptbr = s.str.contains(",").fillna(False)
        s_ptbr = s.where(ptbr, "").str.replace(".", "", regex=False).str.replace(",", ".", regex=False)
        s = s.where(~ptbr, s_ptbr)

        return pd.to_numeric(s, errors="coerce")

    return pd.to_numeric(series, errors="coerce")

def _parse_pdf_to_dataframe(content: bytes) -> pd.DataFrame:
    linhas_transacao = []
    regex_mestre = re.compile(
        r"(\d{2}/\d{2}(?:/\d{2,4})?|\d{2}\s+(?:JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)[A-Z]*)" # Data
        r"[\s\n]+(.*?)" 
        r"[\s\n]+(-?\s*(?:R\$|BRL|\$|€)?\s*-?[\d\.]+\,\d{2}\s*-?)", 
        re.IGNORECASE | re.DOTALL
    )

    termos_resumo = ["total", "saldo", "pagamento em", "limite", "juros", "iof", "fatura"]

    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text: continue
            
            # Busca todas as ocorrências na página de uma vez
            for match in regex_mestre.finditer(text):
                data_str = match.group(1).strip()
                desc = match.group(2).strip().replace('\n', ' ')
                valor_str = match.group(3).strip()

                # Só adiciona se não for uma linha de resumo/pagamento
                if not any(termo in desc.lower() for termo in termos_resumo):
                    linhas_transacao.append({
                        "data": data_str,
                        "descricao": desc,
                        "valor": valor_str
                    })

    if len(linhas_transacao) == 0:
        raise ValueError("ERR_FEW_DATA|valor (O sistema não conseguiu extrair transações deste PDF).")

    return pd.DataFrame(linhas_transacao)

def _read_dataframe_from_bytes(filename: str, content: bytes) -> pd.DataFrame:
    name = (filename or "").lower()
    if name.endswith(".csv"):
        return pd.read_csv(io.BytesIO(content))
    if name.endswith(".xlsx"):
        return pd.read_excel(io.BytesIO(content), engine="openpyxl")
    if name.endswith(".xls"):
        return pd.read_excel(io.BytesIO(content), engine="xlrd")
    if name.endswith(".pdf"):
        return _parse_pdf_to_dataframe(content)
    # fallback
    return pd.read_excel(io.BytesIO(content))

def _read_dataframe_from_path(path: Path) -> pd.DataFrame:
    name = path.name.lower()
    if name.endswith(".csv"):
        return pd.read_csv(path)
    if name.endswith(".xlsx"):
        return pd.read_excel(path, engine="openpyxl")
    if name.endswith(".xls"):
        return pd.read_excel(path, engine="xlrd")
    if name.endswith(".pdf"):
        return _parse_pdf_to_dataframe(path.read_bytes())
    return pd.read_excel(path)


def _coerce_numeric_series(df: pd.DataFrame, column: str) -> pd.Series:
    if column not in df.columns:
        raise ValueError(f"ERR_MISSING_COLUMN|{column}")
    s = _coerce_ptbr_numeric(df[column])
    
    s = s.dropna()
    return s
# Calcula média e variância em streaming (passagem única com espaço O(1)) via Algoritmo de Welford, evitando estouro de memória em bases massivas.
def _mean_std_streaming_csv(path: Path, column: str, chunksize: int = 200_000) -> Tuple[int, float, float]:
    """Calcula média e desvio padrão amostral (ddof=1) via Welford (streaming).

    OBS: só funciona para métodos baseados em média/desvio (sigma/zscore).
    """
    column = (column or "").strip().lower()
    n = 0
    mean = 0.0
    m2 = 0.0
#trtatamento de colunas
    for chunk in pd.read_csv(path, chunksize=chunksize):
        _normalize_columns(chunk)
        if column not in chunk.columns:
            raise ValueError(f"ERR_MISSING_COLUMN|{column}")
        vals = _coerce_ptbr_numeric(chunk[column]).dropna().tolist()
        for x in vals:
            n += 1
            delta = x - mean
            mean += delta / n
            delta2 = x - mean
            m2 += delta * delta2

    if n < 2:
        raise ValueError("ERR_FEW_DATA_STD")

    var = m2 / (n - 1)
    std = math.sqrt(var) if var > 0 else 0.0
    return n, mean, std

# Aplica Álgebra Booleana vetorizada para filtragem em bloco, garantindo complexidade de tempo otimizada na separação das anomalias.
def _threshold_mask(values: pd.Series, lower: Optional[float], upper: Optional[float]) -> pd.Series:
    if lower is not None and upper is not None:
        return (values < lower) | (values > upper)
    if upper is not None:
        return values > upper
    if lower is not None:
        return values < lower

    # Sem limites definidos, nenhuma linha é suspeita
    return pd.Series([False] * len(values), index=values.index)


def _analyze_df(df: pd.DataFrame, req: AnalyzeRequest) -> Dict[str, Any]:
    t0 = time.perf_counter()

    # Higieniza as colunas do dataframe logo no início
    _normalize_columns(df)

    col = (req.column or "").strip().lower()
    if col not in df.columns and "valor" in df.columns:
        col = "valor"
    series = _coerce_numeric_series(df, col)
    if len(series) < 2:
        raise ValueError(f"ERR_FEW_DATA|{col}")

    method = req.method
    direction = req.direction
    k = float(req.k)

    stats: Dict[str, Any] = {}
    thresholds: Dict[str, Optional[float]] = {"lower": None, "upper": None}

# Aplica a Regra Empírica da distribuição normal (com complexidade O(N)) como um filtro rápido e performático para anomalias que fogem muito da média.
    if method in {"sigma", "zscore"}:
        mean = float(series.mean())
        std = float(series.std(ddof=1))
        stats.update({"mean": mean, "std": std})

        if std == 0.0:
            lower = upper = None
        else:
            if method == "sigma":
                lower = mean - k * std
                upper = mean + k * std
            else:
                # z-score: |z| > k
                lower = mean - k * std
                upper = mean + k * std

        if direction == "upper":
            thresholds["upper"] = upper
        elif direction == "lower":
            thresholds["lower"] = lower
        else:
            thresholds["lower"] = lower
            thresholds["upper"] = upper

        mask = _threshold_mask(series, thresholds["lower"], thresholds["upper"])

# Avalia a dispersão focando apenas nos 50% centrais dos dados, impedindo que as próprias fraudes extremas distorçam a linha de corte do algoritmo.
    elif method == "iqr":
        q1 = float(series.quantile(0.25))
        q3 = float(series.quantile(0.75))
        iqr = q3 - q1
        stats.update({"q1": q1, "q3": q3, "iqr": iqr})

        if iqr == 0.0:
            lower = upper = None
        else:
            lower = q1 - k * iqr
            upper = q3 + k * iqr

        if direction == "upper":
            thresholds["upper"] = upper
        elif direction == "lower":
            thresholds["lower"] = lower
        else:
            thresholds["lower"] = lower
            thresholds["upper"] = upper

        mask = _threshold_mask(series, thresholds["lower"], thresholds["upper"])

# Implementa a métrica com maior resiliência estatística, garantindo a precisão matemática na detecção de anomalias mesmo se a base estiver infestada de fraudes.
    elif method == "mad":
        median = float(series.median())
        mad = float((series - median).abs().median())
        stats.update({"median": median, "mad": mad})

        if mad == 0.0:
            lower = upper = None
        else:
            scale = (k * mad) / 0.6745
            lower = median - scale
            upper = median + scale

        if direction == "upper":
            thresholds["upper"] = upper
        elif direction == "lower":
            thresholds["lower"] = lower
        else:
            thresholds["lower"] = lower
            thresholds["upper"] = upper

        mask = _threshold_mask(series, thresholds["lower"], thresholds["upper"])

    else:
        raise ValueError("Método inválido")

    df2 = df.copy()
    df2[col] = _coerce_ptbr_numeric(df2[col])
    df2 = df2.dropna(subset=[col])

    # Reaplica máscara ao dataframe filtrado para alinhamento correto de índices
    mask = _threshold_mask(df2[col], thresholds["lower"], thresholds["upper"])
    suspeitas_df = df2.loc[mask]

    total_suspeitas = int(len(suspeitas_df))
    truncated = False
    if total_suspeitas > req.max_suspeitas:
        suspeitas_df = suspeitas_df.head(req.max_suspeitas)
        truncated = True

    def r2(x: Optional[float]) -> Optional[float]:
        return None if x is None else round(float(x), 2)

    for kstats in list(stats.keys()):
        stats[kstats] = r2(stats[kstats])
    thresholds = {"lower": r2(thresholds["lower"]), "upper": r2(thresholds["upper"])}

    dt_ms = int((time.perf_counter() - t0) * 1000)

# Aplica restrição de cardinalidade (Downsampling) nos dados do gráfico, prevenindo o travamento de processamento e memória do lado do cliente.
    chart_limit = 5000 

    df_chart = df2.head(chart_limit)
    mask_chart = mask.head(chart_limit)
    
    chart_labels = list(range(1, len(df_chart) + 1))
    chart_values = df_chart[col].tolist()
    
    chart_suspeitos = [
        val if is_sus else None 
        for val, is_sus in zip(chart_values, mask_chart)
    ]
    
    chart_data = {
        "labels": chart_labels,
        "values": chart_values,
        "suspeitos": chart_suspeitos
    }

    return {
        "method": method,
        "direction": direction,
        "column": col,
        "stats": stats,
        "thresholds": thresholds,
        "quantidade_suspeitas": total_suspeitas,
        "suspeitas": json.loads(suspeitas_df.to_json(orient="records", date_format="iso")),
        "truncated": truncated,
        "analysis_ms": dt_ms,
        "analysis_at": utc_now_iso(),
        "n_valid": int(len(series)),
        "chart_data": chart_data,
    }

def _analyze_path(path: Path, req: AnalyzeRequest) -> Dict[str, Any]:
    """Analisa arquivo em disco.

    streaming só é aplicado para CSV em métodos baseados em mean/std.
    """
    
    if req.streaming and path.suffix.lower() == ".csv" and req.method in {"sigma", "zscore"}:

        col = (req.column or "").strip().lower()
        n, mean, std = _mean_std_streaming_csv(path, col)

        if std == 0.0:
            thresholds = {"lower": None, "upper": None}
        else:
            lower = mean - req.k * std
            upper = mean + req.k * std
            thresholds = {"lower": lower, "upper": upper}

        if req.direction == "upper":
            thresholds["lower"] = None
        elif req.direction == "lower":
            thresholds["upper"] = None

        suspeitas: List[Dict[str, Any]] = []
        total_sus = 0
        chunksize = 200_000
        for chunk in pd.read_csv(path, chunksize=chunksize):
            _normalize_columns(chunk)
            if col not in chunk.columns:
                raise ValueError(f"ERR_MISSING_COLUMN|{col}")
            chunk[col] = _coerce_ptbr_numeric(chunk[col])
            chunk = chunk.dropna(subset=[col])
            mask = _threshold_mask(chunk[col], thresholds.get("lower"), thresholds.get("upper"))
            sus_chunk = chunk.loc[mask]
            if len(sus_chunk) == 0:
                continue
            total_sus += int(len(sus_chunk))
            if len(suspeitas) < req.max_suspeitas:
                take = req.max_suspeitas - len(suspeitas)
                sus_chunk_json = json.loads(sus_chunk.head(take).to_json(orient="records", date_format="iso"))
                suspeitas.extend(sus_chunk_json)
        truncated = total_sus > req.max_suspeitas

        def r2(x: Optional[float]) -> Optional[float]:
            return None if x is None else round(float(x), 2)

        out = {
            "method": req.method,
            "direction": req.direction,
            "column": col,
            "stats": {"mean": r2(mean), "std": r2(std)},
            "thresholds": {"lower": r2(thresholds.get("lower")), "upper": r2(thresholds.get("upper"))},
            "quantidade_suspeitas": int(total_sus),
            "suspeitas": suspeitas,
            "truncated": truncated,
            "analysis_ms": None,
            "analysis_at": utc_now_iso(),
            "n_valid": int(n),
            "streaming": True,
        }
        return out

    # Sem streaming
    df = _read_dataframe_from_path(path)
    return _analyze_df(df, req)


@app.on_event("startup")
def _startup() -> None:
    storage.ensure_storage()


@app.get("/health", dependencies=[Depends(verifica_sessao)])
def health() -> Dict[str, str]:
    return {"status": "ok"}
""
@app.get("/")
def home() -> Dict[str, str]:
    return {"status": "A API do DataGuard está ONLINE na nuvem!"}

@app.post("/datasets", response_model=DatasetOut)
async def create_dataset(
    request: Request, # Adicionamos o request aqui
    arquivo: UploadFile = File(...),
    name: Optional[str] = Form(default=None),
) -> DatasetOut:
    email = verifica_sessao(request) # Pegamos o e-mail do dono real
    content = await arquivo.read()
    try:
        # Passamos o email para o storage saber quem é o dono
        meta = storage.create_dataset(file_bytes=content, filename=arquivo.filename, name=name, owner=email)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return DatasetOut(id=meta.id, name=meta.name, original_filename=meta.original_filename, 
                      size_bytes=meta.size_bytes, uploaded_at=meta.uploaded_at, updated_at=meta.updated_at)

@app.get("/datasets", dependencies=[Depends(verifica_sessao)])
def listar_datasets(request: Request):
    email = verifica_sessao(request)
    from dataclasses import asdict
    
    all_ds_dict = storage.list_datasets()
    user_ds = [ds for ds in all_ds_dict.values() if ds.owner == email]
    
    return [asdict(ds) for ds in user_ds]

@app.get("/datasets/{dataset_id}", response_model=DatasetOut, dependencies=[Depends(verifica_sessao)])
def get_dataset(dataset_id: str) -> DatasetOut:
    meta = storage.get_dataset(dataset_id)
    if not meta:
        raise HTTPException(status_code=404, detail="errDatasetNotFound")
    return DatasetOut(
        id=meta.id,
        name=meta.name,
        original_filename=meta.original_filename,
        size_bytes=meta.size_bytes,
        uploaded_at=meta.uploaded_at,
        updated_at=meta.updated_at,
        last_analysis_at=meta.last_analysis_at,
        last_analysis_method=meta.last_analysis_method,
        last_suspeitas_count=meta.last_suspeitas_count,
        last_thresholds=meta.last_thresholds,
    )

@app.put("/datasets/{dataset_id}", response_model=DatasetOut, dependencies=[Depends(verifica_sessao)])
async def update_dataset(
    dataset_id: str,
    name: Optional[str] = Form(default=None),
    arquivo: Optional[UploadFile] = File(default=None),
) -> DatasetOut:
    new_bytes = None
    new_filename = None
    if arquivo is not None:
        new_bytes = await arquivo.read()
        new_filename = arquivo.filename or "dataset"
    try:
        meta = storage.update_dataset(dataset_id, new_name=name, new_file_bytes=new_bytes, new_filename=new_filename)
    except KeyError:
        raise HTTPException(status_code=404, detail="errDatasetNotFound")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return DatasetOut(
        id=meta.id,
        name=meta.name,
        original_filename=meta.original_filename,
        size_bytes=meta.size_bytes,
        uploaded_at=meta.uploaded_at,
        updated_at=meta.updated_at,
        last_analysis_at=meta.last_analysis_at,
        last_analysis_method=meta.last_analysis_method,
        last_suspeitas_count=meta.last_suspeitas_count,
        last_thresholds=meta.last_thresholds,
    )

@app.delete("/datasets/{dataset_id}", dependencies=[Depends(verifica_sessao)])
def delete_dataset(dataset_id: str, request: Request) -> Dict[str, str]:
    email_logado = verifica_sessao(request) 
    meta = storage.get_dataset(dataset_id)
    if not meta:
        raise HTTPException(status_code=404, detail="errDatasetNotFound")
    
    # Trava de segurança
    if getattr(meta, 'owner', None) != email_logado:
        raise HTTPException(status_code=403, detail="errAccessDenied")
        
    try:
        storage.delete_dataset(dataset_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="errDatasetNotFound")
    return {"status": "deleted"}


@app.post("/datasets/{dataset_id}/analyze", dependencies=[Depends(verifica_sessao)])
def analyze_dataset(dataset_id: str, req: AnalyzeRequest, request: Request) -> Dict[str, Any]:
    email_logado = verifica_sessao(request) 
    meta = storage.get_dataset(dataset_id)
    if not meta:
        raise HTTPException(status_code=404, detail="errDatasetNotFound")
        
    # Trava de segurança 
    if getattr(meta, 'owner', None) != email_logado:
        raise HTTPException(status_code=403, detail="errAccessDenied")

    path = storage.dataset_path(meta)
    if not path.exists():
        raise HTTPException(status_code=404, detail="errFileNotFound")

    try:
        result = _analyze_path(path, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha ao analisar: {type(e).__name__}: {e}")

    storage.save_result(dataset_id, result)
    return result


@app.get("/datasets/{dataset_id}/result", dependencies=[Depends(verifica_sessao)])
def get_last_result(dataset_id: str, request: Request) -> Dict[str, Any]:
    email_logado = verifica_sessao(request)
    meta = storage.get_dataset(dataset_id)
    
    if not meta:
        raise HTTPException(status_code=404, detail="errDatasetNotFound")
        
    # Trava de segurança 
    if getattr(meta, 'owner', None) != email_logado:
        raise HTTPException(status_code=403, detail="errAccessDenied")
        
    result = storage.load_result(dataset_id)
    if not result:
        raise HTTPException(status_code=404, detail="errNoAnalysisFound")
    return result

@app.post("/analisar", dependencies=[Depends(verifica_sessao)])
async def analisar_planilha_legado(
    arquivo: UploadFile = File(...),
    method: Literal["sigma", "zscore", "iqr", "mad"] = "sigma",
    k: float = 3.0,
    direction: Literal["upper", "lower", "both"] = "upper",
    column: str = "valor",
) -> Dict[str, Any]:
    content = await arquivo.read()
    try:
        df = _read_dataframe_from_bytes(arquivo.filename or "dataset", content)
        req = AnalyzeRequest(method=method, k=k, direction=direction, column=column, streaming=False)
        return _analyze_df(df, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha ao analisar: {type(e).__name__}: {e}")

@app.post("/request-password-reset")
def request_password_reset(email: str = Form(...)):
    email_limpo = email.strip().lower()
    try:
        # O Supabase envia o e-mail com um link que redireciona de volta para o seu site
        supabase.auth.reset_password_for_email(
            email_limpo,
            options={"redirect_to": "https://debyrs2.github.io/DetectorTransacoesSuspeitas-UX-IHC/index.html"}
        )
        return {"status": "ok", "mensagem": "E-mail de recuperação enviado! Verifique a sua caixa de entrada."}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Erro ao enviar e-mail. Verifique se o endereço está correto.")

@app.post("/update-password")
def update_password(access_token: str = Form(...), refresh_token: str = Form(...), nova_senha: str = Form(...)):
    try:
       
        supabase.auth.set_session(access_token, refresh_token)
        supabase.auth.update_user({"password": nova_senha})
        supabase.auth.sign_out()
        
        return {"status": "ok", "mensagem": "Senha atualizada no banco com sucesso!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="O link expirou. Solicite uma nova recuperação.")
from __future__ import annotations

import io
import json
import math
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Tuple

import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel, Field
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Request, Response, Depends

import storage

APP_DIR = Path(__file__).resolve().parent
#INDEX_HTML = APP_DIR.parent / "Frontend" / "index.html"

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

app = FastAPI(title="Detecção de Transações Suspeitas")
#app.mount("/static", StaticFiles(directory=APP_DIR.parent / "Frontend"), name="static")

#Sistema de Login com bd
USERS_FILE = APP_DIR / "users.json"

def _load_users() -> Dict[str, Any]:
    if not USERS_FILE.exists():
        return {}
    return json.loads(USERS_FILE.read_text(encoding="utf-8"))

def verifica_sessao(request: Request):
    token = request.cookies.get("sessao_app")
    if not token:
        raise HTTPException(status_code=401, detail="Não autorizado")
    
    users = _load_users()
    if token not in users:
        raise HTTPException(status_code=401, detail="Sessão inválida")
    return token 

class LoginOut(BaseModel):
    status: str
    nome: str
    email: str

@app.post("/login", response_model=LoginOut)
def login(response: Response, identificador: str = Form(...), senha: str = Form(...)):
    users = _load_users()
    ident_limpo = identificador.strip().lower()

    user_key = None
    user_data = None
    
    for key, data in users.items():
        if key.lower() == ident_limpo or data["nome"].strip().lower() == ident_limpo:
            user_key = key
            user_data = data
            break
    if not user_data:
        raise HTTPException(status_code=404, detail="Usuário ou e-mail não cadastrado.")
    if user_data["senha"] != senha:
        raise HTTPException(status_code=401, detail="Senha incorreta.")

    response.set_cookie(key="sessao_app", value=user_key, httponly=True, samesite="none", secure=True, partitioned=True)
    return {"status": "ok", "nome": user_data["nome"], "email": user_key}

def _write_users(users_data: Dict[str, Any]) -> None:
     USERS_FILE.write_text(json.dumps(users_data, ensure_ascii=False, indent=2), encoding="utf-8")

@app.post("/register")
def register(nome: str = Form(...), email: str = Form(...), senha: str = Form(...)):
    users = _load_users()
    email_limpo = email.strip().lower()

    if not email_limpo or not senha or not nome:
        raise HTTPException(status_code=400, detail="Preencha todos os campos.")

    if email_limpo in users:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")

    users[email_limpo] = {
        "nome": nome.strip(),
        "senha": senha
    }
    _write_users(users)
    
    return {"status": "ok", "mensagem": "Conta criada com sucesso!"}

@app.post("/logout", dependencies=[Depends(verifica_sessao)])
def logout(response: Response):
    response.delete_cookie("sessao_app")
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
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
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
    df.columns = df.columns.astype(str).str.strip().str.lower()
    return df

# Converte representações textuais localizadas para vetores de ponto flutuante, preparando o domínio matemático para cálculos aritméticos de precisão.
def _coerce_ptbr_numeric(series: pd.Series) -> pd.Series:
    # Converte números de string para float considerando formatos PT-BR e EN.
    if series.dtype == "object":
        s = series.astype(str).str.strip()
        s = s.str.replace("R$", "", regex=False).str.replace("\u00A0", "", regex=False).str.replace(" ", "", regex=False)
        ptbr = s.str.contains(",").fillna(False)
        s_ptbr = s.where(ptbr, "").str.replace(".", "", regex=False).str.replace(",", ".", regex=False)
        s = s.where(~ptbr, s_ptbr)

        return pd.to_numeric(s, errors="coerce")

    return pd.to_numeric(series, errors="coerce")

def _read_dataframe_from_bytes(filename: str, content: bytes) -> pd.DataFrame:
    name = (filename or "").lower()
    if name.endswith(".csv"):
        return pd.read_csv(io.BytesIO(content))
    if name.endswith(".xlsx"):
        return pd.read_excel(io.BytesIO(content), engine="openpyxl")
    if name.endswith(".xls"):
        return pd.read_excel(io.BytesIO(content), engine="xlrd")
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

@app.post("/datasets", response_model=DatasetOut, dependencies=[Depends(verifica_sessao)])
async def create_dataset(
    arquivo: UploadFile = File(...),
    name: Optional[str] = Form(default=None),
) -> DatasetOut:
    content = await arquivo.read()
    try:
        meta = storage.create_dataset(file_bytes=content, filename=arquivo.filename or "dataset", name=name)
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


@app.get("/datasets", response_model=List[DatasetOut], dependencies=[Depends(verifica_sessao)])
def list_datasets() -> List[DatasetOut]:
    datasets = storage.list_datasets().values()
    ordered = sorted(datasets, key=lambda m: m.uploaded_at, reverse=True)
    return [
        DatasetOut(
            id=m.id,
            name=m.name,
            original_filename=m.original_filename,
            size_bytes=m.size_bytes,
            uploaded_at=m.uploaded_at,
            updated_at=m.updated_at,
            last_analysis_at=m.last_analysis_at,
            last_analysis_method=m.last_analysis_method,
            last_suspeitas_count=m.last_suspeitas_count,
            last_thresholds=m.last_thresholds,
        )
        for m in ordered
    ]

@app.get("/datasets/{dataset_id}", response_model=DatasetOut, dependencies=[Depends(verifica_sessao)])
def get_dataset(dataset_id: str) -> DatasetOut:
    meta = storage.get_dataset(dataset_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset não encontrado")
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
        raise HTTPException(status_code=404, detail="Dataset não encontrado")
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
def delete_dataset(dataset_id: str) -> Dict[str, str]:
    try:
        storage.delete_dataset(dataset_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Dataset não encontrado")
    return {"status": "deleted"}

@app.post("/datasets/{dataset_id}/analyze", dependencies=[Depends(verifica_sessao)])
def analyze_dataset(dataset_id: str, req: AnalyzeRequest) -> Dict[str, Any]:
    meta = storage.get_dataset(dataset_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset não encontrado")

    path = storage.dataset_path(meta)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Arquivo do dataset não encontrado")

    try:
        result = _analyze_path(path, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha ao analisar: {type(e).__name__}: {e}")

    storage.save_result(dataset_id, result)
    return result


@app.get("/datasets/{dataset_id}/result", dependencies=[Depends(verifica_sessao)])
def get_last_result(dataset_id: str) -> Dict[str, Any]:
    meta = storage.get_dataset(dataset_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset não encontrado")
    result = storage.load_result(dataset_id)
    if not result:
        raise HTTPException(status_code=404, detail="Nenhuma análise encontrada para este dataset")
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

@app.post("/reset-password")
def reset_password(email: str = Form(...), nova_senha: str = Form(...)):
    users = _load_users()
    email_limpo = email.strip().lower()

    if email_limpo not in users:
        raise HTTPException(status_code=404, detail="E-mail não encontrado no sistema.")

    # Atualiza a senha e salva no banco
    users[email_limpo ][ "senha" ] = nova_senha
    _write_users(users)
    
    return { "status": "ok", "mensagem": "Senha redefinida com sucesso!" }

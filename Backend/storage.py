import tempfile
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional
from uuid import uuid4
from supabase import create_client, Client

# Inicializa a ligação ao Supabase diretamente no motor de storage
SUPABASE_URL = "https://qhmxiezjzodhrduxfjlo.supabase.co"
SUPABASE_KEY = "sb_publishable_7HfOvVPG_Rl1Hu7A1QLrBQ_pH2ND2bb"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

BUCKET_NAME = "dataguard"
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".pdf"}

def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

@dataclass
class DatasetMeta:
    id: str
    owner: str  
    name: str
    original_filename: str
    stored_filename: str
    size_bytes: int
    uploaded_at: str
    updated_at: str
    last_analysis_at: Optional[str] = None
    last_analysis_method: Optional[str] = None
    last_suspeitas_count: Optional[int] = None
    last_thresholds: Optional[Dict[str, Any]] = None

def ensure_storage() -> None:
    pass 

def _safe_ext(filename: str) -> str:
    return Path(filename).suffix.lower()

def list_datasets() -> Dict[str, DatasetMeta]:
    res = supabase.table("datasets").select("id, owner, name, original_filename, stored_filename, size_bytes, uploaded_at, updated_at, last_analysis_at, last_analysis_method, last_suspeitas_count, last_thresholds").execute()
    return {row["id"]: DatasetMeta(**row) for row in res.data}

def get_dataset(ds_id: str) -> Optional[DatasetMeta]:
    res = supabase.table("datasets").select("id, owner, name, original_filename, stored_filename, size_bytes, uploaded_at, updated_at, last_analysis_at, last_analysis_method, last_suspeitas_count, last_thresholds").eq("id", ds_id).execute()
    if not res.data:
        return None
    return DatasetMeta(**res.data[0])

def dataset_path(meta: DatasetMeta) -> Path:
    # Descarrega temporariamente o ficheiro da nuvem apenas para a análise matemática
    tmp_dir = Path(tempfile.gettempdir()) / "dataguard_cache"
    tmp_dir.mkdir(exist_ok=True)
    local_path = tmp_dir / meta.stored_filename
    
    if not local_path.exists():
        res = supabase.storage.from_(BUCKET_NAME).download(meta.stored_filename)
        with open(local_path, "wb") as f:
            f.write(res)
            
    return local_path

def create_dataset(file_bytes: bytes, filename: str, name: str, owner: str) -> DatasetMeta:
    ext = _safe_ext(filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Extensão não suportada: {ext}.")

    ds_id = uuid4().hex[:12]
    stored_filename = f"{ds_id}{ext}"
    
    # Envia o ficheiro para o Supabase Storage
    tmp_path = Path(tempfile.gettempdir()) / stored_filename
    tmp_path.write_bytes(file_bytes)
    supabase.storage.from_(BUCKET_NAME).upload(stored_filename, str(tmp_path))
    tmp_path.unlink(missing_ok=True)

    now = _utc_now_iso()
    meta = DatasetMeta(
        id=ds_id,
        owner=owner,  
        name=(name or Path(filename).stem or ds_id),
        original_filename=filename,
        stored_filename=stored_filename,
        size_bytes=len(file_bytes),
        uploaded_at=now,
        updated_at=now
    )
    
    # Guarda os metadados na base de dados
    supabase.table("datasets").insert(asdict(meta)).execute()
    return meta

def update_dataset(ds_id: str, *, new_name: Optional[str] = None, new_file_bytes: Optional[bytes] = None, new_filename: Optional[str] = None) -> DatasetMeta:
    meta = get_dataset(ds_id)
    if not meta:
        raise KeyError("Dataset não encontrado")

    update_data = {"updated_at": _utc_now_iso()}

    if new_name:
        update_data["name"] = new_name
        meta.name = new_name

    if new_file_bytes is not None and new_filename:
        ext = _safe_ext(new_filename)
        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"Extensão não suportada: {ext}.")

        try:
            supabase.storage.from_(BUCKET_NAME).remove([meta.stored_filename])
        except Exception:
            pass

        meta.original_filename = new_filename
        meta.stored_filename = f"{ds_id}{ext}"
        
        tmp_path = Path(tempfile.gettempdir()) / meta.stored_filename
        tmp_path.write_bytes(new_file_bytes)
        supabase.storage.from_(BUCKET_NAME).upload(meta.stored_filename, str(tmp_path))
        tmp_path.unlink(missing_ok=True)
        
        update_data["original_filename"] = meta.original_filename
        update_data["stored_filename"] = meta.stored_filename
        update_data["size_bytes"] = len(new_file_bytes)
        update_data["last_analysis_at"] = None
        update_data["last_analysis_method"] = None
        update_data["last_suspeitas_count"] = None
        update_data["last_thresholds"] = None
        update_data["result_data"] = None

    supabase.table("datasets").update(update_data).eq("id", ds_id).execute()
    
    cache_path = Path(tempfile.gettempdir()) / "dataguard_cache" / meta.stored_filename
    cache_path.unlink(missing_ok=True)

    return get_dataset(ds_id)

def delete_dataset(ds_id: str) -> None:
    meta = get_dataset(ds_id)
    if not meta:
        raise KeyError("Dataset não encontrado")
        
    try:
        supabase.storage.from_(BUCKET_NAME).remove([meta.stored_filename])
    except Exception:
        pass
        
    supabase.table("datasets").delete().eq("id", ds_id).execute()
    
    cache_path = Path(tempfile.gettempdir()) / "dataguard_cache" / meta.stored_filename
    cache_path.unlink(missing_ok=True)

def save_result(ds_id: str, result: Dict[str, Any]) -> None:
    update_data = {
        "last_analysis_at": result.get("analysis_at"),
        "last_analysis_method": result.get("method"),
        "last_suspeitas_count": result.get("quantidade_suspeitas"),
        "last_thresholds": result.get("thresholds"),
        "result_data": result,
        "updated_at": _utc_now_iso()
    }
    supabase.table("datasets").update(update_data).eq("id", ds_id).execute()

def load_result(ds_id: str) -> Optional[Dict[str, Any]]:
    res = supabase.table("datasets").select("result_data").eq("id", ds_id).execute()
    if not res.data or not res.data[0].get("result_data"):
        return None
    return res.data[0]["result_data"]
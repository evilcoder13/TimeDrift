"""
TimeDrift Lightweight LLM Worker (OpenAI-compatible)
Powered by llama-cpp-python running Qwen2.5-Coder GGUF on CPU / Apple Silicon.
"""

import os
import time
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from huggingface_hub import hf_hub_download

app = FastAPI(title="TimeDrift Lightweight LLM Worker", version="1.0.0")

# Model configuration
MODEL_REPO = os.environ.get("MODEL_REPO", "Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF")
MODEL_FILENAME = os.environ.get("MODEL_FILENAME", "qwen2.5-coder-1.5b-instruct-q4_k_m.gguf")
MODEL_PATH = os.environ.get("MODEL_PATH", "")
N_CTX = int(os.environ.get("N_CTX", "8192"))
N_THREADS = int(os.environ.get("N_THREADS", str(os.cpu_count() or 4)))

llm_instance = None


def get_llm():
    global llm_instance
    if llm_instance is not None:
        return llm_instance

    target_path = MODEL_PATH
    if not target_path or not os.path.exists(target_path):
        print(f"[*] Downloading lightweight GGUF model: {MODEL_REPO}/{MODEL_FILENAME}...")
        models_dir = os.environ.get("MODELS_DIR", "/models")
        os.makedirs(models_dir, exist_ok=True)
        target_path = hf_hub_download(
            repo_id=MODEL_REPO,
            filename=MODEL_FILENAME,
            local_dir=models_dir,
            local_dir_use_symlinks=False
        )

    print(f"[*] Loading GGUF into memory from {target_path} (threads: {N_THREADS}, ctx: {N_CTX})...")
    from llama_cpp import Llama
    llm_instance = Llama(
        model_path=target_path,
        n_ctx=N_CTX,
        n_threads=N_THREADS,
        verbose=False
    )
    print("[*] Model loaded successfully!")
    return llm_instance


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatCompletionRequest(BaseModel):
    model: Optional[str] = "default"
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.4
    max_tokens: Optional[int] = 4096
    top_p: Optional[float] = 0.95
    stream: Optional[bool] = False


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "timedrift-llm-worker",
        "engine": "llama.cpp",
        "model": MODEL_FILENAME,
        "threads": N_THREADS,
        "loaded": llm_instance is not None
    }


@app.get("/v1/models")
def list_models():
    return {
        "object": "list",
        "data": [
            {
                "id": MODEL_FILENAME,
                "object": "model",
                "created": int(time.time()),
                "owned_by": "timedrift"
            },
            {
                "id": "default",
                "object": "model",
                "created": int(time.time()),
                "owned_by": "timedrift"
            }
        ]
    }


@app.post("/v1/chat/completions")
def chat_completions(req: ChatCompletionRequest):
    try:
        llm = get_llm()
        messages_dict = [{"role": m.role, "content": m.content} for m in req.messages]

        response = llm.create_chat_completion(
            messages=messages_dict,
            temperature=req.temperature,
            max_tokens=req.max_tokens,
            top_p=req.top_p,
            stream=False
        )
        return response
    except Exception as e:
        print(f"[!] Generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Request
from fastapi.middleware.cors import CORSMiddleware
import pytesseract
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from PIL import Image
import io
import httpx
import os
from dotenv import load_dotenv

load_dotenv(override=True) # .env dosyasını oku ve varsa eskiyi ez

app = FastAPI(title="Garanti Arşivi OCR API")

# React/Expo'dan gelen isteklere izin ver (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Frontend assets path
frontend_path = Path(__file__).parent / "frontend"
app.mount("/static", StaticFiles(directory=frontend_path), name="static")

# Supabase Bilgileri (Çevre değişkenlerinden alınması önerilir)
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "your-anon-key")

@app.post("/api/upload")
async def upload_invoice(
    file: UploadFile = File(...), 
    category: str = Form("Diğer"),
    type: str = Form("warranty")
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Lütfen geçerli bir görsel yükleyin.")
    
    try:
        # Görseli oku ve RAM'de aç
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Pytesseract ile OCR İşlemi
        extracted_text = pytesseract.image_to_string(image, lang="tur+eng")
        
        # Supabase'e kaydet
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        
        data = {
            "filename": file.filename,
            "raw_text": extracted_text,
            "category": category,
            "type": type
        }
        
        # Supabase'e kaydet (Artık Aktif!)
        async with httpx.AsyncClient() as client:
            print(f"Supabase'e gönderiliyor: {data}")
            response = await client.post(f"{SUPABASE_URL}/rest/v1/invoices", json=data, headers=headers)
            
            # Eğer 'type' sütunu yoksa hata verebilir, bu durumda 'type' olmadan tekrar dene
            if response.status_code == 400 and 'type' in data:
                print("Hata: 'type' sütunu bulunamadı, sütunsuz deneniyor...")
                del data["type"]
                response = await client.post(f"{SUPABASE_URL}/rest/v1/invoices", json=data, headers=headers)

            if response.status_code >= 400:
                error_msg = response.text
                print(f"Supabase Hatası ({response.status_code}): {error_msg}")
                raise Exception(f"Supabase Hatası: {error_msg}")
            
            print("Supabase kaydı başarılı.")
        
        return {
            "status": "success",
            "message": "Belge başarıyla analiz edildi ve kaydedildi.",
            "data": {
                "filename": file.filename,
                "text": extracted_text.strip(),
                "category": category
            }
        }
        
    except Exception as e:
        print(f"Genel Hata: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Hata: {str(e)}")

@app.get("/", response_class=HTMLResponse)
async def splash(request: Request):
    ua = request.headers.get('user-agent', '')
    if 'Mobi' not in ua:
        return RedirectResponse(url="/home")
    splash_path = frontend_path / "splash.html"
    if not splash_path.exists():
        return HTMLResponse(content="<h1>Splash Page Not Found</h1>", status_code=404)
    html_content = splash_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_content)

# Home page route – serves static home.html
@app.get("/home", response_class=HTMLResponse)
async def home_page():
    home_path = frontend_path / "home.html"
    if not home_path.exists():
        return HTMLResponse(content="<h1>Home Page Not Found</h1>", status_code=404)
    html_content = home_path.read_text(encoding="utf-8")
    return HTMLResponse(content=html_content)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

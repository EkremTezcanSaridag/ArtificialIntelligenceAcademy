from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import pytesseract
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

# Supabase Bilgileri (Çevre değişkenlerinden alınması önerilir)
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "your-anon-key")

@app.post("/api/upload")
async def upload_invoice(file: UploadFile = File(...), category: str = Form("Diğer")):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Lütfen geçerli bir görsel yükleyin.")
    
    try:
        # Görseli oku ve RAM'de aç
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Pytesseract ile OCR İşlemi
        # Tesseract yolunu zorunlu olarak belirtiyoruz (Windows kurulumu için)
        pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        extracted_text = pytesseract.image_to_string(image, lang="tur+eng")
        
        # -------------------------------------------------------------
        # BURADA: Metinden regex ile Tarih, Mağaza ve Tutar ayıklanabilir
        # -------------------------------------------------------------
        
        # Supabase'e kaydet (REST API ile - httpx kütüphanesi kullanarak)
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        
        data = {
            "filename": file.filename,
            "raw_text": extracted_text,
            "category": category
            # "warranty_end_date": "2028-05-04",
        }
        
        # Supabase'e kaydet (Artık Aktif!)
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{SUPABASE_URL}/rest/v1/invoices", json=data, headers=headers)
            if response.status_code >= 400:
                print("Supabase Hatası:", response.text)
            response.raise_for_status()
        
        return {
            "status": "success",
            "message": "OCR işlemi tamamlandı (Supabase kaydı için URL bekliyor)",
            "data": {
                "filename": file.filename,
                "text": extracted_text.strip(),
                "category": category
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR veya kayıt sırasında hata: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "Garanti Arşivi OCR API Çalışıyor"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

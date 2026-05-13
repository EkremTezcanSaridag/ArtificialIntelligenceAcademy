from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import pytesseract
from PIL import Image
import io
import httpx
import os
from dotenv import load_dotenv

# .env dosyasını yükle
load_dotenv(override=True)

app = FastAPI(title="Garanti Arşivi OCR API")

# CORS ayarları - React/Expo erişimi için
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Bilgileri
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "your-anon-key")

@app.post("/api/upload")
async def upload_invoice(
    file: UploadFile = File(...), 
    category: str = Form("Diğer"),
    type: str = Form("warranty")
):
    """
    Belge görselini alır, Tesseract ile OCR yapar ve sonucu Supabase'e kaydeder.
    Not: Mobil uygulama şu an doğrudan frontend üzerinden OCR yapmaktadır, 
    bu endpoint alternatif/yedek olarak tutulmaktadır.
    """
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
        
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{SUPABASE_URL}/rest/v1/invoices", json=data, headers=headers)
            
            if response.status_code >= 400:
                print(f"Supabase Hatası: {response.text}")
                raise Exception(f"Supabase Hatası: {response.text}")
        
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
        print(f"Hata: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Hata: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

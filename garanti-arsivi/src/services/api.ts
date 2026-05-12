import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { decode } from 'base64-arraybuffer';

// Sizin Yeni Supabase Bilgileriniz
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY || 'your-anon-key';
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const OCR_API_KEY = process.env.EXPO_PUBLIC_OCR_API_KEY || 'K84237148488957'; 

const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

class DummyWebSocket {
  constructor() {}
  send() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
  realtime: {
    params: { eventsPerSecond: 0 },
    ...(isNode ? { transport: DummyWebSocket as any } : {}),
  },
});

export interface AnalysisResult {
  title: string;
  amount: string;
  date: string;
  summary: string;
  category?: string;
  currency?: string;
}

export interface OCRResponse {
  status: string;
  message: string;
  data: {
    filename: string;
    text: string;
    category: string;
    currency: string;
  };
}

export const fetchExchangeRates = async () => {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
    const data = await response.json();
    return data.rates; // returns rates relative to TRY
  } catch (error) {
    console.error("Döviz kurları alınamadı:", error);
    return null;
  }
};

export const uploadInvoice = async (
  uri: string, 
  filename: string, 
  mimeType: string, 
  category: string,
  documentType: 'warranty' | 'invoice' | 'mtv' | 'konut' | 'kontrat' | 'kredi' | 'kart' = 'warranty',
  finalText: string,
  base64Image?: string | null,
  amount?: number,
  dueDate?: string,
  currency: string = 'TRY'
): Promise<OCRResponse> => {
  
  try {
    console.log("1. Fotoğraf buluta (Supabase Storage) yükleniyor...");
    let imageUrl = null;
    
    if (base64Image) {
      try {
        const fileExt = uri.split('.').pop() || 'jpg';
        const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: storageError } = await supabase.storage
          .from('invoices')
          .upload(uniqueFileName, decode(base64Image), {
            contentType: mimeType || 'image/jpeg',
            upsert: false
          });
          
        if (!storageError) {
          const { data: publicUrlData } = supabase.storage.from('invoices').getPublicUrl(uniqueFileName);
          imageUrl = publicUrlData.publicUrl;
          console.log("✅ Fotoğraf başarıyla yüklendi:", imageUrl);
        } else {
          console.warn("Fotoğraf yükleme hatası:", storageError.message);
        }
      } catch (e) {
        console.warn("Fotoğraf yükleme sırasında hata oluştu:", e);
      }
    }

    console.log("2. Veritabanına kaydediliyor...");
    const insertPayload: any = {
      filename: filename,
      raw_text: finalText,
      category: category,
      type: documentType,
      amount: amount || null,
      currency: currency,
      due_date: dueDate ? dueDate.split('.').reverse().join('-') : null
    };
    
    if (imageUrl) {
      insertPayload.image_url = imageUrl;
    }

    const { error: dbError } = await supabase
      .from('invoices')
      .insert([insertPayload]);

    if (dbError) throw dbError;

    return {
      status: "success",
      message: "Belge başarıyla kaydedildi.",
      data: { filename, text: finalText, category }
    };
  } catch (error: any) {
    console.error("Kaydetme Hatası:", error);
    throw error;
  }
};

export const fetchInvoices = async () => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};

export const deleteInvoice = async (id: string) => {
  console.log(`Silme işlemi başlatıldı, ID: ${id}`);
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error("Supabase Silme Hatası:", error.message);
    throw error;
  }
  return true;
};

export const updateInvoiceDetails = async (id: string, updates: {
  filename?: string,
  amount?: number,
  due_date?: string,
  category?: string,
  type?: string,
  raw_text?: string
}) => {
  const { error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id);
    
  if (error) {
    console.error("Supabase Güncelleme Hatası:", error.message);
    throw error;
  }
  return true;
};

export const parseTurkishNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val || typeof val !== 'string') return 0;
  // Binlik ayırıcı olan noktaları sil, ondalık ayırıcı olan virgülü noktaya çevir
  const cleaned = val.replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const addManualRecord = async (
  title: string,
  amount: string,
  dueDate: string,
  category: string,
  type: string,
  additionalText?: string,
  currency: string = 'TRY'
) => {
  const { data, error } = await supabase
    .from('invoices')
    .insert([
      {
        filename: title,
        raw_text: additionalText || `Tutar: ${amount} ${currency}\nTarih: ${dueDate}`,
        category: category,
        type: type,
        amount: parseTurkishNumber(amount),
        currency: currency,
        due_date: dueDate.split('.').reverse().join('-') // GG.AA.YYYY -> YYYY-AA-GG
      }
    ]);

  if (error) {
    console.error("Manuel Kayıt Ekleme Hatası:", error.message);
    throw error;
  }
  return data;
};

export const analyzeDocument = async (uri: string, filename: string, mimeType: string, base64Image: string): Promise<AnalysisResult> => {
  if (!GROQ_API_KEY) {
    console.error("GROQ_API_KEY bulunamadı! Lütfen EXPO_PUBLIC_GROQ_API_KEY ortam değişkenini ayarlayın.");
    throw new Error("Yapılandırma hatası: API anahtarı eksik.");
  }

  try {
    const formData = new FormData();
    if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('file', blob, filename);
    } else {
        formData.append('file', { uri, name: filename, type: mimeType } as any);
    }
    formData.append('apikey', OCR_API_KEY);
    formData.append('language', 'tur');
    formData.append('filetype', 'JPG'); 

    const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData,
    });
    const ocrData = await ocrResponse.json();

    if (ocrData.OCRExitCode !== 1) {
      throw new Error('OCR Hatası: Metin okunamadı.');
    }
    const extractedText = ocrData.ParsedResults[0].ParsedText;

    const groqPrompt = `Sen profesyonel bir veri çıkarma asistanısın. Aşağıdaki karmaşık OCR metninden en doğru verileri ayıkla.
Hata yapmamaya odaklan, özellikle tutar kısmında belgedeki EN SON/EN ALT toplam rakamı (GENEL TOPLAM) baz al.

Çıkarılacak Bilgiler:
1. title: Şirket adı veya ürün adı (Örn: "Amazon Türkiye", "Türk Telekom").
2. amount: Belgedeki EN SON ve EN BÜYÜK toplam tutar. 
   TÜRKİYE SAYI FORMATI KURALLARI: 
   - VİRGÜL (,) her zaman kuruş (ondalık) ayracıdır. Örn: "1.250,50" -> "1250.50".
   - NOKTA (.) genellikle binlik ayırıcıdır ve SİLİNMELİDİR. Örn: "10.200" -> "10200.00".
   - Sadece noktadan sonra TAM 2 BASAMAK varsa ve başka virgül yoksa ondalık sayabilirsin.
   - Çıktı formatı sadece sayı olmalı (Örn: "10200.00").
3. currency: Belgedeki para birimi (TRY, USD, EUR, GBP). Belge üzerinde simge varsa ona göre belirle (₺=TRY, $=USD, €=EUR, £=GBP). Bulamazsan "TRY" döndür.
4. date: Belge üzerindeki işlem tarihi (Format: GG.AA.YYYY).
5. category: Belge içeriğine göre en uygun kategori.
6. summary: Belgenin içeriğini, ürün listesini ve hatırlatma önerisini içeren tamamen TÜRKÇE detaylı bir açıklama.

Yalnızca aşağıdaki formatta JSON döndür:
{
  "title": "...",
  "amount": "...",
  "currency": "...",
  "date": "...",
  "category": "...",
  "summary": "..."
}

OCR Metni:
${extractedText}`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: groqPrompt }],
        temperature: 0.1,
        max_tokens: 512,
        response_format: { type: "json_object" }
      })
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.text();
      console.error("Groq API Hatası:", errorData);
      throw new Error(`Yapay zeka analizi başarısız oldu: ${groqResponse.status}`);
    }
    
    const groqData = await groqResponse.json();
    const result = JSON.parse(groqData.choices[0].message.content);
    
    return {
      title: result.title || "",
      amount: result.amount || "",
      currency: result.currency || "TRY",
      date: result.date || "",
      category: result.category || "",
      summary: result.summary || ""
    };
  } catch (error) {
    console.error("Analiz Hatası:", error);
    throw error;
  }
};

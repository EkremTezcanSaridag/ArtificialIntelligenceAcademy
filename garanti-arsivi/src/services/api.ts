import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { decode } from 'base64-arraybuffer';

// Sizin Yeni Supabase Bilgileriniz
const SUPABASE_URL = 'https://xdomyuvycsvqttzkqqno.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ehmc2VEj97HvFBe6l2GIcA_qng5Uxqt';
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const OCR_API_KEY = 'K84237148488957'; 

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

export interface OCRResponse {
  status: string;
  message: string;
  data: {
    filename: string;
    text: string;
    category: string;
  };
}

export const uploadInvoice = async (
  uri: string, 
  filename: string, 
  mimeType: string, 
  category: string,
  documentType: 'warranty' | 'invoice' | 'mtv' | 'konut' | 'kontrat' | 'kredi' = 'warranty',
  additionalText?: string,
  base64Image?: string
): Promise<OCRResponse> => {
  
  try {
    console.log("1. OCR.space üzerinden metin okunuyor...");
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
    formData.append('isOverlayRequired', 'false');
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

    console.log("2. Groq Yapay Zekası ile metin düzeltiliyor...");
    const groqPrompt = `Aşağıda bir faturadan OCR ile okunmuş bozuk bir metin var. 
Lütfen bu metindeki okuma hatalarını düzelt ve uygulamamızın parse edebilmesi için KESİNLİKLE aşağıdaki şablona göre formatla.
Şablon:
Bitiş Tarihi: GG.AA.YYYY (Veya duruma göre: 'Satın Alma Tarihi: GG.AA.YYYY', 'Son Ödeme Tarihi: GG.AA.YYYY', 'Taksit Ödeme Günü: GG.AA.YYYY')
Tutar: 1500 (Sadece sayısal değer)
Vade: 6 (Sadece sayı, taksit varsa)
Hatırlatma: 1_week (Mevcut seçenekler: 1_minute, 1_week, 2_weeks, 1_month, 3_months)
Özet: Belgenin kimden/nereden geldiği ve ne olduğu hakkında 1 kısa cümle.

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
        max_tokens: 512
      })
    });

    let finalText = extractedText;
    if (groqResponse.ok) {
      const groqData = await groqResponse.json();
      const aiSummary = groqData.choices[0].message.content;
      finalText = additionalText ? `${additionalText}\n\n--- YAPAY ZEKA ÖZETİ ---\n${aiSummary}` : `--- YAPAY ZEKA ÖZETİ ---\n${aiSummary}`;
    } else {
      console.warn("Groq başarısız, orijinal OCR metni kullanılıyor.");
      finalText = additionalText ? `${additionalText}\n\n--- OCR METNİ ---\n${extractedText}` : extractedText;
    }

    console.log("3. Orijinal fotoğraf buluta (Supabase Storage) yükleniyor...");
    let imageUrl = null;
    try {
      const fileExt = uri.split('.').pop() || 'jpg';
      const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: storageData, error: storageError } = await supabase.storage
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
        console.warn("Fotoğraf yükleme hatası (Bucket oluşturulmamış veya yetki sorunu olabilir):", storageError.message);
      }
    } catch (e) {
      console.warn("Fotoğraf yükleme sırasında bir hata oluştu:", e);
    }

    const insertPayload: any = {
      filename: filename,
      raw_text: finalText,
      category: category,
      type: documentType
    };
    
    // Eğer fotoğraf başarıyla yüklendiyse public URL'ini DB'ye kaydet
    if (imageUrl) {
      insertPayload.image_url = imageUrl;
    }

    const { error: dbError } = await supabase
      .from('invoices')
      .insert([insertPayload]);

    if (dbError) throw dbError;

    return {
      status: "success",
      message: "Belge başarıyla analiz edildi, fotoğraf buluta kaydedildi.",
      data: { filename, text: finalText, category }
    };
  } catch (error: any) {
    console.error("Hata:", error);
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

export const updateInvoiceText = async (id: string, newText: string) => {
  const { error } = await supabase
    .from('invoices')
    .update({ raw_text: newText })
    .eq('id', id);
    
  if (error) {
    console.error("Supabase Güncelleme Hatası:", error.message);
    throw error;
  }
  return true;
};

export const addManualRecord = async (
  title: string,
  amount: string,
  dueDate: string,
  category: string,
  type: string,
  additionalText?: string
) => {
  const { data, error } = await supabase
    .from('invoices')
    .insert([
      {
        filename: title,
        raw_text: additionalText || `Tutar: ${amount} TL\nTarih: ${dueDate}`,
        category: category,
        type: type
      }
    ]);

  if (error) {
    console.error("Manuel Kayıt Ekleme Hatası:", error.message);
    throw error;
  }
  return data;
};

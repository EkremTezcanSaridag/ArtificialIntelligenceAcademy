import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY || '';
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const OCR_API_KEY = process.env.EXPO_PUBLIC_OCR_API_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface AnalysisResult {
  title: string;
  amount: string;
  currency: string;
  date: string;
  category: string;
  summary: string;
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

export const fetchInvoices = async () => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const deleteInvoice = async (id: string) => {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const updateInvoiceDetails = async (id: string, updates: any) => {
  const { error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id);
  
  if (error) throw error;
};

export const uploadInvoice = async (
  uri: string, 
  filename: string, 
  mimeType: string, 
  category: string,
  documentType: 'warranty' | 'invoice' | 'mtv' | 'konut' | 'kontrat' | 'kredi' | 'subscription' = 'warranty',
  finalText: string,
  base64Image?: string | null,
  amount?: number,
  dueDate?: string,
  currency: string = 'TRY'
) => {
  let publicUrl = '';

  // 1. Fotoğraf varsa Supabase Storage'a yükle
  if (base64Image) {
    console.log('1. Fotoğraf buluta (Supabase Storage) yükleniyor...');
    const { decode } = require('base64-arraybuffer');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(filename, decode(base64Image), { contentType: mimeType });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('invoices')
      .getPublicUrl(filename);
    
    publicUrl = urlData.publicUrl;
    console.log('✅ Fotoğraf başarıyla yüklendi:', publicUrl);
  }

  // 2. Veritabanına kaydet
  console.log('2. Veritabanına kaydediliyor...');
  const { error: dbError } = await supabase
    .from('invoices')
    .insert([
      { 
        filename, 
        image_url: publicUrl, 
        category, 
        type: documentType,
        raw_text: finalText,
        amount: amount || 0,
        due_date: dueDate || null,
        currency: currency
      }
    ]);

  if (dbError) throw dbError;

  return {
    status: "success",
    message: "Belge başarıyla kaydedildi.",
    data: { filename, text: finalText, category, currency }
  };
};

export const addManualRecord = async (
  title: string, 
  amount: string, 
  date: string, 
  category: string, 
  type: string, 
  description: string,
  currency: string = 'TRY'
) => {
  const numericAmount = parseTurkishNumber(amount);
  
  // GG.AA.YYYY -> YYYY-AA-GG
  const [d, m, y] = date.split('.');
  const isoDate = `${y}-${m}-${d}`;

  const { error } = await supabase
    .from('invoices')
    .insert([
      {
        filename: title,
        amount: numericAmount,
        due_date: isoDate,
        category,
        type,
        raw_text: description,
        currency
      }
    ]);

  if (error) throw error;
};

export const parseTurkishNumber = (val: string): number => {
  if (!val) return 0;
  // "1.250,50" -> 1250.50
  const cleaned = val.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

export const fetchExchangeRates = async () => {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error("Döviz kurları alınamadı:", error);
    return null;
  }
};

export const analyzeDocument = async (uri: string, filename: string, mime: string, base64: string): Promise<AnalysisResult> => {
  if (!GROQ_API_KEY) throw new Error("Groq API anahtarı eksik");

  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.2-11b-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Sen profesyonel bir döküman analiz asistanısın. Bu dökümandan şu bilgileri ayıkla:
                1. title: Şirket adı veya döküman konusu.
                2. amount: Toplam tutar (Sayısal, nokta ondalık ayırıcı olmalı).
                3. currency: Para birimi (TRY, USD, EUR, GBP).
                4. date: İşlem tarihi (GG.AA.YYYY).
                5. category: En uygun kategori.
                6. summary: Detaylı Türkçe özet.

                Yanıtı yalnızca JSON formatında döndür.`
              },
              {
                type: "image_url",
                image_url: { url: `data:${mime};base64,${base64}` }
              }
            ]
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

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

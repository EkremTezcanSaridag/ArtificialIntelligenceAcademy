import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

// Sizin Yeni Supabase Bilgileriniz
const SUPABASE_URL = 'https://xdomyuvycsvqttzkqqno.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ehmc2VEj97HvFBe6l2GIcA_qng5Uxqt';
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
  additionalText?: string
): Promise<OCRResponse> => {
  const formData = new FormData();
  
  if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append('file', blob, filename);
  } else {
      formData.append('file', {
        uri,
        name: filename,
        type: mimeType,
      } as any);
  }
  
  formData.append('apikey', OCR_API_KEY);
  formData.append('language', 'tur');
  formData.append('isOverlayRequired', 'false');
  formData.append('filetype', 'JPG'); 

  try {
    console.log("OCR.space üzerinden analiz başlatılıyor...");
    const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData,
    });

    const ocrData = await ocrResponse.json();

    if (ocrData.OCRExitCode !== 1) {
      const errorDetail = ocrData.ErrorMessage || ocrData.ErrorDetails || 'Metin okunamadı.';
      throw new Error('OCR Hatası: ' + errorDetail);
    }

    const extractedText = ocrData.ParsedResults[0].ParsedText;
    const finalText = additionalText ? `${additionalText}\n\n--- OCR Metni ---\n${extractedText}` : extractedText;

    const { error: dbError } = await supabase
      .from('invoices')
      .insert([
        {
          filename: filename,
          raw_text: finalText,
          category: category,
          type: documentType
        }
      ]);

    if (dbError) {
        throw dbError;
    }

    return {
      status: "success",
      message: "Belge başarıyla analiz edildi ve sizin veri tabanınıza kaydedildi.",
      data: { filename, text: extractedText, category }
    };
  } catch (error: any) {
    console.error("OCR/DB Error:", error);
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

export const addManualRecord = async (
  title: string,
  amount: string,
  dueDate: string,
  category: string,
  type: string
) => {
  const { data, error } = await supabase
    .from('invoices')
    .insert([
      {
        filename: title,
        raw_text: `Tutar: ${amount} TL\nTarih: ${dueDate}`,
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

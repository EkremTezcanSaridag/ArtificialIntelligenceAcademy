import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ufmrxjgtgderafljgsgt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmbXJ4amd0Z2RlcmFmbGpnc2d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDEyNzQsImV4cCI6MjA5MzQ3NzI3NH0.lv77ucbr_kQYF9Glg0nu4UK2aITdSRM3ejHADEaV73A';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const getBackendUrl = () => {
  // Telefonunuzun ve bilgisayarınızın aynı Wi-Fi ağında (10.27.6.20) olması gerekir.
  // Eğer ağ değiştirirseniz buradaki IP'yi ipconfig ile güncelleyebilirsiniz.
  return 'http://10.27.6.20:8000';
};

const BACKEND_URL = getBackendUrl();

export interface OCRResponse {
  status: string;
  message: string;
  data: {
    filename: string;
    text: string;
    category: string;
  };
}

export const uploadInvoice = async (uri: string, filename: string, type: string, category: string): Promise<OCRResponse> => {
  const formData = new FormData();
  
  if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append('file', blob, filename);
  } else {
      formData.append('file', {
        uri,
        name: filename,
        type: type,
      } as any);
  }
  
  formData.append('category', category);

  try {
    const response = await fetch(`${BACKEND_URL}/api/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || 'Yükleme sırasında hata oluştu');
    }

    return await response.json();
  } catch (error: any) {
    console.error("Upload Error:", error);
    throw error;
  }
};

export const fetchInvoices = async () => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Fetch Error Detail:", JSON.stringify(error), "Message:", error.message);
    throw error;
  }
  
  return data;
};

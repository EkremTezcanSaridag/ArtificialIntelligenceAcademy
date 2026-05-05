import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Bildirim işleyicisini kuran yardımcı fonksiyon
const setupNotificationHandler = () => {
  if (isExpoGo && Platform.OS === 'android') return;
  
  try {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (error) {
    console.log('Notification handler could not be set:', error);
  }
};

// İlk yüklemede çalıştır
setupNotificationHandler();

export async function registerForPushNotificationsAsync() {
  // Expo Go Android için erken dönüş
  if (isExpoGo && Platform.OS === 'android') {
    console.warn('Expo Go Android üzerinde bildirim desteği kısıtlıdır.');
    return false;
  }

  try {
    const Notifications = require('expo-notifications');
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366f1',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Bildirim izni alınamadı!');
        return false;
      }
      return true;
    } else {
      console.log('Fiziksel bir cihaz kullanmalısınız (Bildirimler için).');
      return false;
    }
  } catch (error) {
    console.error('Notification registration error:', error);
    return false;
  }
}

export async function scheduleWarrantyNotification(
  itemName: string,
  expirationDate: Date,
  notifyBefore: '1_week' | '1_month' | 'both' | 'none'
) {
  if (notifyBefore === 'none') return;

  // Expo Go Android için bildirim zamanlamayı atla (hata vermemesi için)
  if (isExpoGo && Platform.OS === 'android') {
    console.log('Expo Go Android üzerinde bildirim zamanlama atlandı.');
    return;
  }

  try {
    const Notifications = require('expo-notifications');

    const scheduleNotification = async (daysBefore: number, title: string, body: string) => {
      const triggerDate = new Date(expirationDate);
      triggerDate.setDate(triggerDate.getDate() - daysBefore);

      // Sadece gelecek tarihler için bildirim kur
      if (triggerDate.getTime() > Date.now()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: { itemName, expirationDate: expirationDate.toISOString() },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          },
        });
        console.log(`Bildirim zamanlandı: ${title} -> Tarih: ${triggerDate.toLocaleDateString()}`);
      }
    };

    if (notifyBefore === '1_week' || notifyBefore === 'both') {
      await scheduleNotification(
        7,
        'Garanti Süresi Yaklaşıyor! ⏳',
        `"${itemName}" adlı ürününüzün garanti süresinin bitmesine 1 hafta kaldı.`
      );
    }

    if (notifyBefore === '1_month' || notifyBefore === 'both') {
      await scheduleNotification(
        30,
        'Garanti Süresi Uyarısı 📅',
        `"${itemName}" adlı ürününüzün garanti süresinin bitmesine 1 ay kaldı.`
      );
    }
  } catch (error) {
    console.error('Notification scheduling error:', error);
  }
}

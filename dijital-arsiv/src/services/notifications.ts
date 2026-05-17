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

export type ReminderOption = '1_minute' | '1_week' | '2_weeks' | '3_weeks' | '1_month' | '2_months' | '3_months';

const REMINDER_DAYS: Record<ReminderOption, number> = {
  '1_minute': 0, // daysBefore = 0, but we will handle it specially
  '1_week': 7,
  '2_weeks': 14,
  '3_weeks': 21,
  '1_month': 30,
  '2_months': 60,
  '3_months': 90,
};

const REMINDER_LABELS: Record<ReminderOption, string> = {
  '1_minute': '1 dakika',
  '1_week': '1 hafta',
  '2_weeks': '2 hafta',
  '3_weeks': '3 hafta',
  '1_month': '1 ay',
  '2_months': '2 ay',
  '3_months': '3 ay',
};

export async function scheduleReminderNotification(
  itemName: string,
  targetDate: Date,
  reminders: ReminderOption[],
  docTypeLabel: string
) {
  if (reminders.length === 0) return;
  if (isExpoGo && Platform.OS === 'android') return;

  try {
    const Notifications = require('expo-notifications');

    for (const reminder of reminders) {
      const daysBefore = REMINDER_DAYS[reminder];
      const label = REMINDER_LABELS[reminder];
      const triggerDate = new Date(targetDate);
      
      if (reminder === '1_minute') {
        // Test amaçlı: Şu andan tam 1 dakika sonraya kur
        triggerDate.setTime(Date.now() + 60 * 1000);
      } else {
        triggerDate.setDate(triggerDate.getDate() - daysBefore);
      }

      if (triggerDate.getTime() > Date.now()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${docTypeLabel} Hatırlatma ⏰`,
            body: `"${itemName}" için son tarihe ${label} kaldı.`,
            data: { itemName, targetDate: targetDate.toISOString() },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          },
        });
        console.log(`Bildirim zamanlandı: ${itemName} → ${label} kala (${triggerDate.toLocaleDateString()})`);
      }
    }
  } catch (error) {
    console.error('Reminder notification scheduling error:', error);
  }
}

export async function sendTestNotification() {
  if (isExpoGo && Platform.OS === 'android') {
    // SDK 53 ile birlikte Expo Go Android'de expo-notifications desteği tamamen kaldırıldı.
    // Bu yüzden Expo Go'da test ederken çökmeyi önlemek için Alert gösteriyoruz.
    const { Alert } = require('react-native');
    Alert.alert(
      "Test Bildirimi 🚀 (Expo Go)", 
      "Bildirim sisteminiz başarıyla çalışıyor! (Gerçek bildirimler Development Build veya iOS üzerinde görünecektir.)"
    );
    console.log("Test bildirimi (Alert) gösterildi.");
    return;
  }

  try {
    const Notifications = require('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Bildirimi 🚀",
        body: "Bildirim sisteminiz başarıyla çalışıyor!",
        data: { test: true },
      },
      trigger: null, // Send immediately
    });
    console.log("Test bildirimi gönderildi.");
  } catch (error) {
    console.error("Test bildirimi hatası:", error);
  }
}

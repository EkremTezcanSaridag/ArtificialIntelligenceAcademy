import { Tabs, useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider as NavThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Platform, View } from 'react-native';
import { ThemeProvider as CustomThemeProvider, useTheme } from '../src/context/ThemeContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import CustomSplash from '../components/CustomSplash';

// Native splash hemen kapanmasın
SplashScreen.preventAutoHideAsync();

function TabLayout() {
  const { isDark, toggleTheme } = useTheme();
  const { session, loading: authLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(Platform.OS !== 'web');
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    // Splash ekranını gizle
    SplashScreen.hideAsync();

    // 2 saniye sonra custom splash'i kapat
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    // Auth Yönlendirmesi
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!session && !inAuthGroup) {
      router.replace('/login');
    } else if (session && inAuthGroup) {
      router.replace('/');
    }

    return () => clearTimeout(timer);
  }, [session, authLoading, segments]);

  if (showSplash || authLoading) {
    return <CustomSplash />;
  }

  // Login ekranında tab bar gösterme
  if (segments[0] === 'login' || segments[0] === 'register') {
    return <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }} />;
  }

  return (
    <NavThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: 'transparent',
            borderBottomWidth: 0,
            elevation: 0,
            shadowOpacity: 0
          },
          headerTintColor: isDark ? '#ffffff' : '#000000',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: '900',
            letterSpacing: 0.5,
            fontSize: 18
          },
          headerRight: () => (
            <Pressable onPress={toggleTheme} style={{ marginRight: 24, justifyContent: 'center', alignItems: 'center' }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name={isDark ? "sunny" : "moon"} size={24} color={isDark ? "#ffffff" : "#000000"} />
            </Pressable>
          ),
          tabBarStyle: {
            backgroundColor: isDark ? '#09090b' : '#ffffff',
            borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 80 : 55 + insets.bottom,
            paddingBottom: Platform.OS === 'ios' ? 24 : Math.max(insets.bottom - 15, 8),
            paddingTop: 8,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
          },
          tabBarActiveTintColor: '#6366f1',
          tabBarInactiveTintColor: isDark ? '#52525b' : '#a1a1aa',
          sceneStyle: { backgroundColor: isDark ? '#09090b' : '#f4f4f5' }
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            headerShown: false,
            title: 'Arşiv',
            tabBarIcon: ({ color }) => <Ionicons name="folder-open" size={26} color={color} />,
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '700',
              marginTop: 4
            }
          }}
        />

        <Tabs.Screen
          name="stats"
          options={{
            headerShown: false,
            title: 'İstatistikler',
            tabBarIcon: ({ color }) => <Ionicons name="pie-chart" size={26} color={color} />,
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '700',
              marginTop: 4
            }
          }}
        />

        <Tabs.Screen
          name="add"
          options={{
            title: 'Yeni Kayıt Ekle',
            href: null,
            tabBarStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen name="login" options={{ href: null }} />
        <Tabs.Screen name="register" options={{ href: null }} />
        <Tabs.Screen name="profil" options={{ href: null, headerShown: false }} />
      </Tabs>
    </NavThemeProvider>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <CustomThemeProvider>
        <TabLayout />
      </CustomThemeProvider>
    </AuthProvider>
  );
}

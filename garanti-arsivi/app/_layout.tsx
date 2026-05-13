import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider as NavThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Platform } from 'react-native';
import { ThemeProvider as CustomThemeProvider, useTheme } from '../src/context/ThemeContext';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import CustomSplash from '../components/CustomSplash';

// Native splash hemen kapanmasın
SplashScreen.preventAutoHideAsync();

function TabLayout() {
  const { isDark, toggleTheme } = useTheme();
  const [showSplash, setShowSplash] = useState(false); // Test için false yapıldı

  useEffect(() => {
    // Uygulama yüklenir yüklenmez splash ekranını zorla kapat
    async function prepare() {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn(e);
      }
    }
    prepare();
  }, []);

  // Custom splash ekranını göster
  if (showSplash) {
    return <CustomSplash />;
  }

  return (
    <NavThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar 
        style={isDark ? "light" : "dark"} 
        backgroundColor={isDark ? "#09090b" : "#f4f4f5"}
        translucent={true}
      />
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
            height: Platform.OS === 'ios' ? 80 : 65,
            paddingBottom: Platform.OS === 'ios' ? 24 : 8,
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
            tabBarIcon: ({ color }) => <Ionicons name="shield-checkmark" size={26} color={color} />,
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
      </Tabs>
    </NavThemeProvider>
  );
}

export default function Layout() {
  return (
    <CustomThemeProvider>
      <TabLayout />
    </CustomThemeProvider>
  );
}

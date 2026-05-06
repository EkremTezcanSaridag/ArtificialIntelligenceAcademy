import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider as NavThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { View, Pressable } from 'react-native';
import { ThemeProvider as CustomThemeProvider, useTheme } from '../src/context/ThemeContext';

function TabLayout() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <NavThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: isDark ? '#09090b' : '#ffffff',
            borderBottomWidth: 1,
            borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
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
            backgroundColor: isDark ? 'rgba(9, 9, 11, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            position: 'absolute',
            elevation: 0,
            height: 65,
            paddingBottom: 10,
            paddingTop: 10
          },
          tabBarActiveTintColor: '#6366f1',
          tabBarInactiveTintColor: isDark ? '#52525b' : '#a1a1aa',
          sceneStyle: { backgroundColor: isDark ? '#09090b' : '#f4f4f5' }
        }}
      >
        <Tabs.Screen 
          name="index" 
          options={{ 
            title: 'Garanti Arşivi', 
            tabBarIcon: ({ color, size, focused }) => (
                <View style={focused ? { backgroundColor: 'rgba(99, 102, 241, 0.15)', padding: 8, borderRadius: 16 } : { padding: 8 }}>
                    <Ionicons name="shield-checkmark" size={size} color={color} />
                </View>
            )
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

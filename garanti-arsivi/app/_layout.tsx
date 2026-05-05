import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

export default function Layout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: '#09090b',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.05)',
            elevation: 0,
            shadowOpacity: 0
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: '900',
            letterSpacing: 0.5,
            fontSize: 20
          },
          tabBarStyle: {
            backgroundColor: 'rgba(9, 9, 11, 0.95)',
            borderTopColor: 'rgba(255,255,255,0.05)',
            position: 'absolute',
            elevation: 0,
            height: 65,
            paddingBottom: 10,
            paddingTop: 10
          },
          tabBarActiveTintColor: '#a78bfa',
          tabBarInactiveTintColor: '#52525b',
          sceneStyle: { backgroundColor: '#09090b' }
        }}
      >
        <Tabs.Screen 
          name="index" 
          options={{ 
            title: 'Garantilerim', 
            tabBarIcon: ({ color, size, focused }) => (
                <View style={focused ? { backgroundColor: 'rgba(139, 92, 246, 0.15)', padding: 8, borderRadius: 16 } : { padding: 8 }}>
                    <Ionicons name="shield-checkmark" size={size} color={color} />
                </View>
            )
          }} 
        />
        <Tabs.Screen 
          name="add" 
          options={{ 
            title: 'Tarayıcı', 
            tabBarIcon: ({ color, size, focused }) => (
                <View style={focused ? { backgroundColor: 'rgba(139, 92, 246, 0.15)', padding: 8, borderRadius: 16 } : { padding: 8 }}>
                    <Ionicons name="scan" size={size} color={color} />
                </View>
            )
          }} 
        />
      </Tabs>
    </ThemeProvider>
  );
}

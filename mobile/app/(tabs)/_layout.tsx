import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { Home, CreditCard, BarChart3, Menu, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme';

interface TabIconProps {
  icon: LucideIcon;
  label: string;
  focused: boolean;
}

function TabIcon({ icon: Icon, label, focused }: TabIconProps) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Icon
        size={22}
        color={focused ? colors.accent.primary : colors.text.tertiary}
        strokeWidth={2}
      />
      {focused && (
        <Text style={{ fontSize: 10, fontFamily: 'Pretendard-SemiBold', color: colors.accent.primary }}>
          {label}
        </Text>
      )}
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg.screen,
          borderTopColor: colors.system.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 64,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={Home} label="홈" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={CreditCard} label="거래" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={BarChart3} label="분석" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={Menu} label="더보기" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

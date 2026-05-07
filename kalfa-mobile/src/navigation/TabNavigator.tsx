import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors, FontSize, Spacing } from '../theme/colors';
import HomeScreen from '../screens/HomeScreen';
import InventoryScreen from '../screens/InventoryScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_LABELS: Record<keyof TabParamList, string> = {
  Home: 'Ana Sayfa',
  Inventory: 'Stok',
  Payments: 'Ödemeler',
  Analytics: 'Analiz',
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.bar}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = TAB_LABELS[route.name as keyof TabParamList];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.indicator, focused && styles.indicatorActive]} />
            <Text style={[styles.label, focused ? styles.labelActive : styles.labelInactive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    height: 60,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: '60%',
    height: 2.5,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: Colors.primary,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  labelInactive: {
    color: Colors.textTertiary,
  },
});

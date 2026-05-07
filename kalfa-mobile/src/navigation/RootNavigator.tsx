import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { shopApi } from '../api/shop';
import TabNavigator from './TabNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PlusModal from '../modals/PlusModal';
import MinusModal from '../modals/MinusModal';
import SaleModal from '../modals/SaleModal';
import CollectionModal from '../modals/CollectionModal';
import ExpenseModal from '../modals/ExpenseModal';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import AddProductScreen from '../screens/AddProductScreen';
import AddDebtScreen from '../screens/AddDebtScreen';
import { Colors } from '../theme/colors';
import type { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'Tabs' | null>(null);

  useEffect(() => {
    shopApi.get()
      .then((profile) => {
        if (profile && profile.onboarding_complete) {
          setInitialRoute('Tabs');
        } else {
          setInitialRoute('Onboarding');
        }
      })
      .catch(() => setInitialRoute('Onboarding'));
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, gap: 24 }}>
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: 240, height: 90 }}
          resizeMode="contain"
        />
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="Settings" component={SettingsScreen} />

      {/* Modallar — ekranın altından kayar */}
      <Stack.Group
        screenOptions={{
          presentation: 'transparentModal',
          cardOverlayEnabled: true,
          cardStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="PlusModal" component={PlusModal} />
        <Stack.Screen name="MinusModal" component={MinusModal} />
        <Stack.Screen name="SaleModal" component={SaleModal} />
        <Stack.Screen name="CollectionModal" component={CollectionModal} />
        <Stack.Screen name="ExpenseModal" component={ExpenseModal} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="AddProduct" component={AddProductScreen} />
        <Stack.Screen name="AddDebt" component={AddDebtScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}

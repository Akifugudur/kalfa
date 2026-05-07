import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

// Root stack — modal ekranlar buradan açılır
export type RootStackParamList = {
  Onboarding: undefined;
  Tabs: undefined;
  Settings: undefined;
  PlusModal: undefined;
  MinusModal: undefined;
  SaleModal: { productId?: string };
  CollectionModal: { debtId?: string; personName?: string };
  ExpenseModal: { category?: string };
  ProductDetail: { productId: string };
  AddProduct: undefined;
  AddDebt: { direction: 'i_owe' | 'they_owe' };
};

// Alt navigasyon sekmeleri
export type TabParamList = {
  Home: undefined;
  Inventory: undefined;
  Payments: undefined;
  Analytics: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  StackScreenProps<RootStackParamList>
>;

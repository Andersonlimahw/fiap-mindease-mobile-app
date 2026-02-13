import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Tasks: undefined;
  Pomodoro: undefined;
  FocusMode: undefined;
  Chat: undefined;
};

export type RootStackParamList = {
  App: undefined;
  User: undefined;
  Accessibility: undefined;
};

// Navigation props for screens in the Auth stack
export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<AuthStackParamList, T>;

// Navigation props for screens in the App stack
export type AppScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

// Navigation props for tab screens
export type TabScreenProps<T extends keyof AppTabParamList> = {
  navigation: any; // We'll use the specific type when needed
  route: {
    params: AppTabParamList[T];
  };
};

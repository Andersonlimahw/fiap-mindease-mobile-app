import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Animated, Alert, Switch } from "react-native";
import { Button } from "@components/Button";
import { useAuth } from "@store/authStore";
import { useFadeSlideInOnFocus } from "@presentation/hooks/animations";
import AppConfig from "@config/appConfig";
import { useTheme } from "@presentation/theme/theme";
import { makeLoginStyles } from "./LoginScreen.styles";
import { useI18n } from "@presentation/i18n/I18nProvider";
import { BrandLogo } from "@components/BrandLogo";
import { AuthScreenProps } from "@presentation/navigation/types";
import { useBiometricAuth } from "@presentation/hooks";
import { BiometricLock } from "@components/BiometricLock";

export const LoginScreen: React.FC<AuthScreenProps<"Login">> = ({
  navigation,
}) => {
  const { signIn } = useAuth();
  const [providerLoading, setProviderLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { animatedStyle } = useFadeSlideInOnFocus();
  const { t } = useI18n();
  const theme = useTheme();
  const styles = useMemo(() => makeLoginStyles(theme), [theme]);
  const {
    isAvailable: biometricAvailable,
    isEnabled: biometricEnabled,
    loading: biometricLoading,
    setEnabled: setBiometricEnabled,
    biometricTypeName,
  } = useBiometricAuth();
  const [biometricError, setBiometricError] = useState<string | null>(null);

  const handleGoogleSignInError = (error: any) => {
    console.error("Google Sign-In Error:", error);

    // Handle specific error cases
    let errorMessage = t("auth.googleLoginFailed");

    if (error?.code === "SIGN_IN_CANCELLED") {
      errorMessage = t("auth.loginCancelled");
    } else if (error?.code === "IN_PROGRESS") {
      // Another sign-in is in progress, handle if needed
      console.log("Sign in already in progress");
      return;
    } else if (error?.code === "PLAY_SERVICES_NOT_AVAILABLE") {
      errorMessage = t("auth.playServicesMissing");
    } else if (error?.code === "SIGN_IN_REQUIRED") {
      errorMessage = t("auth.signInRequired");
    } else if (error?.message) {
      // Handle other Firebase/Google Sign-In specific errors
      if (error.message.includes("network error")) {
        errorMessage = t("common.networkError");
      } else if (error.message.includes("invalid token")) {
        errorMessage = t("auth.invalidToken");
      } else if (error.message.includes("Firebase config is missing")) {
        errorMessage = t("auth.firebaseNotConfigured");
      } else if (error.message.includes("Client ID não configurado")) {
        errorMessage = t("auth.notConfiguredFirebase");
      }
    }

    setError(errorMessage);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setBiometricError(null);
    try {
      setProviderLoading(true);
      await signIn("google");
      console.log("Success on Google Sign-In");
      // The RootNavigator will handle the navigation based on auth state
      // No need to navigate manually here
    } catch (error: Error | any) {
      handleGoogleSignInError(error);
    } finally {
      setProviderLoading(false);
    }
  };

  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => {
        Alert.alert(t("common.errorTitle"), error || t("common.unknownError"));
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  const handleToggleBiometric = async (value: boolean) => {
    setBiometricError(null);
    try {
      await setBiometricEnabled(value);
    } catch (toggleError) {
      const message =
        toggleError instanceof Error && toggleError.message
          ? toggleError.message
          : t("auth.biometricEnableError");
      setBiometricError(message);
    }
  };

  const biometricLockMessage = t("auth.biometricLockMessage").replace(
    "{{method}}",
    biometricTypeName
  );

  const biometricToggleLabel = t("auth.biometricToggleLabel").replace(
    "{{method}}",
    biometricTypeName
  );

  const loginContent = (
    <>
      <BrandLogo />
      <Text style={styles.title}>{t("auth.welcome")}</Text>
      <Text style={styles.subtitle}>{t("auth.continue")}</Text>

      <View style={styles.spacerMd} />
      <Button
        title={t("auth.google")}
        loading={providerLoading}
        disabled={providerLoading}
        onPress={async () => handleGoogleSignIn()}
      />
      <View style={styles.spacerSm} />
      {AppConfig.useMock && (
        <Text style={styles.hint}>{t("auth.mockHint")}</Text>
      )}

      {biometricAvailable ? (
        <View style={styles.biometricCard}>
          <View style={styles.biometricRow}>
            <View style={styles.biometricTextGroup}>
              <Text style={styles.biometricTitle}>{t("auth.biometricTitle")}</Text>
              <Text style={styles.biometricDescription}>
                {t("auth.biometricToggleDescription")}
              </Text>
            </View>
            <Switch
              testID="biometric-toggle"
              value={biometricEnabled}
              onValueChange={handleToggleBiometric}
              disabled={biometricLoading}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={biometricEnabled ? theme.colors.background : theme.colors.card}
            />
          </View>
          <Text style={styles.biometricLabel}>{biometricToggleLabel}</Text>
          {biometricError && (
            <Text style={styles.biometricError}>{biometricError}</Text>
          )}
        </View>
      ) : (
        !biometricLoading && (
          <Text style={styles.biometricHint}>
            {t("auth.biometricNotAvailable")}
          </Text>
        )
      )}
    </>
  );

  return (
    <Animated.View style={[styles.container, animatedStyle as any]}>
      <BiometricLock
        requireAuth={biometricAvailable && biometricEnabled}
        message={biometricLockMessage}
        onAuthenticated={() => setBiometricError(null)}
        onAuthFailed={(reason) =>
          setBiometricError(reason || t("auth.biometricEnableError"))
        }
      >
        {loginContent}
      </BiometricLock>
    </Animated.View>
  );
};

/** styles moved to LoginScreen.styles.ts */

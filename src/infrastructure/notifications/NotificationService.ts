import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { PERMISSIONS, request, check, RESULTS } from 'react-native-permissions';

export type FcmMessageHandler = (
  title: string,
  body: string,
  data?: Record<string, string>
) => void;

let onMessageHandler: FcmMessageHandler | null = null;
let unsubscribeForeground: (() => void) | null = null;
let initialized = false;

/**
 * NotificationService — gerencia FCM: permissões, token, handlers foreground/background.
 * Singleton stateless via objeto exportado.
 */
export const NotificationService = {
  /**
   * Solicita permissão de notificação ao usuário.
   * iOS: usa firebase messaging (authorizationStatus)
   * Android 13+: usa react-native-permissions (POST_NOTIFICATIONS)
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        return (
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL
        );
      }

      if (Platform.OS === 'android') {
        const sdk = Number(Platform.Version);
        if (sdk >= 33) {
          const POST_NOTIFICATIONS = 'android.permission.POST_NOTIFICATIONS' as any;
          const status = await check(POST_NOTIFICATIONS);
          if (status === RESULTS.GRANTED) return true;
          const result = await request(POST_NOTIFICATIONS);
          return result === RESULTS.GRANTED;
        }
        // Android < 13: permissão concedida por padrão
        return true;
      }

      return false;
    } catch (error) {
      console.error('[NotificationService] requestPermission error:', error);
      return false;
    }
  },

  /**
   * Obtém o token FCM do dispositivo.
   * No iOS, registra o dispositivo para remote messages antes de obter o token.
   */
  async getFcmToken(): Promise<string | null> {
    try {
      console.log('[NotificationService] Getting FCM token...');
      // iOS requer registro explícito antes de chamar getToken()
      if (Platform.OS === 'ios') {
        console.log('[NotificationService] Registering device for remote messages (iOS)...');
        await messaging().registerDeviceForRemoteMessages();
      }
      const token = await messaging().getToken();
      console.log('[NotificationService] Get new FCM registration token:', token);
      return token;
    } catch (error) {
      console.error('[NotificationService] getFcmToken error:', error);
      return null;
    }
  },

  /**
   * Inicializa o serviço: solicita permissão, obtém token, registra handlers.
   * Retorna o token FCM ou null se permissão negada.
   * Idempotente: chamadas subsequentes retornam o token atual sem re-inicializar.
   */
  async init(onMessage?: FcmMessageHandler): Promise<string | null> {
    console.log('[NotificationService] Initializing...');
    if (initialized) {
      const token = await this.getFcmToken();
      console.log('[NotificationService] Already initialized. Token:', token);
      return token;
    }
    initialized = true;

    if (onMessage) {
      onMessageHandler = onMessage;
    }

    const granted = await this.requestPermission();
    console.log('[NotificationService] Permission granted:', granted);
    if (!granted) {
      console.log('[NotificationService] Notification permission denied');
      return null;
    }

    const token = await this.getFcmToken();
    if (!token) {
      console.warn('[NotificationService] Failed to get FCM token');
      return null;
    }

    // Handler para mensagens em foreground
    if (unsubscribeForeground) unsubscribeForeground();
    unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      const title = remoteMessage.notification?.title ?? 'MindEase';
      const body = remoteMessage.notification?.body ?? '';
      const data = (remoteMessage.data ?? {}) as Record<string, string>;
      console.log('[NotificationService] Foreground message received:', { title, body, data });
      onMessageHandler?.(title, body, data);
    });

    // Handler para refresh de token
    messaging().onTokenRefresh((token) => {
      console.log('[NotificationService] FCM token refreshed:', token);
    });

    // Handler: app aberto via notificação (background → foreground)
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('[NotificationService] App opened from background state:', {
        messageId: remoteMessage.messageId,
        notification: remoteMessage.notification,
        data: remoteMessage.data
      });
    });

    // Handler: app estava fechado (quit state)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('[NotificationService] App opened from quit state:', {
            messageId: remoteMessage.messageId,
            notification: remoteMessage.notification,
            data: remoteMessage.data
          });
        }
      });

    return token;
  },

  /**
   * Atualiza o handler de mensagens FCM em foreground.
   */
  setOnMessageHandler(handler: FcmMessageHandler) {
    onMessageHandler = handler;
  },

  /**
   * Limpa listeners e reseta estado. Use ao fazer sign out.
   */
  cleanup() {
    if (unsubscribeForeground) {
      unsubscribeForeground();
      unsubscribeForeground = null;
    }
    onMessageHandler = null;
    initialized = false;
  },
};

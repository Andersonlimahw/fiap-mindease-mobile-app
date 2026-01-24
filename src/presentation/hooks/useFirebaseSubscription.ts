import { useEffect, useRef, useCallback, useState } from 'react';

type UnsubscribeFn = () => void;

type SubscriptionOptions = {
  /** Se deve pausar a subscription quando o app está em background */
  pauseInBackground?: boolean;
  /** Callback para erros */
  onError?: (error: Error) => void;
  /** Se está habilitado (pode ser usado para condicional) */
  enabled?: boolean;
};

/**
 * Hook para gerenciar subscriptions Firebase com unsubscribe automático
 *
 * Garante que subscriptions são limpas quando:
 * - O componente desmonta
 * - As dependências mudam
 * - A subscription é desabilitada
 *
 * @example
 * // Subscription simples
 * useFirebaseSubscription(
 *   () => repo.subscribeRecent(userId, 10, setTransactions),
 *   [userId]
 * );
 *
 * // Com opções
 * useFirebaseSubscription(
 *   () => repo.subscribeRecent(userId, 10, setTransactions),
 *   [userId],
 *   {
 *     enabled: !!userId,
 *     onError: (e) => console.error(e),
 *   }
 * );
 */
export function useFirebaseSubscription(
  subscribeFn: () => UnsubscribeFn | undefined,
  deps: React.DependencyList,
  options: SubscriptionOptions = {}
): { isSubscribed: boolean; resubscribe: () => void } {
  const { enabled = true, onError } = options;
  const unsubscribeRef = useRef<UnsubscribeFn | undefined>(undefined);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const subscribeFnRef = useRef(subscribeFn);
  const onErrorRef = useRef(onError);

  // Atualiza refs
  subscribeFnRef.current = subscribeFn;
  onErrorRef.current = onError;

  const subscribe = useCallback(() => {
    // Limpa subscription anterior se existir
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = undefined;
    }

    if (!enabled) {
      setIsSubscribed(false);
      return;
    }

    try {
      const unsub = subscribeFnRef.current();
      if (unsub) {
        unsubscribeRef.current = unsub;
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('[useFirebaseSubscription] Erro ao criar subscription:', error);
      if (onErrorRef.current) onErrorRef.current(error as Error);
      setIsSubscribed(false);
    }
  }, [enabled]);

  // Cria subscription quando deps mudam
  useEffect(() => {
    subscribe();

    // Cleanup: unsubscribe quando componente desmonta ou deps mudam
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = undefined;
        setIsSubscribed(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Função para forçar resubscription
  const resubscribe = useCallback(() => {
    subscribe();
  }, [subscribe]);

  return { isSubscribed, resubscribe };
}

/**
 * Hook para gerenciar múltiplas subscriptions Firebase
 *
 * @example
 * const { addSubscription, clearAll } = useFirebaseSubscriptions();
 *
 * useEffect(() => {
 *   addSubscription('transactions', repo.subscribeRecent(userId, 10, setTx));
 *   addSubscription('balance', repo.subscribeBalance(userId, setBal));
 * }, [userId]);
 */
export function useFirebaseSubscriptions() {
  const subscriptions = useRef<Map<string, UnsubscribeFn>>(new Map());

  const addSubscription = useCallback((key: string, unsubscribe: UnsubscribeFn) => {
    // Remove subscription anterior com mesma key
    const existing = subscriptions.current.get(key);
    if (existing) {
      existing();
    }
    subscriptions.current.set(key, unsubscribe);
  }, []);

  const removeSubscription = useCallback((key: string) => {
    const unsub = subscriptions.current.get(key);
    if (unsub) {
      unsub();
      subscriptions.current.delete(key);
    }
  }, []);

  const clearAll = useCallback(() => {
    subscriptions.current.forEach((unsub) => unsub());
    subscriptions.current.clear();
  }, []);

  // Cleanup automático no unmount
  useEffect(() => {
    return () => {
      subscriptions.current.forEach((unsub) => unsub());
      subscriptions.current.clear();
    };
  }, []);

  return {
    addSubscription,
    removeSubscription,
    clearAll,
    count: subscriptions.current.size,
  };
}

export default useFirebaseSubscription;

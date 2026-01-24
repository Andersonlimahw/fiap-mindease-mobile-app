import { useCallback, useEffect, useMemo, useState } from "react";
import { useDI } from "@store/diStore";
import { TOKENS } from "@core/di/container";
import type {
  Transaction,
  TransactionType,
} from "@domain/entities/Transaction";
import type { TransactionRepository } from "@domain/repositories/TransactionRepository";
import { useAuthStore } from "@store/authStore";
import { GetRecentTransactions } from "../../application/usecases/GetRecentTransactions";
import { GetBalance } from "../../application/usecases/GetBalance";

export function useDashboardViewModel() {
  const di = useDI();
  const txRepo = useMemo(
    () => di.resolve<TransactionRepository>(TOKENS.TransactionRepository),
    [di]
  );
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const getRecentUC = useMemo(
    () => new GetRecentTransactions(txRepo),
    [txRepo]
  );
  const getBalanceUC = useMemo(() => new GetBalance(txRepo), [txRepo]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [txs, bal] = await Promise.all([
        getRecentUC.execute(userId, 50),
        getBalanceUC.execute(userId),
      ]);
      setTransactions(txs);
      setBalance(bal);
    } finally {
      setLoading(false);
    }
  }, [getRecentUC, getBalanceUC, userId]);

  const addQuickTx = useCallback(
    async (type: TransactionType) => {
      if (!userId) return;
      const cents = Math.floor(Math.random() * 5000) + 500; // between 5.00 and 55.00
      const description = type === "credit" ? "Crédito demo" : "Débito demo";
      await txRepo.add({
        userId,
        type,
        amount: cents,
        description,
      } as any);
      await refresh();
    },
    [txRepo, userId, refresh]
  );

  const addQuickCredit = useCallback(() => addQuickTx("credit"), [addQuickTx]);
  const addQuickDebit = useCallback(() => addQuickTx("debit"), [addQuickTx]);

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setBalance(0);
      setLoading(false);
      return;
    }

    let unsubRecent: undefined | (() => void);
    let unsubBalance: undefined | (() => void);
    let cancelled = false;

    (async () => {
      await refresh();
      if (cancelled) return;
      if (typeof txRepo.subscribeRecent === "function") {
        unsubRecent = txRepo.subscribeRecent(userId, 50, (txs) => {
          setTransactions(txs);
          setLoading(false);
        });
      }
      if (typeof txRepo.subscribeBalance === "function") {
        unsubBalance = txRepo.subscribeBalance(userId, (bal) => {
          setBalance(bal);
        });
      }
    })();

    return () => {
      cancelled = true;
      try {
        unsubRecent?.();
        unsubBalance?.();
      } catch {}
    };
  }, [refresh, txRepo, userId]);

  useEffect(() => {
    if (!userId) return;
    if (typeof txRepo.subscribeBalance === "function") {
      return;
    }
    setBalance(
      transactions.reduce(
        (sum, t) => sum + (t.type === "credit" ? t.amount : -t.amount),
        0
      )
    );
  }, [transactions, txRepo, userId]);

  return {
    user,
    loading,
    transactions,
    balance,
    refresh,
    addQuickCredit,
    addQuickDebit,
  };
}

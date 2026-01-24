import type { Investment } from "@domain/entities/Investment";
import AppConfig from "@config/appConfig";
import { cacheManager, CacheTTL, CacheKeys } from "../../infrastructure/cache";

export type TickerSuggestion = { id: string; name: string };
export type AddInvestimentInput = { ticker: string; quantity: number };

// This could be defined in domain/repositories if used elsewhere
export interface QuoteRepository {
  getQuote(ticker: string): Promise<Partial<Investment> | null>;
  search(query: string): Promise<TickerSuggestion[] | null>;
}

type BrapiQuote = {
  symbol: string;
  longName: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  logourl: string;
};

type BrapiSearch = {
  stocks: Array<{ stock: string; name: string }>;
};

/**
 * SECURITY NOTE: Token agora vem de variável de ambiente.
 * Em produção, considere criar um backend proxy/BFF para não expor
 * o token no bundle do aplicativo.
 */
const getBrapiToken = (): string => {
  const token = AppConfig.brapiToken;
  if (!token && __DEV__) {
    console.warn(
      '[B3QuoteRepository] BRAPI token não configurado. ' +
      'Configure EXPO_PUBLIC_BRAPI_TOKEN no arquivo .env'
    );
  }
  return token;
};

export class B3QuoteRepository implements QuoteRepository {
  /**
   * Busca cotação com cache (TTL: 1 minuto)
   * Usa estratégia stale-while-revalidate para melhor UX
   */
  async getQuote(ticker: string): Promise<Partial<Investment> | null> {
    const cacheKey = CacheKeys.B3_QUOTE(ticker.toUpperCase());

    try {
      // Usa stale-while-revalidate: retorna cache e atualiza em background
      return await cacheManager.staleWhileRevalidate(
        cacheKey,
        () => this.fetchQuoteFromApi(ticker),
        { ttl: CacheTTL.SHORT } // 1 minuto para cotações
      );
    } catch (error) {
      // Fallback: tenta buscar direto da API
      return this.fetchQuoteFromApi(ticker);
    }
  }

  /**
   * Busca cotação diretamente da API (sem cache)
   */
  private async fetchQuoteFromApi(ticker: string): Promise<Partial<Investment> | null> {
    const token = getBrapiToken();
    if (!token) {
      console.error('[B3QuoteRepository] Token BRAPI não disponível');
      return null;
    }

    try {
      const response = await fetch(
        `https://brapi.dev/api/quote/${ticker}?token=${token}`
      );
      if (!response.ok) {
        console.error("Failed to fetch quote for", ticker);
        return null;
      }
      const data = await response.json();
      const quote: BrapiQuote = data.results?.[0];

      if (!quote) {
        return null;
      }

      return {
        id: quote.symbol,
        longName: quote.longName,
        regularMarketPrice: quote.regularMarketPrice,
        regularMarketChangePercent: quote.regularMarketChangePercent,
        logoUrl: quote.logourl,
      };
    } catch (error) {
      console.error("Error fetching quote:", error);
      return null;
    }
  }

  async search(query: string): Promise<any | null> {
    if (!query || query.length < 4) {
      return [];
    }

    const token = getBrapiToken();
    if (!token) {
      console.error('[B3QuoteRepository] Token BRAPI não disponível');
      return null;
    }

    try {
      const response = await fetch(
        `https://brapi.dev/api/quote/${query}?token=${token}`
      );
      if (!response.ok) {
        console.error("Error searching tickers: Invalid response", {
          status: response.status,
          statusText: response.statusText,
          body: await response.text(),
        });
        return null;
      }
      // const data: BrapiSearch = await response.json();
      // return data.stocks.map((s: { stock: string; name: string }) => ({
      //   id: s.stock,
      //   name: s.name,
      // }));
      const data = await response.json();
      const quote: BrapiQuote = data.results?.[0];

      if (!quote) {
        return null;
      }
      return {
        id: quote.symbol,
        longName: quote.longName,
        regularMarketPrice: quote.regularMarketPrice,
        regularMarketChangePercent: quote.regularMarketChangePercent,
        logoUrl: quote.logourl,
      };
    } catch (error) {
      console.error("Error searching tickers:", error);
      return null;
    }
  }
}

import { z } from 'zod';

/**
 * Validadores centralizados para o ByteBank
 * Utiliza Zod para validação type-safe
 */

// ============================================
// UTILITÁRIOS DE VALIDAÇÃO
// ============================================

/**
 * Valida CPF usando algoritmo oficial
 */
const isValidCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');

  if (cleaned.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9))) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(10))) return false;

  return true;
};

/**
 * Valida CNPJ usando algoritmo oficial
 */
const isValidCNPJ = (cnpj: string): boolean => {
  const cleaned = cnpj.replace(/\D/g, '');

  if (cleaned.length !== 14) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  // Validação do primeiro dígito verificador
  let length = cleaned.length - 2;
  let numbers = cleaned.substring(0, length);
  const digits = cleaned.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  // Validação do segundo dígito verificador
  length = length + 1;
  numbers = cleaned.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
};

/**
 * Valida telefone brasileiro (com ou sem código de país)
 */
const isValidBrazilianPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  // Aceita: 11999999999 (11 dígitos) ou 5511999999999 (13 dígitos com +55)
  return /^(?:55)?[1-9]{2}9[0-9]{8}$/.test(cleaned);
};

/**
 * Valida chave PIX aleatória (formato EVP)
 */
const isValidRandomPixKey = (key: string): boolean => {
  // Formato UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key);
};

// ============================================
// SCHEMAS ZOD
// ============================================

/**
 * Schema para CPF
 */
export const cpfSchema = z
  .string()
  .min(11, 'CPF deve ter 11 dígitos')
  .max(14, 'CPF inválido')
  .refine(isValidCPF, 'CPF inválido');

/**
 * Schema para CNPJ
 */
export const cnpjSchema = z
  .string()
  .min(14, 'CNPJ deve ter 14 dígitos')
  .max(18, 'CNPJ inválido')
  .refine(isValidCNPJ, 'CNPJ inválido');

/**
 * Schema para email
 */
export const emailSchema = z
  .string()
  .email('Email inválido')
  .max(254, 'Email muito longo');

/**
 * Schema para telefone brasileiro
 */
export const phoneSchema = z
  .string()
  .min(10, 'Telefone deve ter pelo menos 10 dígitos')
  .max(15, 'Telefone inválido')
  .refine(isValidBrazilianPhone, 'Telefone inválido');

/**
 * Schema para chave PIX aleatória
 */
export const randomPixKeySchema = z
  .string()
  .length(36, 'Chave aleatória deve ter 36 caracteres')
  .refine(isValidRandomPixKey, 'Chave aleatória inválida');

/**
 * Schema unificado para chave PIX (qualquer tipo)
 */
export const pixKeySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('cpf'),
    value: cpfSchema,
  }),
  z.object({
    type: z.literal('email'),
    value: emailSchema,
  }),
  z.object({
    type: z.literal('phone'),
    value: phoneSchema,
  }),
  z.object({
    type: z.literal('random'),
    value: randomPixKeySchema,
  }),
]);

/**
 * Schema para valor monetário (em centavos)
 */
export const monetaryAmountSchema = z
  .number()
  .int('Valor deve ser inteiro (centavos)')
  .positive('Valor deve ser positivo')
  .max(100_000_000_00, 'Valor máximo excedido (R$ 100.000.000,00)');

/**
 * Schema para transferência PIX
 */
export const pixTransferSchema = z.object({
  toKey: z.string().min(1, 'Chave PIX de destino é obrigatória'),
  amount: monetaryAmountSchema,
  description: z.string().max(140, 'Descrição muito longa').optional(),
});

/**
 * Schema para transação
 */
export const transactionSchema = z.object({
  description: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .max(200, 'Descrição muito longa'),
  amount: monetaryAmountSchema,
  type: z.enum(['credit', 'debit']),
  category: z.string().max(50, 'Categoria muito longa').optional(),
});

/**
 * Schema para cartão digital
 */
export const digitalCardSchema = z.object({
  holderName: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(50, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  nickname: z.string().max(30, 'Apelido muito longo').optional(),
});

/**
 * Schema para limites PIX
 */
export const pixLimitsSchema = z.object({
  dailyLimitCents: monetaryAmountSchema,
  nightlyLimitCents: monetaryAmountSchema,
  perTransferLimitCents: monetaryAmountSchema,
});

/**
 * Schema para investimento
 */
export const investmentSchema = z.object({
  ticker: z
    .string()
    .min(4, 'Ticker deve ter pelo menos 4 caracteres')
    .max(10, 'Ticker muito longo')
    .regex(/^[A-Z0-9]+$/, 'Ticker deve conter apenas letras maiúsculas e números'),
  quantity: z
    .number()
    .int('Quantidade deve ser inteira')
    .positive('Quantidade deve ser positiva'),
});

// ============================================
// TIPOS INFERIDOS
// ============================================

export type CPF = z.infer<typeof cpfSchema>;
export type CNPJ = z.infer<typeof cnpjSchema>;
export type Email = z.infer<typeof emailSchema>;
export type Phone = z.infer<typeof phoneSchema>;
export type PixKey = z.infer<typeof pixKeySchema>;
export type PixTransferInput = z.infer<typeof pixTransferSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type DigitalCardInput = z.infer<typeof digitalCardSchema>;
export type PixLimitsInput = z.infer<typeof pixLimitsSchema>;
export type InvestmentInput = z.infer<typeof investmentSchema>;

// ============================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

/**
 * Valida dados usando um schema Zod
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map((issue) => issue.message);
  return { success: false, errors };
}

/**
 * Valida CPF
 */
export function validateCPF(cpf: string): ValidationResult<string> {
  return validate(cpfSchema, cpf);
}

/**
 * Valida CNPJ
 */
export function validateCNPJ(cnpj: string): ValidationResult<string> {
  return validate(cnpjSchema, cnpj);
}

/**
 * Valida email
 */
export function validateEmail(email: string): ValidationResult<string> {
  return validate(emailSchema, email);
}

/**
 * Valida telefone
 */
export function validatePhone(phone: string): ValidationResult<string> {
  return validate(phoneSchema, phone);
}

/**
 * Valida chave PIX baseado no tipo
 */
export function validatePixKey(
  type: 'cpf' | 'email' | 'phone' | 'random',
  value: string
): ValidationResult<{ type: typeof type; value: string }> {
  return validate(pixKeySchema, { type, value });
}

/**
 * Valida transferência PIX
 */
export function validatePixTransfer(
  data: unknown
): ValidationResult<PixTransferInput> {
  return validate(pixTransferSchema, data);
}

/**
 * Valida transação
 */
export function validateTransaction(
  data: unknown
): ValidationResult<TransactionInput> {
  return validate(transactionSchema, data);
}

/**
 * Valida cartão digital
 */
export function validateDigitalCard(
  data: unknown
): ValidationResult<DigitalCardInput> {
  return validate(digitalCardSchema, data);
}

/**
 * Valida investimento
 */
export function validateInvestment(
  data: unknown
): ValidationResult<InvestmentInput> {
  return validate(investmentSchema, data);
}

// ============================================
// SANITIZAÇÃO
// ============================================

/**
 * Remove caracteres especiais de CPF/CNPJ
 */
export function sanitizeDocument(doc: string): string {
  return doc.replace(/\D/g, '');
}

/**
 * Remove caracteres especiais de telefone
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Sanitiza texto removendo caracteres perigosos (XSS prevention)
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitiza valor monetário (string para centavos)
 */
export function sanitizeMonetaryValue(value: string): number {
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

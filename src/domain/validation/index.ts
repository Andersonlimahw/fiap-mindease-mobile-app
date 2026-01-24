/**
 * Camada de Validação do ByteBank
 *
 * Este módulo fornece validação robusta e type-safe usando Zod.
 *
 * @example
 * import { validateCPF, validatePixKey, sanitizeText } from '@domain/validation';
 *
 * const cpfResult = validateCPF('12345678909');
 * if (cpfResult.success) {
 *   console.log('CPF válido:', cpfResult.data);
 * } else {
 *   console.log('Erros:', cpfResult.errors);
 * }
 */

export * from './schemas';

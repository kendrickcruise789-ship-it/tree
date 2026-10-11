import { Currency } from '../types';
import { CURRENCY_CONFIGS } from '../data/products';

export function formatPrice(amountInUSD: number, currency: Currency): string {
  const config = CURRENCY_CONFIGS[currency];
  const converted = amountInUSD * config.rate;

  if (currency === 'INR') {
    return `${config.symbol}${Math.round(converted).toLocaleString('en-IN')}`;
  }
  if (currency === 'EUR') {
    return `${config.symbol}${converted.toFixed(2)}`;
  }
  if (currency === 'GBP') {
    return `${config.symbol}${converted.toFixed(2)}`;
  }
  return `${config.symbol}${converted.toFixed(2)}`;
}

export function convertAmount(amountInUSD: number, currency: Currency): number {
  const config = CURRENCY_CONFIGS[currency];
  return Math.round(amountInUSD * config.rate * 100) / 100;
}

export type CurrencyCode = 'RUB' | 'USD' | 'EUR' | 'KZT'

export interface ExchangeRates {
  [key: string]: number
}

class CurrencyService {
  // Base currency is RUB for now
  private rates: ExchangeRates = {
    'RUB': 1,
    'USD': 92.5,
    'EUR': 100.2,
    'KZT': 0.205
  }

  getRates(): ExchangeRates {
    return { ...this.rates }
  }

  /**
   * Converts amount from one currency to another
   * @param amount Amount to convert
   * @param from Source currency code
   * @param to Target currency code
   */
  convert(amount: number, from: CurrencyCode, to: CurrencyCode): number {
    if (from === to) return amount

    // Convert to base (RUB) first
    const baseAmount = amount * (this.rates[from] || 1)

    // Convert from base to target
    return baseAmount / (this.rates[to] || 1)
  }

  format(amount: number, code: CurrencyCode): string {
    const formatter = new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 2
    })
    return formatter.format(amount)
  }
}

export const instance = new CurrencyService()
export { instance as CurrencyService }

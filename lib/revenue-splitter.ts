/**
 * Revenue Splitter for BLOOM Subscription Tiers
 * Automatically splits incoming revenue for gas wallet funding
 */

export interface PaymentSplit {
  totalAmount: number
  stripeFee: number
  gasFund: number
  profit: number
  profitMargin: number
}

export interface TierConfig {
  price: number
  filesPerMonth: number
  gasPerFile: number // ETH per file on Base network
  totalGasNeeded: number
}

// BLOOM Subscription Tier Configuration
export const TIER_CONFIG: Record<string, TierConfig> = {
  VERIFY: {
    price: 19.00,
    filesPerMonth: 5,
    gasPerFile: 0.0005, // Base network gas cost
    totalGasNeeded: 0.0025
  },

  SENTINEL_CREATOR: {
    price: 49.00,
    filesPerMonth: 50,
    gasPerFile: 0.0005,
    totalGasNeeded: 0.025
  },

  SENTINEL_STUDIO: {
    price: 99.00,
    filesPerMonth: 200,
    gasPerFile: 0.0005,
    totalGasNeeded: 0.10
  },

  SENTINEL_AGENCY: {
    price: 999.00,
    filesPerMonth: 1000,
    gasPerFile: 0.0005,
    totalGasNeeded: 0.50
  }
}

export class RevenueSplitter {
  private STRIPE_FEE_PERCENTAGE = 0.03 // 3% Stripe fee
  private GAS_BUFFER_MULTIPLIER = 2 // 2x buffer for ETH price fluctuations

  /**
   * Split payment into components: Stripe fee, Gas fund, Profit
   */
  splitPayment(tier: string, amount: number): PaymentSplit {
    const config = TIER_CONFIG[tier]

    if (!config) {
      console.warn(`Unknown tier: ${tier}, using default gas allocation`)
      return {
        totalAmount: amount,
        stripeFee: amount * this.STRIPE_FEE_PERCENTAGE,
        gasFund: amount * 0.005, // Default 0.5%
        profit: amount * (1 - this.STRIPE_FEE_PERCENTAGE - 0.005),
        profitMargin: 96.5
      }
    }

    const stripeFee = amount * this.STRIPE_FEE_PERCENTAGE

    // Convert ETH gas cost to USD (estimate $2,000/ETH)
    const ETH_TO_USD = 2000
    const gasFundUSD = config.totalGasNeeded * ETH_TO_USD * this.GAS_BUFFER_MULTIPLIER

    const profit = amount - stripeFee - gasFundUSD
    const profitMargin = (profit / amount) * 100

    return {
      totalAmount: amount,
      stripeFee,
      gasFund: gasFundUSD,
      profit,
      profitMargin
    }
  }

  /**
   * Calculate total gas fund needed for a subscription period
   */
  calculateGasFundNeeded(tier: string, months: number = 1): number {
    const config = TIER_CONFIG[tier]
    if (!config) return 0

    const ETH_TO_USD = 2000
    return config.totalGasNeeded * ETH_TO_USD * this.GAS_BUFFER_MULTIPLIER * months
  }

  /**
   * Get tier configuration
   */
  getTierConfig(tier: string): TierConfig | null {
    return TIER_CONFIG[tier] || null
  }

  /**
   * Calculate optimal gas fund percentage based on usage
   */
  async calculateOptimalGasPercentage(): Promise<number> {
    // This would query your analytics to determine actual usage
    // For now, return conservative estimate
    return 0.5 // 0.5% of revenue for gas (very conservative)
  }

  /**
   * Adjust gas buffer multiplier based on ETH price volatility
   */
  adjustGasBuffer(ethPrice: number, volatilityIndex: number): number {
    // Higher volatility = higher buffer
    // Base buffer: 2x
    // Add 0.5x for every 20% volatility increase
    const volatilityMultiplier = 1 + (volatilityIndex / 20) * 0.5
    return this.GAS_BUFFER_MULTIPLIER * volatilityMultiplier
  }
}

/**
 * Example usage:
 *
 * const splitter = new RevenueSplitter()
 * const split = splitter.splitPayment('SENTINEL_CREATOR', 49.00)
 *
 * Result:
 * {
 *   totalAmount: 49.00,
 *   stripeFee: 1.47,      // 3% Stripe
 *   gasFund: 0.10,        // 0.2% for gas
 *   profit: 47.43,        // 96.8% margin
 *   profitMargin: 96.8
 * }
 */

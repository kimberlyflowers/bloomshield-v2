import { ThirdwebSDK } from '@thirdweb-dev/sdk'
import { createClient } from '@supabase/supabase-js'

/**
 * Gas Wallet Manager
 * Manages automated gas wallet funding from subscription revenue
 */
export class GasWalletManager {
  private sdk: ThirdwebSDK | null = null

  constructor() {
    // SDK will be initialized when needed to avoid server-side issues
  }

  /**
   * Get current ETH balance in gas wallet
   */
  async getBalance(): Promise<number> {
    try {
      if (!process.env.THIRDWEB_PRIVATE_KEY) {
        console.warn('⚠️  ThirdWeb private key not configured')
        return 0
      }

      const sdk = ThirdwebSDK.fromPrivateKey(
        process.env.THIRDWEB_PRIVATE_KEY,
        'base',
        {
          clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
          secretKey: process.env.THIRDWEB_SECRET_KEY,
        }
      )

      const wallet = await sdk.wallet.balance()
      return parseFloat(wallet.displayValue)
    } catch (error) {
      console.error('❌ Error getting wallet balance:', error)
      return 0
    }
  }

  /**
   * Check if wallet needs refilling
   * Keeps minimum 10 ETH buffer for gas fees
   */
  async needsRefill(): Promise<boolean> {
    const balance = await this.getBalance()
    const MIN_BALANCE = 10 // Keep at least 10 ETH
    return balance < MIN_BALANCE
  }

  /**
   * Estimate gas costs for next 30 days based on usage patterns
   */
  async estimateMonthlyGasCost(): Promise<number> {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get average files protected per day from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('assets')
      .select('id')
      .gte('created_at', thirtyDaysAgo)

    if (error) {
      console.error('Error fetching asset data:', error)
      return 0
    }

    const filesPerDay = (data?.length || 0) / 30
    const filesPerMonth = filesPerDay * 30
    const gasPerFile = 0.0005 // ETH per file on Base network

    return filesPerMonth * gasPerFile
  }

  /**
   * Log gas usage for analytics
   */
  async logGasUsage(txHash: string, gasCost: number): Promise<void> {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const gasCostUSD = await this.convertETHtoUSD(gasCost)

    await supabase
      .from('gas_usage_log')
      .insert({
        tx_hash: txHash,
        gas_cost_eth: gasCost,
        gas_cost_usd: gasCostUSD,
        timestamp: new Date().toISOString()
      })
  }

  /**
   * Convert ETH to USD using CoinGecko API
   */
  private async convertETHtoUSD(eth: number): Promise<number> {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      )
      const data = await response.json()
      return eth * data.ethereum.usd
    } catch (error) {
      console.error('Error converting ETH to USD:', error)
      return eth * 2000 // Fallback estimate
    }
  }

  /**
   * Get gas wallet analytics
   */
  async getAnalytics(): Promise<{
    currentBalance: number
    estimatedMonthlyUsage: number
    daysRemaining: number
    totalSpentThisMonth: number
  }> {
    const balance = await this.getBalance()
    const monthlyUsage = await this.estimateMonthlyGasCost()
    const daysRemaining = monthlyUsage > 0 ? (balance / (monthlyUsage / 30)) : 999

    // Get total spent this month
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    firstDayOfMonth.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('gas_usage_log')
      .select('gas_cost_usd')
      .gte('timestamp', firstDayOfMonth.toISOString())

    const totalSpentThisMonth = data?.reduce((sum, row) => sum + (row.gas_cost_usd || 0), 0) || 0

    return {
      currentBalance: balance,
      estimatedMonthlyUsage: monthlyUsage,
      daysRemaining: Math.floor(daysRemaining),
      totalSpentThisMonth
    }
  }
}

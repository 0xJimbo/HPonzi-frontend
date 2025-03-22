"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import TokenInfo from "@/components/token-info"
import CommitReveal from "@/components/commit-reveal"
import TransferTokens from "@/components/transfer-tokens"
import ConnectWallet from "@/components/connect-wallet"
import { useToast } from "@/hooks/use-toast"

// Add imports for wallet connection and contract interaction
import { connectWallet, setupAccountChangeListener, setupChainChangeListener, removeEventListeners } from "@/lib/wallet"
import { checkIfTokensUnlocked, getTokenBalance, getTokenInfo } from "@/lib/contract"

export default function TokenDashboard() {
  const [connected, setConnected] = useState(false)
  const [account, setAccount] = useState("")
  const [balance, setBalance] = useState("0")
  const [demoMode, setDemoMode] = useState(false)
  const [tokenData, setTokenData] = useState({
    name: "HPonzi",
    symbol: "HPZ",
    totalSupply: "1,000,000",
    decimals: 18,
    contractAddress: "0x88DFF956C366Bf076aBd7B08D1C888557C76826c",
    network: "BASE Sepolia Testnet",
  })
  const [unlockStatus, setUnlockStatus] = useState({
    isUnlocked: false,
    unlockedUntil: 0,
    unlockedAmount: "0",
    nextAttemptTime: 0,
    hasCommit: false,
  })
  const { toast } = useToast()

  // Refresh token status
  const refreshStatus = useCallback(async () => {
    if (!account || (!connected && !demoMode)) return

    try {
      if (demoMode) {
        // In demo mode, we simulate the status
        return
      }

      // Get token balance
      const balance = await getTokenBalance(account)
      setBalance(balance)

      // Check unlock status
      const status = await checkIfTokensUnlocked(account)
      setUnlockStatus(status)
    } catch (error) {
      console.error("Failed to refresh status:", error)
    }
  }, [account, connected, demoMode])

  // Account change handler
  const handleAccountsChanged = useCallback(
    (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected
        setConnected(false)
        setAccount("")
        setBalance("0")
        setUnlockStatus({
          isUnlocked: false,
          unlockedUntil: 0,
          unlockedAmount: "0",
          nextAttemptTime: 0,
          hasCommit: false,
        })
      } else {
        // User switched accounts
        setAccount(accounts[0])
        // Refresh data for new account
        refreshStatus()
      }
    },
    [refreshStatus],
  )

  // Chain change handler
  const handleChainChanged = useCallback(() => {
    // Reload the page when the chain changes
    window.location.reload()
  }, [])

  // Connect wallet
  const handleConnect = async () => {
    try {
      if (demoMode) {
        // In demo mode, we simulate the connection
        setAccount("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
        setBalance("1000.0")
        setUnlockStatus({
          isUnlocked: false,
          unlockedUntil: 0,
          unlockedAmount: "0",
          nextAttemptTime: 0,
          hasCommit: false,
        })
        setConnected(true)

        toast({
          title: "Demo Mode Activated",
          description: "Connected with a simulated wallet. No real transactions will occur.",
        })
        return
      }

      // Show connecting toast
      toast({
        title: "Connecting...",
        description: "Please approve the connection request in MetaMask",
      })

      const account = await connectWallet()

      if (!account) {
        throw new Error("Failed to get account from MetaMask")
      }

      setAccount(account)

      // Get token info
      try {
        const info = await getTokenInfo()
        setTokenData(info)
      } catch (error) {
        console.error("Failed to get token info:", error)
        // Continue anyway, using default values
      }

      try {
        // Check if tokens are unlocked for this account
        const status = await checkIfTokensUnlocked(account)
        setUnlockStatus(status)

        // Get token balance
        const balance = await getTokenBalance(account)
        setBalance(balance)
      } catch (error) {
        console.error("Failed to get token status:", error)
        // Continue anyway with default values
      }

      setConnected(true)

      // Setup listeners for account and chain changes
      setupAccountChangeListener(handleAccountsChanged)
      setupChainChangeListener(handleChainChanged)

      toast({
        title: "Wallet Connected",
        description: "Successfully connected to your wallet on BASE Sepolia",
      })
    } catch (error: any) {
      console.error("Failed to connect wallet:", error)

      toast({
        title: "Connection Failed",
        description: error.message || "Could not connect to wallet. Please make sure MetaMask is installed.",
        variant: "destructive",
        action: (
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                setDemoMode(true)
                handleConnect()
              }}
              className="px-3 py-1 text-xs font-medium text-white bg-primary rounded-md hover:bg-primary/90"
            >
              Use Demo Mode
            </button>
          </div>
        ),
      })
    }
  }

  // Handle disconnect
  const handleDisconnect = useCallback(() => {
    setConnected(false)
    setAccount("")
    setBalance("0")
    setUnlockStatus({
      isUnlocked: false,
      unlockedUntil: 0,
      unlockedAmount: "0",
      nextAttemptTime: 0,
      hasCommit: false,
    })
    setDemoMode(false)

    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    })
  }, [toast])

  // Set up periodic refresh
  useEffect(() => {
    if (connected || demoMode) {
      refreshStatus()

      // Refresh every 30 seconds
      const interval = setInterval(refreshStatus, 30000)
      return () => clearInterval(interval)
    }
  }, [connected, account, demoMode, refreshStatus])

  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      if (connected && !demoMode) {
        removeEventListeners(handleAccountsChanged, handleChainChanged)
      }
    }
  }, [connected, demoMode, handleAccountsChanged, handleChainChanged])

  // Handle unlock
  const handleUnlock = () => {
    if (demoMode) {
      // In demo mode, we simulate a successful unlock
      setUnlockStatus({
        isUnlocked: true,
        unlockedUntil: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
        unlockedAmount: "1000.0",
        nextAttemptTime: 0,
        hasCommit: false,
      })
      return
    }

    refreshStatus()
  }

  // Handle demo mode commit
  const handleDemoCommit = () => {
    setUnlockStatus((prev) => ({
      ...prev,
      hasCommit: true,
    }))
  }

  // Handle demo mode reveal
  const handleDemoReveal = (success: boolean) => {
    if (success) {
      setUnlockStatus({
        isUnlocked: true,
        unlockedUntil: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
        unlockedAmount: "1000.0",
        nextAttemptTime: 0,
        hasCommit: false,
      })
    } else {
      setUnlockStatus({
        isUnlocked: false,
        unlockedUntil: 0,
        unlockedAmount: "0",
        nextAttemptTime: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
        hasCommit: false,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {tokenData.name} ({tokenData.symbol})
          </h1>
          <p className="text-muted-foreground">Manage your ERC20 tokens with commit-reveal unlocking</p>
        </div>

        <div className="flex flex-col gap-2">
          {!connected && !demoMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDemoMode(true)
                handleConnect()
              }}
              className="text-xs"
            >
              Try Demo Mode
            </Button>
          )}

          <ConnectWallet
            connected={connected}
            account={account}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            demoMode={demoMode}
          />

          {demoMode && (
            <div className="text-center text-xs text-yellow-600 font-medium">
              Demo Mode Active - No real transactions
            </div>
          )}
        </div>
      </div>

      {connected || demoMode ? (
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Token Info</TabsTrigger>
            <TabsTrigger value="unlock">Unlock Tokens</TabsTrigger>
            <TabsTrigger value="transfer" disabled={!unlockStatus.isUnlocked}>
              Transfer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <TokenInfo
              tokenData={tokenData}
              balance={balance}
              account={account}
              unlocked={unlockStatus.isUnlocked}
              unlockStatus={unlockStatus}
            />
          </TabsContent>

          <TabsContent value="unlock">
            <CommitReveal
              onUnlock={handleUnlock}
              isUnlocked={unlockStatus.isUnlocked}
              account={account}
              unlockStatus={unlockStatus}
              refreshStatus={refreshStatus}
              demoMode={demoMode}
              onDemoCommit={handleDemoCommit}
              onDemoReveal={handleDemoReveal}
            />
          </TabsContent>

          <TabsContent value="transfer">
            <TransferTokens
              balance={balance}
              tokenSymbol={tokenData.symbol}
              unlockedAmount={unlockStatus.unlockedAmount}
              account={account}
              refreshStatus={refreshStatus}
              demoMode={demoMode}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Welcome to {tokenData.name}</CardTitle>
            <CardDescription>Connect your wallet to view your token balance and manage your tokens</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10 gap-4">
            <p className="text-center text-muted-foreground">
              Please connect your wallet to interact with the {tokenData.symbol} token contract
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


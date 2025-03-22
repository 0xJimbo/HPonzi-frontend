"use client"

import { Button } from "@/components/ui/button"
import { Wallet, LogOut } from "lucide-react"
import { useState } from "react"

interface ConnectWalletProps {
  connected: boolean
  account: string
  onConnect: () => void
  onDisconnect: () => void
  demoMode?: boolean
}

export default function ConnectWallet({
  connected,
  account,
  onConnect,
  onDisconnect,
  demoMode = false,
}: ConnectWalletProps) {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await onConnect()
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div>
      {connected ? (
        <div className="flex items-center gap-2">
          <div className="hidden rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-600 md:block">
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-green-500"></span>
            {account}
            {demoMode && " (Demo)"}
          </div>
          <Button variant="outline" size="sm" onClick={onDisconnect}>
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </Button>
        </div>
      ) : (
        <Button onClick={handleConnect} disabled={isConnecting}>
          {isConnecting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Connect to {demoMode ? "Demo Wallet" : "BASE Sepolia"}
            </>
          )}
        </Button>
      )}
    </div>
  )
}


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Coins, Lock, Unlock, ExternalLink, Clock } from "lucide-react"
import { formatTimeRemaining } from "@/lib/contract"

interface TokenInfoProps {
  tokenData: {
    name: string
    symbol: string
    totalSupply: string
    decimals: number
    contractAddress: string
    network: string
  }
  balance: string
  account: string
  unlocked: boolean
  unlockStatus: {
    isUnlocked: boolean
    unlockedUntil: number
    unlockedAmount: string
    nextAttemptTime: number
    hasCommit: boolean
  }
}

export default function TokenInfo({ tokenData, balance, account, unlocked, unlockStatus }: TokenInfoProps) {
  const timeRemaining = unlockStatus.isUnlocked ? formatTimeRemaining(unlockStatus.unlockedUntil) : ""
  const explorerUrl = `https://sepolia.basescan.org/address/${tokenData.contractAddress}`

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Token Details</CardTitle>
          <CardDescription>Information about the {tokenData.symbol} token</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Name:</span>
            <span>{tokenData.name}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Symbol:</span>
            <span>{tokenData.symbol}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Supply:</span>
            <span>
              {tokenData.totalSupply} {tokenData.symbol}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Decimals:</span>
            <span>{tokenData.decimals}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Contract Address:</span>
            <div className="flex items-center gap-1">
              <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
                {tokenData.contractAddress.substring(0, 6)}...
                {tokenData.contractAddress.substring(tokenData.contractAddress.length - 4)}
              </a>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Network:</span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
              {tokenData.network}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Balance</CardTitle>
          <CardDescription>Your {tokenData.symbol} token holdings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center gap-2 py-6">
            <Coins className="h-12 w-12 text-primary" />
            <h3 className="text-3xl font-bold">
              {balance} {tokenData.symbol}
            </h3>
            <Badge variant={unlocked ? "success" : "secondary"} className="gap-1">
              {unlocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {unlocked ? "Transferrable" : "Non-Transferrable"}
            </Badge>

            {unlocked && (
              <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Unlocked for: {timeRemaining}</span>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-muted p-4">
            <h4 className="mb-2 font-medium">Token Status</h4>
            {unlocked ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Your tokens are currently unlocked and can be transferred to other addresses.
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span>Unlocked Amount:</span>
                  <span className="font-medium">
                    {unlockStatus.unlockedAmount} {tokenData.symbol}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Unlock Expires:</span>
                  <span className="font-medium">{timeRemaining}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your tokens are currently locked. Complete the commit-reveal process to unlock them for transfers. Note
                that there's only a 20% chance of success with each attempt.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { transferTokens } from "@/lib/contract"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface TransferTokensProps {
  balance: string
  tokenSymbol: string
  unlockedAmount: string
  account: string
  refreshStatus: () => void
  demoMode?: boolean
}

export default function TransferTokens({
  balance,
  tokenSymbol,
  unlockedAmount,
  account,
  refreshStatus,
  demoMode = false,
}: TransferTokensProps) {
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [isTransferring, setIsTransferring] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  // Handle transfer
  const handleTransfer = async () => {
    // Validate input
    if (!recipient || !amount) {
      toast({
        title: "Error",
        description: "Please enter both recipient address and amount",
        variant: "destructive",
      })
      return
    }

    if (!recipient.startsWith("0x") || recipient.length !== 42) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      })
      return
    }

    if (Number.parseFloat(amount) <= 0 || isNaN(Number.parseFloat(amount))) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      })
      return
    }

    if (Number.parseFloat(amount) > Number.parseFloat(unlockedAmount)) {
      toast({
        title: "Insufficient Unlocked Balance",
        description: `You only have ${unlockedAmount} ${tokenSymbol} unlocked for transfer`,
        variant: "destructive",
      })
      return
    }

    // Perform the transfer
    setIsTransferring(true)

    try {
      if (demoMode) {
        // In demo mode, simulate transfer
        await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate blockchain delay

        setIsTransferring(false)
        setIsSuccess(true)

        toast({
          title: "Demo: Transfer Successful",
          description: `Successfully transferred ${amount} ${tokenSymbol} to ${recipient.substring(0, 6)}...${recipient.substring(recipient.length - 4)} (simulated)`,
          variant: "success",
        })

        // Reset form after 3 seconds
        setTimeout(() => {
          setIsSuccess(false)
          setRecipient("")
          setAmount("")
        }, 3000)
      } else {
        const result = await transferTokens(recipient, amount, account)

        if (result.success) {
          setIsTransferring(false)
          setIsSuccess(true)

          toast({
            title: "Transfer Successful",
            description: `Successfully transferred ${amount} ${tokenSymbol} to ${recipient.substring(0, 6)}...${recipient.substring(recipient.length - 4)}`,
            variant: "success",
          })

          // Refresh status
          refreshStatus()

          // Reset form after 3 seconds
          setTimeout(() => {
            setIsSuccess(false)
            setRecipient("")
            setAmount("")
          }, 3000)
        } else {
          setIsTransferring(false)

          toast({
            title: "Transfer Failed",
            description: result.error || "Failed to transfer tokens",
            variant: "destructive",
          })
        }
      }
    } catch (error: any) {
      setIsTransferring(false)

      toast({
        title: "Transfer Failed",
        description: error.message || "Failed to transfer tokens",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Transfer Tokens
          {demoMode && " (Demo)"}
        </CardTitle>
        <CardDescription>Send your unlocked {tokenSymbol} tokens to another address</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {demoMode && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Demo Mode</AlertTitle>
            <AlertDescription>
              You're in demo mode. No real transactions will be sent to the blockchain. Transfers will be simulated.
            </AlertDescription>
          </Alert>
        )}

        <div className="rounded-lg bg-muted p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Balance:</span>
              <span className="font-medium">
                {balance} {tokenSymbol}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Unlocked for Transfer:</span>
              <span className="font-medium text-green-600">
                {unlockedAmount} {tokenSymbol}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Tokens are only unlocked for 24 hours</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient Address</Label>
          <Input
            id="recipient"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={isTransferring || isSuccess}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="amount">Amount</Label>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setAmount(unlockedAmount)}
              disabled={isTransferring || isSuccess}
            >
              Max
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="amount"
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isTransferring || isSuccess}
            />
            <div className="w-20 rounded-md border bg-muted px-3 py-2 text-center font-medium">{tokenSymbol}</div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {isSuccess ? (
          <Button className="w-full bg-green-600 hover:bg-green-700" disabled>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Transfer Complete
            {demoMode && " (Demo)"}
          </Button>
        ) : (
          <Button className="w-full" onClick={handleTransfer} disabled={isTransferring}>
            {isTransferring ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Processing...
              </>
            ) : (
              <>
                <ArrowRight className="mr-2 h-4 w-4" />
                Transfer Tokens
                {demoMode && " (Demo)"}
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}


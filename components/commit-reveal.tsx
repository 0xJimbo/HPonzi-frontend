"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Check, Key, Unlock, Clock, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { commitNumber, revealNumber, formatTimeRemaining } from "@/lib/contract"

interface CommitRevealProps {
  onUnlock: () => void
  isUnlocked: boolean
  account: string
  unlockStatus: {
    isUnlocked: boolean
    unlockedUntil: number
    unlockedAmount: string
    nextAttemptTime: number
    hasCommit: boolean
  }
  refreshStatus: () => void
  demoMode?: boolean
  onDemoCommit?: () => void
  onDemoReveal?: (success: boolean) => void
}

export default function CommitReveal({
  onUnlock,
  isUnlocked,
  account,
  unlockStatus,
  refreshStatus,
  demoMode = false,
  onDemoCommit,
  onDemoReveal,
}: CommitRevealProps) {
  const [number, setNumber] = useState("")
  const [isCommitting, setIsCommitting] = useState(false)
  const [isRevealing, setIsRevealing] = useState(false)
  const [unlockFailed, setUnlockFailed] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState("")
  const [cooldownRemaining, setCooldownRemaining] = useState("")
  const { toast } = useToast()

  // Update time remaining
  useEffect(() => {
    const updateTimes = () => {
      if (unlockStatus.isUnlocked) {
        setTimeRemaining(formatTimeRemaining(unlockStatus.unlockedUntil))
      }

      const now = Math.floor(Date.now() / 1000)
      if (now < unlockStatus.nextAttemptTime) {
        setCooldownRemaining(formatTimeRemaining(unlockStatus.nextAttemptTime))
      } else {
        setCooldownRemaining("")
      }
    }

    updateTimes()
    const interval = setInterval(updateTimes, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [unlockStatus])

  // Handle commit
  const handleCommit = async () => {
    if (!number || isNaN(Number.parseInt(number))) {
      toast({
        title: "Error",
        description: "Please enter a valid number",
        variant: "destructive",
      })
      return
    }

    setIsCommitting(true)

    try {
      if (demoMode) {
        // In demo mode, simulate commit
        await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate blockchain delay

        if (onDemoCommit) {
          onDemoCommit()
        }

        toast({
          title: "Demo: Commit Successful",
          description: "Your number has been committed to the blockchain (simulated)",
        })
      } else {
        // Show a toast to let the user know they need to confirm in MetaMask
        toast({
          title: "Confirm Transaction",
          description: "Please confirm the transaction in your wallet",
        })

        console.log("Calling commitNumber with:", Number.parseInt(number))
        const txHash = await commitNumber(Number.parseInt(number))
        console.log("Transaction hash:", txHash)

        toast({
          title: "Commit Successful",
          description: "Your number has been committed to the blockchain",
        })
      }

      refreshStatus()
    } catch (error: any) {
      console.error("Commit error:", error)
      toast({
        title: "Commit Failed",
        description: error.message || "Failed to commit number. Check console for details.",
        variant: "destructive",
      })
    } finally {
      setIsCommitting(false)
    }
  }

  // Handle reveal
  const handleReveal = async () => {
    if (!number || isNaN(Number.parseInt(number))) {
      toast({
        title: "Error",
        description: "Please enter a valid number",
        variant: "destructive",
      })
      return
    }

    setIsRevealing(true)
    setUnlockFailed(false)

    try {
      if (demoMode) {
        // In demo mode, simulate reveal with 20% success rate
        await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate blockchain delay

        const success = Math.random() < 0.2 // 20% chance of success

        if (success) {
          toast({
            title: "Demo: Unlock Successful",
            description: "Your tokens have been unlocked for 24 hours (simulated)",
            variant: "success",
          })

          if (onDemoReveal) {
            onDemoReveal(true)
          }

          onUnlock()
        } else {
          setUnlockFailed(true)

          toast({
            title: "Demo: Unlock Failed",
            description: "Failed to unlock tokens. The random number was not divisible by 5 (simulated)",
            variant: "destructive",
          })

          if (onDemoReveal) {
            onDemoReveal(false)
          }
        }
      } else {
        // Show a toast to let the user know they need to confirm in MetaMask
        toast({
          title: "Confirm Transaction",
          description: "Please confirm the transaction in your wallet",
        })

        const result = await revealNumber(Number.parseInt(number))

        if (result.success) {
          toast({
            title: "Unlock Successful",
            description: "Your tokens have been unlocked for 24 hours",
            variant: "success",
          })

          onUnlock()
        } else {
          setUnlockFailed(true)

          toast({
            title: "Unlock Failed",
            description: result.error || "Failed to unlock tokens. Remember, there's only a 20% chance of success!",
            variant: "destructive",
          })
        }
      }

      refreshStatus()
    } catch (error: any) {
      console.error("Reveal error:", error)
      toast({
        title: "Reveal Failed",
        description: error.message || "Failed to reveal number. Check console for details.",
        variant: "destructive",
      })
    } finally {
      setIsRevealing(false)
    }
  }

  // If tokens are already unlocked
  if (unlockStatus.isUnlocked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Unlock className="h-5 w-5 text-green-500" />
            HPonzi Tokens Unlocked
            {demoMode && " (Demo)"}
          </CardTitle>
          <CardDescription>Your tokens are now transferrable for a limited time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
            <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-medium text-green-800 dark:text-green-300">Unlock Successful</h3>
              <p className="text-sm text-green-600 dark:text-green-400">
                Your HPonzi tokens have been successfully unlocked. You can now transfer them to other addresses.
              </p>
              <div className="mt-2 flex items-center gap-2 rounded-full bg-green-200 px-4 py-2 text-sm font-medium text-green-800 dark:bg-green-800 dark:text-green-200">
                <Clock className="h-4 w-4" />
                Time remaining: {timeRemaining}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // If unlock failed
  if (unlockFailed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Unlock Attempt Failed
            {demoMode && " (Demo)"}
          </CardTitle>
          <CardDescription>Your unlock attempt was unsuccessful</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-950">
            <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
              <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-medium text-yellow-800 dark:text-yellow-300">Better Luck Next Time</h3>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Your unlock attempt failed. The contract requires the random number to be divisible by 5 (20% chance).
                You can try again after the cooldown period.
              </p>
              {cooldownRemaining && (
                <div className="mt-2 flex items-center gap-2 rounded-full bg-yellow-200 px-4 py-2 text-sm font-medium text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                  <Clock className="h-4 w-4" />
                  Next attempt in: {cooldownRemaining}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setUnlockFailed(false)
              setNumber("")
            }}
          >
            Try Again Later
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Check if in cooldown period
  const now = Math.floor(Date.now() / 1000)
  const inCooldown = now < unlockStatus.nextAttemptTime

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Unlock HPonzi Tokens
          {demoMode && " (Demo)"}
        </CardTitle>
        <CardDescription>Use the commit-reveal scheme to unlock your tokens for transfer</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>How it works</AlertTitle>
          <AlertDescription>
            <ol className="ml-4 mt-2 list-decimal space-y-1 text-sm">
              <li>First, commit a number to the blockchain</li>
              <li>After the commit is confirmed, reveal the same number to try unlocking your tokens</li>
              <li>You have a 20% chance of success (if the random number is divisible by 5)</li>
              <li>If successful, tokens are unlocked for 24 hours</li>
              <li>You can only attempt once every 24 hours</li>
            </ol>
          </AlertDescription>
        </Alert>

        {demoMode && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Demo Mode</AlertTitle>
            <AlertDescription>
              You're in demo mode. No real transactions will be sent to the blockchain. The unlock process will be
              simulated with a 20% chance of success.
            </AlertDescription>
          </Alert>
        )}

        {inCooldown && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Cooldown Period</AlertTitle>
            <AlertDescription>You need to wait {cooldownRemaining} before your next unlock attempt.</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-lg font-medium">Step 1: Commit Phase</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="number">Enter a Number</Label>
                <Input
                  id="number"
                  type="number"
                  placeholder="Enter any number (e.g. 42)"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  disabled={isCommitting || isRevealing || unlockStatus.hasCommit}
                />
                <p className="text-xs text-muted-foreground">
                  Remember this number! You'll need to provide the exact same number in the reveal step.
                </p>
              </div>

              <Button
                onClick={handleCommit}
                disabled={!number || isCommitting || isRevealing || unlockStatus.hasCommit || (inCooldown && !demoMode)}
                className="w-full"
              >
                {isCommitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Committing...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Commit Number to Blockchain
                    {demoMode && " (Demo)"}
                  </>
                )}
              </Button>
            </div>
          </div>

          {unlockStatus.hasCommit && (
            <>
              <Separator />

              <div>
                <h3 className="mb-2 text-lg font-medium">Step 2: Reveal Phase</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Now that your number is committed on-chain, you can reveal it to try unlocking your tokens. Make sure
                  to use the exact same number you committed.
                </p>
                <Button onClick={handleReveal} className="w-full" disabled={isRevealing || (inCooldown && !demoMode)}>
                  {isRevealing ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Revealing...
                    </>
                  ) : (
                    <>
                      <Unlock className="mr-2 h-4 w-4" />
                      Reveal Number & Try Unlock (20% Chance)
                      {demoMode && " (Demo)"}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


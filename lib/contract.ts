import { ethers } from "ethers"

// Contract details
const CONTRACT_ADDRESS = "0x88DFF956C366Bf076aBd7B08D1C888557C76826c"
const CONTRACT_ABI = [
  // ABI functions we need
  "function balanceOf(address account) view returns (uint256)",
  "function commitHash(uint256 _preimage) external",
  "function revealAndUnlock(uint256 _preimage) external",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function snapshotUnlockedUntil(address) view returns (uint256)",
  "function unlockedTokenAmount(address) view returns (uint256)",
  "function snapshotLastUnlockAttempt(address) view returns (uint256)",
  "function commits(address) view returns (bytes32 hash, uint256 blockNumber)",
  // Events
  "event TokensUnlocked(address indexed user, uint256 unlockedAmount, uint256 unlockUntil)",
]

// Get contract instance
function getContract(provider: ethers.providers.Web3Provider) {
  const signer = provider.getSigner()
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
}

// Get provider
export function getProvider() {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum)
  }
  throw new Error("MetaMask is not installed")
}

// Get token info
export async function getTokenInfo() {
  try {
    const provider = getProvider()
    const contract = getContract(provider)

    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
    ])

    return {
      name,
      symbol,
      decimals,
      totalSupply: ethers.utils.formatUnits(totalSupply, decimals),
      contractAddress: CONTRACT_ADDRESS,
      network: "BASE Sepolia Testnet",
    }
  } catch (error) {
    console.error("Error getting token info:", error)
    // Return default values if there's an error
    return {
      name: "HPonzi",
      symbol: "HPZ",
      decimals: 18,
      totalSupply: "1,000,000",
      contractAddress: CONTRACT_ADDRESS,
      network: "BASE Sepolia Testnet",
    }
  }
}

// Check if tokens are unlocked
export async function checkIfTokensUnlocked(address: string): Promise<{
  isUnlocked: boolean
  unlockedUntil: number
  unlockedAmount: string
  nextAttemptTime: number
  hasCommit: boolean
}> {
  try {
    const provider = getProvider()
    const contract = getContract(provider)

    const [unlockedUntil, unlockedAmount, lastAttempt, commit] = await Promise.all([
      contract.snapshotUnlockedUntil(address),
      contract.unlockedTokenAmount(address),
      contract.snapshotLastUnlockAttempt(address),
      contract.commits(address),
    ])

    const now = Math.floor(Date.now() / 1000)
    const nextAttemptTime = lastAttempt.toNumber() + 24 * 60 * 60 // 24 hours after last attempt

    return {
      isUnlocked: now <= unlockedUntil.toNumber() && unlockedAmount.gt(0),
      unlockedUntil: unlockedUntil.toNumber(),
      unlockedAmount: ethers.utils.formatEther(unlockedAmount),
      nextAttemptTime,
      hasCommit: commit.hash !== ethers.constants.HashZero,
    }
  } catch (error) {
    console.error("Error checking if tokens are unlocked:", error)
    // Return default values if there's an error
    return {
      isUnlocked: false,
      unlockedUntil: 0,
      unlockedAmount: "0",
      nextAttemptTime: 0,
      hasCommit: false,
    }
  }
}

// Commit a number
export async function commitNumber(number: number): Promise<string> {
  console.log("Committing number:", number)

  try {
    // Ensure we have a fresh provider instance
    const provider = getProvider()

    // Make sure the provider is connected
    await provider.send("eth_requestAccounts", [])

    // Get the contract with the signer
    const contract = getContract(provider)

    console.log("Calling contract.commitHash with number:", number)

    // Call the contract method - this should trigger MetaMask
    const tx = await contract.commitHash(number, {
      gasLimit: 200000, // Set a reasonable gas limit
    })

    console.log("Transaction sent:", tx.hash)

    // Wait for the transaction to be mined
    const receipt = await tx.wait()

    console.log("Transaction confirmed:", receipt)

    return tx.hash
  } catch (error) {
    console.error("Error in commitNumber:", error)
    throw error
  }
}

// Reveal a number
export async function revealNumber(number: number): Promise<{
  success: boolean
  hash: string
  error?: string
}> {
  try {
    const provider = getProvider()

    // Make sure the provider is connected
    await provider.send("eth_requestAccounts", [])

    const contract = getContract(provider)

    console.log("Calling revealAndUnlock with number:", number)

    const tx = await contract.revealAndUnlock(number, {
      gasLimit: 300000, // Set a reasonable gas limit
    })

    console.log("Transaction sent:", tx.hash)

    const receipt = await tx.wait()
    console.log("Transaction confirmed:", receipt)

    // Check if the TokensUnlocked event was emitted
    const unlockEvent = receipt.events?.find((e: any) => e.event === "TokensUnlocked")

    return {
      success: !!unlockEvent,
      hash: tx.hash,
    }
  } catch (error: any) {
    console.error("Error in revealNumber:", error)

    // Extract error message from revert reason
    let errorMessage = "Transaction failed"

    if (error.message.includes("Only one attempt per day")) {
      errorMessage = "You can only attempt to unlock once per day"
    } else if (error.message.includes("No commit found")) {
      errorMessage = "No commit found. Please commit a number first"
    } else if (error.message.includes("Wait at least one block")) {
      errorMessage = "Please wait at least one block after committing"
    } else if (error.message.includes("Hash does not match")) {
      errorMessage = "The number doesn't match your committed hash"
    } else if (error.message.includes("Commit expired")) {
      errorMessage = "Your commit has expired. Please commit again"
    } else if (error.message.includes("Unlock attempt failed")) {
      errorMessage = "Unlock attempt failed. You had a 20% chance of success (random number not divisible by 5)"
    }

    return {
      success: false,
      hash: "",
      error: errorMessage,
    }
  }
}

// Get token balance
export async function getTokenBalance(address: string): Promise<string> {
  try {
    const provider = getProvider()
    const contract = getContract(provider)

    const balance = await contract.balanceOf(address)
    return ethers.utils.formatEther(balance)
  } catch (error) {
    console.error("Error getting token balance:", error)
    return "0"
  }
}

// Transfer tokens
export async function transferTokens(
  to: string,
  amount: string,
  from: string,
): Promise<{
  success: boolean
  hash: string
  error?: string
}> {
  try {
    const provider = getProvider()

    // Make sure the provider is connected
    await provider.send("eth_requestAccounts", [])

    const contract = getContract(provider)

    const amountWei = ethers.utils.parseEther(amount)

    console.log("Transferring tokens:", {
      to,
      amount,
      amountWei: amountWei.toString(),
      from,
    })

    const tx = await contract.transfer(to, amountWei, {
      gasLimit: 200000, // Set a reasonable gas limit
    })

    console.log("Transaction sent:", tx.hash)

    const receipt = await tx.wait()
    console.log("Transaction confirmed:", receipt)

    return {
      success: true,
      hash: tx.hash,
    }
  } catch (error: any) {
    console.error("Error in transferTokens:", error)

    // Extract error message
    let errorMessage = "Transfer failed"

    if (error.message.includes("Tokens are locked")) {
      errorMessage = "Your tokens are locked. You need to unlock them first"
    } else if (error.message.includes("Transfer amount exceeds unlocked tokens")) {
      errorMessage = "Transfer amount exceeds your unlocked tokens"
    } else if (error.message.includes("insufficient funds")) {
      errorMessage = "Insufficient funds for transfer"
    }

    return {
      success: false,
      hash: "",
      error: errorMessage,
    }
  }
}

// Format time remaining
export function formatTimeRemaining(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = timestamp - now

  if (diff <= 0) return "Expired"

  const hours = Math.floor(diff / 3600)
  const minutes = Math.floor((diff % 3600) / 60)

  return `${hours}h ${minutes}m`
}

// Check if a commit exists
export async function checkCommitExists(address: string): Promise<boolean> {
  try {
    const provider = getProvider()
    const contract = getContract(provider)

    const commit = await contract.commits(address)
    return commit.hash !== ethers.constants.HashZero
  } catch (error) {
    console.error("Error checking if commit exists:", error)
    return false
  }
}


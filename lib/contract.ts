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
}

// Check if tokens are unlocked
export async function checkIfTokensUnlocked(address: string): Promise<{
  isUnlocked: boolean
  unlockedUntil: number
  unlockedAmount: string
  nextAttemptTime: number
  hasCommit: boolean
}> {
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
}

// Commit a number
export async function commitNumber(number: number): Promise<string> {
  const provider = getProvider()
  const contract = getContract(provider)

  const tx = await contract.commitHash(number)
  await tx.wait()

  return tx.hash
}

// Reveal a number
export async function revealNumber(number: number): Promise<{
  success: boolean
  hash: string
  error?: string
}> {
  const provider = getProvider()
  const contract = getContract(provider)

  try {
    const tx = await contract.revealAndUnlock(number)
    const receipt = await tx.wait()

    // Check if the TokensUnlocked event was emitted
    const unlockEvent = receipt.events?.find((e: any) => e.event === "TokensUnlocked")

    return {
      success: !!unlockEvent,
      hash: tx.hash,
    }
  } catch (error: any) {
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
  const provider = getProvider()
  const contract = getContract(provider)

  const balance = await contract.balanceOf(address)
  return ethers.utils.formatEther(balance)
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
  const provider = getProvider()
  const contract = getContract(provider)

  try {
    const amountWei = ethers.utils.parseEther(amount)
    const tx = await contract.transfer(to, amountWei)
    await tx.wait()

    return {
      success: true,
      hash: tx.hash,
    }
  } catch (error: any) {
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
  const provider = getProvider()
  const contract = getContract(provider)

  const commit = await contract.commits(address)
  return commit.hash !== ethers.constants.HashZero
}


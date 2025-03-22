// This file handles wallet connection and interaction

export async function connectWallet(): Promise<string> {
  // Check if MetaMask is installed
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })

      // Check if we're on BASE Sepolia testnet (chainId 84532)
      const chainId = await window.ethereum.request({ method: "eth_chainId" })

      if (chainId !== "0x14a34") {
        // 84532 in hex
        try {
          // Try to switch to BASE Sepolia
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x14a34" }],
          })
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x14a34",
                  chainName: "BASE Sepolia Testnet",
                  nativeCurrency: {
                    name: "ETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  rpcUrls: ["https://sepolia.base.org"],
                  blockExplorerUrls: ["https://sepolia.basescan.org"],
                },
              ],
            })
          } else {
            throw switchError
          }
        }
      }

      return accounts[0]
    } catch (error) {
      console.error("Error connecting to MetaMask", error)
      throw error // Pass the error up so we can handle it in the UI
    }
  } else {
    throw new Error("Please install MetaMask to use this application")
  }
}

// Add event listener for account changes
export function setupAccountChangeListener(callback: (accounts: string[]) => void): void {
  if (typeof window !== "undefined" && window.ethereum) {
    window.ethereum.on("accountsChanged", callback)
  }
}

// Add event listener for chain changes
export function setupChainChangeListener(callback: () => void): void {
  if (typeof window !== "undefined" && window.ethereum) {
    window.ethereum.on("chainChanged", callback)
  }
}

// Remove event listeners when component unmounts
export function removeEventListeners(accountCallback: (accounts: string[]) => void, chainCallback: () => void): void {
  if (typeof window !== "undefined" && window.ethereum) {
    window.ethereum.removeListener("accountsChanged", accountCallback)
    window.ethereum.removeListener("chainChanged", chainCallback)
  }
}


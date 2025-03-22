// This file handles wallet connection and interaction

export async function connectWallet(): Promise<string> {
  // Check if MetaMask is installed
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      // Request account access - this is the part that might be failing
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please unlock MetaMask and try again.")
      }

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
            try {
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

              // After adding the network, try to get accounts again
              const updatedAccounts = await window.ethereum.request({
                method: "eth_requestAccounts",
              })

              return updatedAccounts[0]
            } catch (addError) {
              console.error("Error adding network:", addError)
              throw new Error("Failed to add BASE Sepolia network to MetaMask")
            }
          } else {
            console.error("Error switching network:", switchError)
            throw new Error("Failed to switch to BASE Sepolia network")
          }
        }
      }

      return accounts[0]
    } catch (error) {
      console.error("Error connecting to MetaMask", error)
      throw error
    }
  } else {
    window.open("https://metamask.io/download.html", "_blank")
    throw new Error("MetaMask is not installed")
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


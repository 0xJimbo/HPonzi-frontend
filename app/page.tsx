import TokenDashboard from "@/components/token-dashboard"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-background/80 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <TokenDashboard />
      </div>
    </main>
  )
}


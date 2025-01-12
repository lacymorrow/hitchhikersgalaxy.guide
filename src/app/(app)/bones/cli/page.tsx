import { InstallSection } from '@/components/blocks/install-section'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <main className="flex-grow">
        <InstallSection />
      </main>
    </div>
  )
}

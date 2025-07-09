export default function Home() {
	return (
        <main className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">
                    Welcome to {{ projectName }}
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                    Your ShipKit app is ready to go!
                </p>
                <div className="space-y-2">
                    <p className="text-sm text-gray-500">Template: {{ template.name }}</p>
                    <p className="text-sm text-gray-500">Package Manager: {{ packageManager }}</p>
                </div>
            </div>
        </main>
    );
}

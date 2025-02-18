"use client";

import { Button } from "@/components/ui/button";
import {
	type Arc,
	recordVisitorLocation,
} from "@/server/actions/visitor-location";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const World = dynamic(() => import("./globe").then((m) => m.World), {
	ssr: false,
});

const colors = ["#06b6d4", "#3b82f6", "#6366f1"] as const;

// Major tech hubs and interesting locations
const destinations = [
	{ name: "Silicon Valley", lat: 37.3875, lng: -122.0575 },
	{ name: "Tokyo", lat: 35.6762, lng: 139.6503 },
	{ name: "London", lat: 51.5074, lng: -0.1278 },
	{ name: "Singapore", lat: 1.3521, lng: 103.8198 },
	{ name: "Sydney", lat: -33.8688, lng: 151.2093 },
	{ name: "Dubai", lat: 25.2048, lng: 55.2708 },
	{ name: "Cape Town", lat: -33.9249, lng: 18.4241 },
	{ name: "Rio de Janeiro", lat: -22.9068, lng: -43.1729 },
	{ name: "Reykjavik", lat: 64.147, lng: -21.9408 },
	{ name: "Antarctica Research", lat: -82.8628, lng: -135.0 },
] as const;

function getFallbackDestination(currentLat: number, currentLng: number) {
	// Different strategies for picking destinations
	const strategies = [
		// Antipode (opposite side of Earth)
		() => {
			const antipodeLat = -currentLat;
			const antipodeLng = currentLng > 0 ? currentLng - 180 : currentLng + 180;
			return {
				name: "Antipode",
				lat: antipodeLat,
				lng: antipodeLng,
			};
		},
		// Nearest tech hub
		() => {
			return destinations.reduce((nearest, current) => {
				const currentDist = Math.sqrt(
					Math.pow(current.lat - currentLat, 2) +
					Math.pow(current.lng - currentLng, 2),
				);
				const nearestDist = Math.sqrt(
					Math.pow(nearest.lat - currentLat, 2) +
					Math.pow(nearest.lng - currentLng, 2),
				);
				return currentDist < nearestDist ? current : nearest;
			}, destinations[0]);
		},
		// Random tech hub
		() =>
			destinations[Math.floor(Math.random() * destinations.length)] ||
			destinations[0],
		// Most distant tech hub
		() => {
			return destinations.reduce((farthest, current) => {
				const currentDist = Math.sqrt(
					Math.pow(current.lat - currentLat, 2) +
					Math.pow(current.lng - currentLng, 2),
				);
				const farthestDist = Math.sqrt(
					Math.pow(farthest.lat - currentLat, 2) +
					Math.pow(farthest.lng - currentLng, 2),
				);
				return currentDist > farthestDist ? current : farthest;
			}, destinations[0]);
		},
	] as const;

	// Pick a random strategy
	const strategyIndex = Math.floor(Math.random() * strategies.length);
	return strategies[strategyIndex]();
}

export function GlobeDemo() {
	const [visitorArcs, setVisitorArcs] = useState<Arc[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [currentLocation, setCurrentLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [lastVisitorLocation, setLastVisitorLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);

	const globeConfig = {
		pointSize: 4,
		globeColor: "#062056",
		showAtmosphere: true,
		atmosphereColor: "#FFFFFF",
		atmosphereAltitude: 0.1,
		emissive: "#062056",
		emissiveIntensity: 0.1,
		shininess: 0.9,
		polygonColor: "rgba(255,255,255,0.7)",
		ambientLight: "#38bdf8",
		directionalLeftLight: "#ffffff",
		directionalTopLight: "#ffffff",
		pointLight: "#ffffff",
		arcTime: 1000,
		arcLength: 0.9,
		rings: 1,
		maxRings: 3,
		initialPosition: { lat: 22.3193, lng: 114.1694 },
		autoRotate: true,
		autoRotateSpeed: 0.5,
	} as const;

	useEffect(() => {
		// Get visitor's location
		if (navigator?.geolocation) {
			navigator.geolocation.getCurrentPosition(
				async (position) => {
					try {
						const location = {
							lat: position.coords.latitude,
							lng: position.coords.longitude,
						};
						setCurrentLocation(location);

						const visitorLocation = {
							...location,
							timestamp: Date.now(),
						};

						// Record visitor location
						const result = await recordVisitorLocation(visitorLocation);
						if (!result.success) {
							throw new Error(result.error);
						}

						// Add visitor arc
						const newArc: Arc = {
							order: 1,
							startLat: visitorLocation.lat,
							startLng: visitorLocation.lng,
							endLat: globeConfig.initialPosition.lat,
							endLng: globeConfig.initialPosition.lng,
							arcAlt: 0.3,
							color: colors[0],
						};

						setVisitorArcs((prev) => [...prev, newArc]);
						setError(null);
					} catch (err) {
						console.error("Error recording visitor:", err);
						setError("Failed to record your location");
					}
				},
				(err) => {
					console.error("Error getting location:", err);
					setError("Unable to get your location");
				},
			);
		} else {
			setError("Geolocation is not supported by your browser");
		}

		// Set up SSE for real-time visitor updates
		const eventSource = new EventSource("/api/visitor-events");

		eventSource.onmessage = (event) => {
			try {
				const visitorLocation = JSON.parse(event.data);
				setLastVisitorLocation({
					lat: visitorLocation.lat,
					lng: visitorLocation.lng,
				});

				// Add new visitor arc
				const newArc: Arc = {
					order: 1,
					startLat: visitorLocation.lat,
					startLng: visitorLocation.lng,
					endLat: globeConfig.initialPosition.lat,
					endLng: globeConfig.initialPosition.lng,
					arcAlt: 0.3,
					color: colors[0],
				};

				setVisitorArcs((prev) => {
					// Keep only last 30 arcs for performance
					const updated = [...prev, newArc];
					if (updated.length > 30) {
						return updated.slice(-30);
					}
					return updated;
				});
				setError(null);
			} catch (err) {
				console.error("Error processing visitor event:", err);
				setError("Error processing visitor data");
			}
		};

		eventSource.onerror = () => {
			setError("Lost connection to visitor updates");
		};

		return () => {
			eventSource.close();
		};
	}, [globeConfig.initialPosition.lat, globeConfig.initialPosition.lng]);

	const handlePing = async () => {
		if (!currentLocation) {
			setError("Location not available");
			return;
		}

		try {
			setIsLoading(true);

			// Use last visitor location if available, otherwise get a fallback destination
			const destination =
				lastVisitorLocation ||
				getFallbackDestination(currentLocation.lat, currentLocation.lng);

			// Record the ping
			const result = await recordVisitorLocation({
				...currentLocation,
				timestamp: Date.now(),
			});

			if (!result.success) {
				throw new Error(result.error);
			}

			// Add ping arc
			const newArc: Arc = {
				order: 1,
				startLat: currentLocation.lat,
				startLng: currentLocation.lng,
				endLat: destination.lat,
				endLng: destination.lng,
				arcAlt: 0.5,
				color: colors[Math.floor(Math.random() * colors.length)] || colors[0],
			};

			setVisitorArcs((prev) => {
				const updated = [...prev, newArc];
				if (updated.length > 30) {
					return updated.slice(-30);
				}
				return updated;
			});

			setError(null);
		} catch (err) {
			console.error("Error sending ping:", err);
			setError("Failed to send ping");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="relative flex min-h-[40rem] w-full flex-col items-center justify-start bg-white px-4 py-8 dark:bg-black">
			{/* Header Section */}
			<div className="relative z-10 mb-4 w-full max-w-3xl space-y-4">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 1 }}
				>
					<h2 className="text-center text-xl font-bold text-black dark:text-white md:text-4xl">
						Live Visitor Globe
					</h2>
					<p className="mx-auto mt-2 max-w-md text-center text-base font-normal text-neutral-700 dark:text-neutral-200 md:text-lg">
						Watch as visitors from around the world connect in real-time
					</p>
				</motion.div>
				{error && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="mx-auto max-w-md text-center text-sm text-red-500"
					>
						{error}
					</motion.div>
				)}
				<div className="flex justify-center">
					<Button
						onClick={handlePing}
						disabled={!currentLocation || isLoading}
						className="relative z-20 bg-blue-500 text-white hover:bg-blue-600"
					>
						{isLoading ? "Sending Ping..." : "Send Random Ping"}
					</Button>
				</div>
			</div>

			{/* Globe Section */}
			<div className="relative h-[30rem] w-full max-w-7xl md:h-[35rem]">
				<div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-40 w-full select-none bg-gradient-to-b from-transparent to-white dark:to-black" />
				<div className="absolute inset-0">
					<World data={visitorArcs} globeConfig={globeConfig} />
				</div>
			</div>
		</div>
	);
}

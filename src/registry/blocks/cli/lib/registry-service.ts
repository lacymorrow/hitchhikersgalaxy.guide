import { Registry, RegistryItem } from './types'

const BUILT_IN_REGISTRIES = [
	{
		name: 'shadcn/ui',
		url: 'https://ui.shadcn.com/r',
		description: 'Official shadcn/ui component registry with customizable components and blocks',
		baseComponentUrl: 'https://ui.shadcn.com/r',
		baseBlockUrl: 'https://ui.shadcn.com/r'
	},
	{
		name: 'Magic UI',
		url: 'https://magicui.design/r',
		description: 'Beautiful animated components and effects for modern web applications',
		baseComponentUrl: 'https://magicui.design/r',
		baseBlockUrl: 'https://magicui.design/r'
	},
	{
		name: 'Bones Registry',
		url: 'https://registry.bones.sh',
		description: 'Community-driven component registry',
		baseComponentUrl: 'https://registry.bones.sh',
		baseBlockUrl: 'https://registry.bones.sh'
	}
] as const

const STORAGE_KEY = 'reg-browser:custom-registries'

export type RegistryName = typeof BUILT_IN_REGISTRIES[number]['name']

function getCustomRegistries(): Registry[] {
	if (typeof window === 'undefined') return []
	const stored = localStorage.getItem(STORAGE_KEY)
	return stored ? JSON.parse(stored) : []
}

function saveCustomRegistries(registries: Registry[]) {
	if (typeof window === 'undefined') return
	localStorage.setItem(STORAGE_KEY, JSON.stringify(registries))
}

export async function getRegistries(): Promise<Registry[]> {
	return [...BUILT_IN_REGISTRIES, ...getCustomRegistries()]
}

export function addCustomRegistry(registry: Registry) {
	const customRegistries = getCustomRegistries()
	customRegistries.push(registry)
	saveCustomRegistries(customRegistries)
}

export function removeCustomRegistry(name: string) {
	const customRegistries = getCustomRegistries()
	const filtered = customRegistries.filter(r => r.name !== name)
	saveCustomRegistries(filtered)
}

export async function getRegistry(name: RegistryName): Promise<Registry> {
	const registry = [...BUILT_IN_REGISTRIES, ...getCustomRegistries()].find(r => r.name === name)
	if (!registry) {
		throw new Error(`Registry ${name} not found`)
	}
	return registry
}

export async function fetchRegistryIndex(registryUrl: string): Promise<RegistryItem[]> {
	// Ensure URL ends with index.json for registry indexes
	const url = registryUrl.endsWith('index.json') 
		? registryUrl 
		: registryUrl.endsWith('/') 
			? `${registryUrl}index.json`
			: `${registryUrl}/index.json`;

	const response = await fetch(url)
	if (!response.ok) {
		throw new Error(`Failed to fetch registry: ${response.statusText}`)
	}
	return response.json()
}

export async function fetchItemDetails(
	baseUrl: string,
	itemName: string,
	style: string = 'default'
): Promise<RegistryItem> {
	// Handle different registry URL structures
	const baseUrlWithoutIndex = baseUrl.endsWith('/index.json')
		? baseUrl.replace('/index.json', '')
		: baseUrl

	const detailsUrl = `${baseUrlWithoutIndex}/styles/${style}/${itemName}.json`
	const componentUrl = detailsUrl // Store the full URL for installation

	const response = await fetch(detailsUrl)
	if (!response.ok) {
		throw new Error(`Failed to fetch item details: ${response.statusText}`)
	}

	const data = await response.json()

	// Add the full component URL to the item data
	return {
		...data,
		componentUrl
	}
}

export function categorizeItems(items: RegistryItem[]): Record<string, RegistryItem[]> {
	return items.reduce((acc, item) => {
		const category = item.type === 'registry:block' ? 'Blocks' : 'Components'
		if (!acc[category]) {
			acc[category] = []
		}
		acc[category].push(item)
		return acc
	}, {} as Record<string, RegistryItem[]>)
}

export function groupItemsByType(items: RegistryItem[]): Record<string, RegistryItem[]> {
	return items.reduce((acc, item) => {
		const types = item.categories || ['Uncategorized']
		types.forEach(type => {
			if (!acc[type]) {
				acc[type] = []
			}
			acc[type].push(item)
		})
		return acc
	}, {} as Record<string, RegistryItem[]>)
}

export function searchItems(
	items: RegistryItem[],
	query: string,
	filters: {
		type?: 'all' | 'components' | 'blocks'
		category?: string
	} = {}
): RegistryItem[] {
	return items.filter(item => {
		// Type filter
		if (filters.type && filters.type !== 'all') {
			if (filters.type === 'components' && item.type !== 'registry:ui') return false
			if (filters.type === 'blocks' && item.type !== 'registry:block') return false
		}

		// Category filter
		if (filters.category && filters.category !== 'all') {
			if (!item.categories?.includes(filters.category)) return false
		}

		// Search query
		if (query) {
			const searchString = [
				item.name,
				item.description,
				...(item.categories || []),
				...(item.dependencies || [])
			].join(' ').toLowerCase()

			return query.toLowerCase().split(' ').every(term => searchString.includes(term))
		}

		return true
	})
}

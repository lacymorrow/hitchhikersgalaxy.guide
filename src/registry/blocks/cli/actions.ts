'use server'

import { spawn, exec } from 'child_process'
import { readdirSync, readFileSync } from 'fs'
import path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function getProjectRoot(): Promise<string> {
	try {
		const { stdout } = await execAsync('git rev-parse --show-toplevel')
		return stdout.trim()
	} catch (error) {
		throw new Error('Not in a git repository')
	}
}

export async function installComponent(componentUrl: string, projectRoot: string, overwrite: boolean = false): Promise<ReadableStream> {
	const encoder = new TextEncoder()

	return new ReadableStream({
		async start(controller) {
			try {
				const args = ['shadcn@latest', 'add', componentUrl]
				if (overwrite) {
					args.push('--overwrite')
				}
				
				const process = spawn('npx', args, { 
					cwd: projectRoot,
					stdio: ['pipe', 'pipe', 'pipe']
				})

				// If not overwriting, automatically answer "n" to prompts
				if (!overwrite && process.stdin) {
					process.stdin.write('n\n')
					process.stdin.end()
				}

				process.stdout?.on('data', (data) => {
					controller.enqueue(encoder.encode(data))
				})

				process.stderr?.on('data', (data) => {
					controller.enqueue(encoder.encode(data))
				})

				process.on('close', (code) => {
					if (code !== 0) {
						controller.enqueue(encoder.encode(`\nProcess exited with code ${code}`))
					}
					controller.close()
				})

				process.on('error', (err) => {
					controller.enqueue(encoder.encode(`\nError: ${err.message}`))
					controller.close()
				})
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Unknown error occurred'
				controller.enqueue(encoder.encode(`\nError: ${message}`))
				controller.close()
			}
		}
	})
}

export async function getDependencies(projectRoot: string): Promise<{
	dependencies: Record<string, string>
	devDependencies: Record<string, string>
}> {
	try {
		const packageJsonPath = path.join(projectRoot, 'package.json')
		const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
			dependencies: Record<string, string>
			devDependencies: Record<string, string>
		}

		return {
			dependencies: packageJson.dependencies || {},
			devDependencies: packageJson.devDependencies || {}
		}
	} catch (error) {
		throw new Error('Failed to read package.json')
	}
}

export async function getInstalledComponents(projectRoot: string): Promise<string[]> {
	try {
		const componentsDir = path.join(projectRoot, 'src/components/ui')
		return readdirSync(componentsDir)
			.filter(file => file.endsWith('.tsx'))
			.map(file => file.replace('.tsx', ''))
	} catch (error) {
		return []
	}
}

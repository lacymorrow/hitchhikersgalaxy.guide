export function Footer() {
	return (
		<footer className="py-6 px-4 md:px-6 lg:px-8 border-t">
			<div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
				© {new Date().getFullYear()} CLI Tool. All rights reserved.
			</div>
		</footer>
	);
}

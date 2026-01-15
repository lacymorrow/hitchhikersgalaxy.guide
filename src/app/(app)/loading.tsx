/* Loading Component
 * This is a special Next.js file that shows during page transitions and loading states
 * @see https://nextjs.org/docs/app/building-your-application/routing/loading-ui
 */
import { Loader } from "@/components/primitives/loader";

export default function LoadingComponent() {
	return (
		<Loader
			className="flex-1 min-h-[50vh]" // Fill available space in the layout
			fade // Enables a smooth fade in/out animation
		/>
	);
}

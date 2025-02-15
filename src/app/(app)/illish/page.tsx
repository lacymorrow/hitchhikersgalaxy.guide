import { Balancer } from "@/components/primitives/balancer";
import { Link } from "@/components/primitives/link-with-transition";
import { siteConfig } from "@/config/site";
import { AsciiCube } from "./_components/ascii-cube";

export default function Page() {
	return (
		<>
			<div className="container absolute inset-0 -z-10">
				<AsciiCube />
			</div>

			<div className="container flex flex-col items-start justify-start p-16 gap-xl">
				<Balancer className="lg:text-[5rem] text-[3rem] font-bold"><span className="font-serif">illi</span> is a startup <span className="font-serif">accelerator</span>.</Balancer>
				<p className="text-lg">We know Next.js. We know Tailwind. We know shadcn.</p>
				<p className="text-lg">We know how to build your next project. <Link href={`mailto:${siteConfig.email.support}`}>Learn how</Link></p>
			</div >
		</>
	);
}

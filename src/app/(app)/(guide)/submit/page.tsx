import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

const SubmitPage = () => {
    const router = useRouter();

    const handleSubmit = async (event) => {
        event.preventDefault();
        // ... existing code ...
        toast({
            title: "Entry Submitted!",
            description:
                "Your contribution to the Guide has been recorded. Don't forget your towel!",
            className: "bg-green-500/10 text-green-500 border-green-500/20",
        });
        router.push(`/${encodeURIComponent(result.data.searchTerm)}`);
        // ... existing code ...
    };

    return (
        <div>
            {/* ... existing form ... */}
        </div>
    );
};

export default SubmitPage;

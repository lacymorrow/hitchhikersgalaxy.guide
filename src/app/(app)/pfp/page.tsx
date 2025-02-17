import { UploadForm } from "./components/upload-form";

export const metadata = {
    title: "AI Profile Picture Generator",
    description: "Generate beautiful profile pictures with AI background removal",
};

export default function PFPPage() {
    return (
        <div className="container max-w-4xl py-8">
            <div className="space-y-4 text-center">
                <h1 className="text-3xl font-bold">AI Profile Picture Generator</h1>
                <p className="text-muted-foreground">
                    Upload your photo and let AI create a beautiful profile picture with a
                    custom background color.
                </p>
            </div>
            <div className="mt-8">
                <UploadForm />
            </div>
        </div>
    );
}

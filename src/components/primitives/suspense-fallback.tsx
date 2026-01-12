import { Loading } from "@/components/ui/loading";

interface SuspenseFallbackProps {
  className?: string;
  height?: string;
}

export const SuspenseFallback = ({ className, height }: SuspenseFallbackProps) => {
  return (
    <div className={className} style={{ height: height }}>
      <Loading fade={true} />
    </div>
  );
};

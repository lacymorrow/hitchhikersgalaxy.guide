const UNITS = ["B", "kB", "MB", "GB", "TB"] as const;

function formatBytes(size: number): string {
  const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  const unit = UNITS[i] ?? "TB";
  return `${+(size / 1024 ** i).toFixed(2)}${unit}`;
}

interface ProgressProps {
  text: string;
  percentage?: number;
  total?: number;
}

export default function Progress({ text, percentage = 0, total }: ProgressProps) {
  const showTotal = total !== undefined && !Number.isNaN(total);
  return (
    <div className="w-full bg-gray-100 dark:bg-gray-700 text-left rounded-lg overflow-hidden mb-0.5">
      <div
        className="bg-blue-400 whitespace-nowrap px-1 text-sm"
        style={{ width: `${percentage}%` }}
      >
        {text} ({percentage.toFixed(2)}%{showTotal ? ` of ${formatBytes(total)}` : ""})
      </div>
    </div>
  );
}

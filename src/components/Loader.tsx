interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Loader = ({ size = "md", className = "" }: LoaderProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-orange-200 border-t-orange-500 ${sizeClasses[size]} ${className}`}
    />
  );
};

export const LoaderWithText = ({
  text,
  size = "sm",
  className = "",
}: LoaderProps & { text: string }) => (
  <div className={`flex items-center ${className}`}>
    <Loader size={size} className="mr-2" />
    <span>{text}</span>
  </div>
);

import { cn } from "@/lib/utils";

export interface AuthHeadingProps {
  title: string;
  description: string;
  size?: "sm" | "lg";
  align?: "center" | "start";
}

export const AuthHeading = ({
  title,
  description,
  size = "sm",
  align = "center",
}: AuthHeadingProps) => {
  return (
    <div
      className={cn("flex flex-col gap-1", align === "center" && "text-center")}
    >
      <h1
        className={cn(
          "font-heading tracking-tight",
          size === "lg" ? "text-2xl font-bold" : "text-xl font-semibold",
        )}
      >
        {title}
      </h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
};

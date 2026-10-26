export interface AuthHeadingProps {
  title: string;
  description: string;
}

export const AuthHeading = ({ title, description }: AuthHeadingProps) => {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-heading text-ink text-[28px] leading-[35px] font-semibold tracking-tight">
        {title}
      </h1>
      <p className="text-muted-foreground text-[12px] leading-[16px]">
        {description}
      </p>
    </div>
  );
};

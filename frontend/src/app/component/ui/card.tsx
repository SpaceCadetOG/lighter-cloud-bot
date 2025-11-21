// frontend/src/app/component/ui/card.tsx
import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={
        "rounded-2xl border border-purple-700/60 bg-black/40 shadow-lg " +
        "backdrop-blur-md " +
        className
      }
      {...props}
    />
  );
}

export function CardHeader({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={
        "border-b border-purple-800/60 px-4 py-3 flex items-center justify-between " +
        className
      }
      {...props}
    />
  );
}

export function CardTitle({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={
        "text-sm font-semibold tracking-wide text-purple-100 uppercase " +
        className
      }
      {...props}
    />
  );
}

export function CardContent({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={"px-4 py-3 " + className} {...props} />;
}
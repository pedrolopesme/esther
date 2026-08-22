"use client";

import { cn } from "../../utils/cn";

/**
 * Soft claymorphism card surface.
 */
export default function Card({ children, className = "", as: Tag = "div", ...rest }) {
  return (
    <Tag className={cn("clay p-6", className)} {...rest}>
      {children}
    </Tag>
  );
}

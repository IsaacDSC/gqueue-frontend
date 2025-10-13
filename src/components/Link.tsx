import React from "react";
import { useRouter } from "../hooks/useRouter";

interface LinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Link: React.FC<LinkProps> = ({
  to,
  children,
  className,
  onClick,
}) => {
  const { navigate, currentPath } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("Link clicked:", { to, currentPath });

    if (to === currentPath) {
      console.log("Already on target path, skipping navigation");
      return;
    }

    try {
      navigate(to);
      console.log("Navigation triggered successfully");

      if (onClick) {
        onClick();
      }
    } catch (error) {
      console.error("Navigation failed:", error);
    }
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className={className}
      style={{ cursor: "pointer" }}
    >
      {children}
    </a>
  );
};

export default Link;

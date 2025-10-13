// New unified SectionCard component
import React, { useState } from "react";
import type { ReactNode } from "react";

interface SectionCardProps {
  title?: string;
  heading?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  heading,
  children,
  defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="pt-6">
      <div
        className="cursor-pointer p-4 text-primary text-xl font-semibold border rounded-t-md border-x border-primary-lg bg-primary-xl"
        onClick={() => setOpen(!open)}
      >
        {heading || title}
      </div>
      {open && <div className="p-4 border border-primary-lg rounded-b-md bg-secondary-color">{children}</div>}
    </div>
  );
};

export default SectionCard;

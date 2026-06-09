"use client";

import { Button } from "@/components/ui/button";

export default function TeamPrintButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="no-print text-[#364B59] border-[#364B59] hover:bg-[#364B59] hover:text-white"
    >
      Imprimir / PDF
    </Button>
  );
}

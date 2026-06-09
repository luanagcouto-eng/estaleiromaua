"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

export default function OrgChartFooter() {
  const [now, setNow] = useState("");

  useEffect(() => {
    setNow(
      new Date().toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }, []);

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
      <span>Última atualização: {now}</span>
      <span>·</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-1 text-[#F18213] hover:underline font-medium"
      >
        <RefreshCw className="w-3 h-3" />
        Atualizar dados
      </button>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

export default function PrintElements() {
  const [now, setNow] = useState("");

  useEffect(() => {
    // Timestamp is set client-side so it reflects the actual print time
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
    <>
      {/* Visible only on print — fixed header repeats on every page */}
      <div className="print-only print-page-header">
        <div className="print-header-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-maua.png" alt="Estaleiro Mauá" className="print-logo" />
          <span className="print-system-name">METAS ESTRATÉGICAS 2026 — ESTALEIRO MAUÁ</span>
        </div>
        <div className="print-rule" />
      </div>

      {/* Visible only on print — fixed footer repeats on every page */}
      <div className="print-only print-page-footer">
        <div className="print-rule print-rule-light" />
        <div className="print-footer-inner">
          <span>Impresso em {now}</span>
          <span>Metas Estratégicas 2026 — Estaleiro Mauá</span>
        </div>
      </div>
    </>
  );
}

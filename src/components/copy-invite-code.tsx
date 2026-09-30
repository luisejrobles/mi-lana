"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CopyInviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        id="invite-code"
        readOnly
        value={code}
        className="font-mono"
        onFocus={(event) => event.target.select()}
      />
      <Button type="button" variant="outline" onClick={copy}>
        {copied ? "¡Copiado!" : "Copiar"}
      </Button>
    </div>
  );
}

"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { centsToPesos, formatMoney } from "@/lib/money";
import { formatShortDate } from "@/lib/dates";
import { createSettlement, type SettlementFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const initialState: SettlementFormState = { error: null };

// Records a payment from `fromUser` (debtor) to `toUser` (creditor).
// Labels are v1 two-person wording: "Tú" / "Tu pareja".
export function SettleForm({
  balanceCents,
  fromUser,
  toUser,
  fromLabel,
  toLabel,
}: {
  balanceCents: number; // absolute value owed
  fromUser: string;
  toUser: string;
  fromLabel: string;
  toLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createSettlement,
    initialState,
  );
  const [date, setDate] = useState<Date>(new Date());

  const prevState = useRef(state);
  useEffect(() => {
    if (prevState.current !== state && state.error === null) setOpen(false);
    prevState.current = state;
  }, [state]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Saldar</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
            <DialogDescription>
              {fromLabel} paga {formatMoney(balanceCents)} a {toLabel}. Puedes
              registrar un pago parcial.
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="from_user" value={fromUser} />
            <input type="hidden" name="to_user" value={toUser} />

            <div className="grid gap-2">
              <Label htmlFor="settle-amount">Monto (MXN)</Label>
              <Input
                id="settle-amount"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                required
                defaultValue={centsToPesos(balanceCents)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className="justify-start font-normal"
                    />
                  }
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {formatShortDate(date)}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selected) => selected && setDate(selected)}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              <input
                type="hidden"
                name="date"
                value={format(date, "yyyy-MM-dd")}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="settle-note">Nota (opcional)</Label>
              <Input
                id="settle-note"
                name="note"
                maxLength={200}
                placeholder="Transferencia"
              />
            </div>

            {state.error ? (
              <p className="text-sm text-destructive">{state.error}</p>
            ) : null}

            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Registrar pago"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

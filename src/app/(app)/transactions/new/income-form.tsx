"use client";

import { useActionState, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { formatShortDate } from "@/lib/dates";
import { createIncome, type IncomeFormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type IncomeSourceOption = { id: string; name: string };

const initialState: IncomeFormState = { error: null };

export function IncomeForm({ sources }: { sources: IncomeSourceOption[] }) {
  const [state, formAction, pending] = useActionState(createIncome, initialState);
  const [date, setDate] = useState<Date>(new Date());
  const [sourceId, setSourceId] = useState(sources[0]?.id ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="income-amount">Monto (MXN)</Label>
        <Input
          id="income-amount"
          name="amount"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          required
          placeholder="0.00"
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
        <input type="hidden" name="date" value={format(date, "yyyy-MM-dd")} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="income-description">Descripción</Label>
        <Input
          id="income-description"
          name="description"
          maxLength={200}
          placeholder="Quincena"
        />
      </div>

      <div className="grid gap-2">
        <Label>Fuente</Label>
        <Select
          value={sourceId}
          onValueChange={(value) => setSourceId(value ?? "")}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Elige una fuente" />
          </SelectTrigger>
          <SelectContent>
            {sources.map((source) => (
              <SelectItem key={source.id} value={source.id}>
                {source.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="income_source_id" value={sourceId} />
      </div>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Registrar ingreso"}
      </Button>
    </form>
  );
}

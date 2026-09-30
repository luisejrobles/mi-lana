"use client";

import { useActionState, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cardDueDate, formatLongDate, formatShortDate } from "@/lib/dates";
import { createSpend, type SpendFormState } from "../actions";
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
import { Switch } from "@/components/ui/switch";

export type SpendCategoryOption = { id: string; name: string; color: string };
export type SpendPaymentMethodOption = {
  id: string;
  name: string;
  type: "cash" | "card";
  cut_day: number | null;
  due_day: number | null;
};

const initialState: SpendFormState = { error: null };

export function SpendForm({
  categories,
  paymentMethods,
}: {
  categories: SpendCategoryOption[];
  paymentMethods: SpendPaymentMethodOption[];
}) {
  const [state, formAction, pending] = useActionState(createSpend, initialState);
  const [date, setDate] = useState<Date>(new Date());
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [isShared, setIsShared] = useState(false);

  const selectedMethod = paymentMethods.find((m) => m.id === paymentMethodId);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="amount">Monto (MXN)</Label>
        <Input
          id="amount"
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
        <Label htmlFor="description">Descripción</Label>
        <Input
          id="description"
          name="description"
          maxLength={200}
          placeholder="Super de la semana"
        />
      </div>

      <div className="grid gap-2">
        <Label>Categoría</Label>
        <Select
          value={categoryId}
          onValueChange={(value) => setCategoryId(value ?? "")}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Elige una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="category_id" value={categoryId} />
      </div>

      <div className="grid gap-2">
        <Label>Método de pago</Label>
        <Select
          value={paymentMethodId}
          onValueChange={(value) => setPaymentMethodId(value ?? "")}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Elige un método" />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map((method) => (
              <SelectItem key={method.id} value={method.id}>
                {method.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="payment_method_id" value={paymentMethodId} />
        {selectedMethod?.type === "card" &&
        selectedMethod.cut_day &&
        selectedMethod.due_day ? (
          <p className="text-sm text-muted-foreground">
            Se paga el{" "}
            <strong>
              {formatLongDate(
                cardDueDate(selectedMethod.cut_day, selectedMethod.due_day, date),
              )}
            </strong>
            .
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-4 rounded-md border p-3">
        <div>
          <Label htmlFor="shared-switch">Gasto compartido</Label>
          <p className="text-sm text-muted-foreground">
            Se divide con tu pareja.
          </p>
        </div>
        <Switch
          id="shared-switch"
          checked={isShared}
          onCheckedChange={setIsShared}
        />
      </div>
      <input type="hidden" name="is_shared" value={isShared ? "true" : "false"} />

      {isShared ? (
        <div className="grid gap-2">
          <Label htmlFor="payer_share_pct">Tu parte (%)</Label>
          <Input
            id="payer_share_pct"
            name="payer_share_pct"
            type="number"
            min={0}
            max={100}
            step={1}
            inputMode="numeric"
            defaultValue={50}
            required
          />
          <p className="text-sm text-muted-foreground">
            Tú cubres este porcentaje; tu pareja el resto.
          </p>
        </div>
      ) : null}

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Registrar gasto"}
      </Button>
    </form>
  );
}

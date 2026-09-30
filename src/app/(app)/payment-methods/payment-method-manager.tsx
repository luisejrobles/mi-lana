"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { cardDueDate, formatLongDate } from "@/lib/dates";
import {
  archivePaymentMethod,
  createPaymentMethod,
  updatePaymentMethod,
  type PaymentMethodFormState,
} from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type PaymentMethodRow = {
  id: string;
  type: "cash" | "card";
  name: string;
  cut_day: number | null;
  due_day: number | null;
};

const initialState: PaymentMethodFormState = { error: null };

function DueDatePreview({ cutDay, dueDay }: { cutDay: string; dueDay: string }) {
  const cut = Number.parseInt(cutDay, 10);
  const due = Number.parseInt(dueDay, 10);
  if (
    !Number.isInteger(cut) ||
    !Number.isInteger(due) ||
    cut < 1 ||
    cut > 31 ||
    due < 1 ||
    due > 31
  ) {
    return null;
  }
  return (
    <p className="text-sm text-muted-foreground">
      Hoy una compra se pagaría el{" "}
      <strong>{formatLongDate(cardDueDate(cut, due, new Date()))}</strong>.
    </p>
  );
}

function PaymentMethodForm({
  method,
  onSuccess,
}: {
  method?: PaymentMethodRow;
  onSuccess: () => void;
}) {
  const action = method
    ? updatePaymentMethod.bind(null, method.id)
    : createPaymentMethod;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [type, setType] = useState<"cash" | "card">(method?.type ?? "card");
  const [cutDay, setCutDay] = useState(method?.cut_day?.toString() ?? "");
  const [dueDay, setDueDay] = useState(method?.due_day?.toString() ?? "");

  const prevState = useRef(state);
  useEffect(() => {
    if (prevState.current !== state && state.error === null) onSuccess();
    prevState.current = state;
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="type" value={type} />

      <div className="grid gap-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={50}
          placeholder={type === "card" ? "TDC Revolut" : "Efectivo"}
          defaultValue={method?.name}
        />
      </div>

      {!method ? (
        <div className="grid gap-2">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as "cash" | "card")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="card">Tarjeta</SelectItem>
              <SelectItem value="cash">Efectivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {type === "card" ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cut_day">Día de corte</Label>
              <Input
                id="cut_day"
                name="cut_day"
                type="number"
                min={1}
                max={31}
                required
                inputMode="numeric"
                placeholder="15"
                value={cutDay}
                onChange={(event) => setCutDay(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="due_day">Día de pago</Label>
              <Input
                id="due_day"
                name="due_day"
                type="number"
                min={1}
                max={31}
                required
                inputMode="numeric"
                placeholder="5"
                value={dueDay}
                onChange={(event) => setDueDay(event.target.value)}
              />
            </div>
          </div>
          <DueDatePreview cutDay={cutDay} dueDay={dueDay} />
        </>
      ) : null}

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : method ? "Guardar cambios" : "Crear método"}
      </Button>
    </form>
  );
}

export function PaymentMethodManager({
  methods,
}: {
  methods: PaymentMethodRow[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethodRow | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Nuevo método
        </Button>
      </div>

      <ul className="flex flex-col gap-2">
        {methods.map((method) => (
          <li key={method.id}>
            <Card>
              <CardContent className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3">
                  <Badge variant={method.type === "card" ? "default" : "secondary"}>
                    {method.type === "card" ? "Tarjeta" : "Efectivo"}
                  </Badge>
                  <div>
                    <p className="font-medium">{method.name}</p>
                    {method.type === "card" ? (
                      <p className="text-sm text-muted-foreground">
                        Corte: día {method.cut_day} · Pago: día {method.due_day}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(method);
                      setDialogOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (
                        window.confirm(
                          `¿Archivar “${method.name}”? Se ocultará pero sus registros se conservan.`,
                        )
                      ) {
                        archivePaymentMethod(method.id);
                      }
                    }}
                  >
                    Archivar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar método de pago" : "Nuevo método de pago"}
            </DialogTitle>
            <DialogDescription>
              Solo guardamos el nombre — nunca números de tarjeta.
            </DialogDescription>
          </DialogHeader>
          <PaymentMethodForm
            key={editing?.id ?? "new"}
            method={editing ?? undefined}
            onSuccess={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

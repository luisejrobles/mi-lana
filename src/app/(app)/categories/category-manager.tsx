"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { centsToPesos, formatMoney } from "@/lib/money";
import {
  archiveCategory,
  createCategory,
  updateCategory,
  type CategoryFormState,
} from "./actions";
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

export type CategoryRow = {
  id: string;
  name: string;
  color: string;
  budget: { id: string; amount_cents: number; currency: string } | null;
};

const initialState: CategoryFormState = { error: null };

function CategoryForm({
  category,
  onSuccess,
}: {
  category?: CategoryRow;
  onSuccess: () => void;
}) {
  const action = category
    ? updateCategory.bind(null, category.id)
    : createCategory;
  const [state, formAction, pending] = useActionState(action, initialState);

  // Close the dialog after a successful submit (state identity changes per run).
  const prevState = useRef(state);
  useEffect(() => {
    if (prevState.current !== state && state.error === null) onSuccess();
    prevState.current = state;
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={50}
          placeholder="Renta"
          defaultValue={category?.name}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="color">Color</Label>
        <input
          id="color"
          name="color"
          type="color"
          defaultValue={category?.color ?? "#22c55e"}
          className="h-10 w-16 cursor-pointer rounded-md border bg-background p-1"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="budget">Presupuesto mensual (MXN, opcional)</Label>
        <Input
          id="budget"
          name="budget"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          placeholder="9000.00"
          defaultValue={
            category?.budget ? centsToPesos(category.budget.amount_cents) : ""
          }
        />
      </div>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : category ? "Guardar cambios" : "Crear categoría"}
      </Button>
    </form>
  );
}

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(category: CategoryRow) {
    setEditing(category);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button onClick={openCreate}>Nueva categoría</Button>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no tienes categorías. Crea la primera, por ejemplo “Renta” o
          “Auto”.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {categories.map((category) => (
            <li key={category.id}>
              <Card>
                <CardContent className="flex items-center justify-between gap-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="size-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {category.budget
                          ? `${formatMoney(category.budget.amount_cents, category.budget.currency)} / mes`
                          : "Sin presupuesto"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(category)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (
                          window.confirm(
                            `¿Archivar “${category.name}”? Se ocultará pero sus registros se conservan.`,
                          )
                        ) {
                          archiveCategory(category.id);
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
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar categoría" : "Nueva categoría"}
            </DialogTitle>
            <DialogDescription>
              El presupuesto se repite cada mes.
            </DialogDescription>
          </DialogHeader>
          {/* key remounts the form so defaults reset per target */}
          <CategoryForm
            key={editing?.id ?? "new"}
            category={editing ?? undefined}
            onSuccess={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

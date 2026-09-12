"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { FormCurrencyField } from "@/components/common/form-currency-field";
import { FormShell } from "@/components/common/form-shell";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { getErrorMessage } from "@/lib/api/errors";
import { useClearConversations } from "@/lib/query/assistant";
import { useUpdateMe } from "@/lib/query/users";
import {
  settingsSchema,
  type SettingsFormValues,
} from "@/lib/validation/settings";

export const SettingsForm = () => {
  const { user, signOut, isSigningOut } = useAuth();
  const router = useRouter();
  const updateMe = useUpdateMe();
  const clearConversations = useClearConversations();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user?.name ?? "",
      baseCurrency: user?.baseCurrency ?? "ARS",
      aiEnabled: user?.aiEnabled ?? false,
    },
  });

  useEffect(() => {
    if (!user) return;
    form.reset({
      name: user.name,
      baseCurrency: user.baseCurrency,
      aiEnabled: user.aiEnabled,
    });
  }, [user, form]);

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      await updateMe.mutateAsync(values);
      toast.success("Preferencias guardadas");
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudieron guardar los cambios"));
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/login");
    } catch {
      toast.error("No se pudo cerrar la sesión");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <FormShell form={form} onSubmit={onSubmit} className="gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Perfil</CardTitle>
            <CardDescription>
              Tu nombre y la moneda base para consolidar tus datos.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormCurrencyField
              name="baseCurrency"
              label="Moneda base"
              fallback={user?.baseCurrency ?? "ARS"}
            />
            <div className="text-muted-foreground text-sm">{user?.email}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Privacidad e IA</CardTitle>
            <CardDescription>
              El asistente usa solo datos mínimos y nunca modifica registros.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="aiEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-xl border p-3">
                  <div className="flex flex-col gap-0.5">
                    <FormLabel>Asistente de IA</FormLabel>
                    <FormDescription>
                      Habilitá las respuestas conversacionales.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={updateMe.isPending}>
          {updateMe.isPending ? <Loader2 className="animate-spin" /> : null}
          Guardar cambios
        </Button>
      </FormShell>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Asistente</CardTitle>
          <CardDescription>
            Eliminá el historial de conversaciones almacenado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConfirmDialog
            title="Borrar historial del asistente"
            description="Se eliminarán todas tus conversaciones. Esta acción no se puede deshacer."
            confirmLabel="Borrar historial"
            variant="destructive"
            isPending={clearConversations.isPending}
            onConfirm={() => {
              clearConversations.mutate(undefined, {
                onSuccess: () => toast.success("Historial eliminado"),
                onError: () => toast.error("No se pudo borrar el historial"),
              });
            }}
            trigger={
              <Button variant="outline" className="w-fit">
                <Trash2 /> Borrar historial
              </Button>
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Sesión</CardTitle>
          <CardDescription>Cerrá la sesión activa.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            className="w-fit"
            disabled={isSigningOut}
            onClick={handleSignOut}
          >
            <LogOut /> Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

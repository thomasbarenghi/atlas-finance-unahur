"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormShell } from "@/components/common/form-shell";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useSignOut } from "@/hooks/use-sign-out";
import { getErrorMessage } from "@/lib/api/errors";
import { useUpdateMe } from "@/lib/query/users";
import {
  settingsSchema,
  type SettingsFormValues,
} from "@/lib/validation/settings";

export const SettingsForm = () => {
  const { user } = useAuth();
  const { signOut, isSigningOut } = useSignOut();
  const updateMe = useUpdateMe();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user?.name ?? "",
    },
  });

  useEffect(() => {
    if (!user) return;
    form.reset({ name: user.name });
  }, [user, form]);

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      await updateMe.mutateAsync(values);
      toast.success("Preferencias guardadas");
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudieron guardar los cambios"));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <FormShell form={form} onSubmit={onSubmit} className="gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Perfil</CardTitle>
            <CardDescription>
              Tu nombre dentro de la aplicación.
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
            <div className="text-muted-foreground text-sm">{user?.email}</div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={updateMe.isPending}>
          {updateMe.isPending ? <Loader2 className="animate-spin" /> : null}
          Guardar cambios
        </Button>
      </FormShell>

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
            onClick={signOut}
          >
            <LogOut /> Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

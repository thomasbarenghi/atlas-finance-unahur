import {
  Archive,
  CircleCheck,
  CircleDashed,
  Clock,
  CircleAlert,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StatusBadgeProps } from "./status-badge.types";

interface StatusPresentation {
  label: string;
  className: string;
  icon: LucideIcon;
}

const getPresentation = (props: StatusBadgeProps): StatusPresentation => {
  if (props.variant === "budget") {
    if (props.status === "exceeded") {
      return {
        label: "Excedido",
        className: "bg-destructive/10 text-destructive",
        icon: CircleAlert,
      };
    }
    if (props.status === "warning") {
      return {
        label: "Advertencia",
        className: "bg-warning/10 text-warning",
        icon: TriangleAlert,
      };
    }
    return {
      label: "Disponible",
      className: "bg-success/10 text-success",
      icon: CircleCheck,
    };
  }

  if (props.variant === "goal") {
    if (props.status === "achieved") {
      return {
        label: "Alcanzado",
        className: "bg-success/10 text-success",
        icon: CircleCheck,
      };
    }
    if (props.status === "overdue") {
      return {
        label: "Vencido",
        className: "bg-destructive/10 text-destructive",
        icon: Clock,
      };
    }
    if (props.status === "in_progress") {
      return {
        label: "En curso",
        className: "bg-primary/10 text-primary",
        icon: Clock,
      };
    }
    return {
      label: "Pendiente",
      className: "bg-muted text-muted-foreground",
      icon: CircleDashed,
    };
  }

  if (props.variant === "account") {
    return props.archived
      ? {
          label: "Archivada",
          className: "bg-muted text-muted-foreground",
          icon: Archive,
        }
      : {
          label: "Activa",
          className: "bg-success/10 text-success",
          icon: CircleCheck,
        };
  }

  return props.isStale
    ? {
        label: "Desactualizada",
        className: "bg-warning/10 text-warning",
        icon: TriangleAlert,
      }
    : {
        label: "Actualizada",
        className: "bg-success/10 text-success",
        icon: CircleCheck,
      };
};

export const StatusBadge = (props: StatusBadgeProps) => {
  const { label, className, icon: Icon } = getPresentation(props);

  return (
    <Badge variant="outline" className={`border-transparent ${className}`}>
      <Icon aria-hidden />
      {label}
    </Badge>
  );
};

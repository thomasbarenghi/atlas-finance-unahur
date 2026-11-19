import {
  Briefcase,
  Bus,
  Receipt,
  ShoppingCart,
  Tag,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  wallet: Wallet,
  briefcase: Briefcase,
  cart: ShoppingCart,
  "shopping-cart": ShoppingCart,
  bus: Bus,
  receipt: Receipt,
};

export const categoryIcon = (icon: string | null): LucideIcon =>
  icon ? (ICONS[icon] ?? Tag) : Tag;

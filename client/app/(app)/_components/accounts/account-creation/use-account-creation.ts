"use client";

import { useState } from "react";
import type { AccountType } from "@/lib/api/types";

export interface AccountCreationState {
  pickerOpen: boolean;
  setPickerOpen: (open: boolean) => void;
  accountType: AccountType | null;
  setAccountType: (type: AccountType | null) => void;
  formKey: number;
  openPicker: () => void;
  openForm: (type: AccountType) => void;
}

export const useAccountCreation = (): AccountCreationState => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [formKey, setFormKey] = useState(0);

  const openPicker = () => setPickerOpen(true);

  const openForm = (type: AccountType) => {
    setPickerOpen(false);
    setFormKey((key) => key + 1);
    setAccountType(type);
  };

  return {
    pickerOpen,
    setPickerOpen,
    accountType,
    setAccountType,
    formKey,
    openPicker,
    openForm,
  };
};

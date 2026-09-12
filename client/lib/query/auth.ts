import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authEndpoints } from "@/lib/api/endpoints";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "@/lib/api/types";
import { queryKeys } from "./keys";

export const useMe = () =>
  useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: authEndpoints.me,
    retry: false,
    staleTime: 5 * 60_000,
  });

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => authEndpoints.login(input),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.me, data.user);
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) => authEndpoints.register(input),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.me, data.user);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authEndpoints.logout,
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.auth.me, null);
      queryClient.clear();
    },
  });
};

export const useForgotPassword = () =>
  useMutation({
    mutationFn: (input: ForgotPasswordInput) =>
      authEndpoints.forgotPassword(input),
  });

export const useResetPassword = () =>
  useMutation({
    mutationFn: (input: ResetPasswordInput) =>
      authEndpoints.resetPassword(input),
  });

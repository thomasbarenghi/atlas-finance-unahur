import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authEndpoints } from "@/lib/api/endpoints";
import { clearTokens, setTokens } from "@/lib/api/token-store";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  RegisterResponse,
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
      setTokens(data);
      queryClient.setQueryData(queryKeys.auth.me, data.user);
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  return useMutation<RegisterResponse, unknown, RegisterInput>({
    mutationFn: (input: RegisterInput) => authEndpoints.register(input),
    onSuccess: (data) => {
      if ("accessToken" in data) {
        setTokens(data);
        queryClient.setQueryData(queryKeys.auth.me, data.user);
      }
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authEndpoints.logout,
    onSuccess: () => {
      clearTokens();
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

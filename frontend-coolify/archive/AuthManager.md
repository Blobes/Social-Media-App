/\*\*

- Secondary verification strategy utilizing the structured object required by initiateTFA.
  \*/
  const { mutate: executeTotpVerification, isPending: isTotpLoading } = useMutation({
  mutationFn: async (val: string) => {
  await delay();
  const resolvedType = inputType ?? "UNKNOWN";
  const cleaned = resolvedType === "PHONE" ? sanitizePhoneNumber(val) : val;

      return await verifyTotpCode({
        actionType: "AUTHENTICATE",
        identifier: cleaned,
        token:otp
      });

  },
  onSuccess: (res) => {
  if (res.status === "SUCCESS" && res.payload) {
  const resolvedType = inputType ?? "UNKNOWN";
  const channel: OtpMessageChannel =
  resolvedType === "PHONE" ? "PHONE" : "EMAIL";

        handleOtpNavigation({
          user: null as any,
          identifier: input,
          inputType: channel,
          reason: "PASSWORD_RESET",
          purpose: "PASSWORD_RESET",
          otpMessageChannel: "AUTHENTICATOR",
          transitKey: CACHE_KEYS.PASS_RESET_INIT_TRANSIT_DATA,
        });
      } else {
        setInlineMsg(
          res.localizedSuccessMsg ||
            res.message ||
            translateTxtString(AUTH_FEEDBACK.password_reset_initiation_failed),
        );
      }

  },
  onError: (error: ApiError) => {
  setInlineMsg(
  error.localizedErrMsg ||
  translateTxtString(COMMON_FEEDBACK.server_error),
  );
  },
  onMutate: () => {
  clearInlineMsg();
  },
  });

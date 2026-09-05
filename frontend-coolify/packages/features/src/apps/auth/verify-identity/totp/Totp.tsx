"use client";

import React, { useMemo } from "react";
import { Stepper } from "@repo/shared-ui";
import { IStep, TransitPurpose } from "@repo/core";
import { ConfigureTotp } from "./ConfigureTotp";
import { VerifyTotpCode } from "./VerifyTotpCode";
import { TotpViewStep, useTotp } from "./useTotp";
import { BaseVerificationProps } from "../useVerifyIdentity";

export interface TotpViewProps<
  P extends TransitPurpose,
> extends BaseVerificationProps<P> {
  viewMode?: TotpViewStep;
}

/**
 * Orchestrates TOTP views (configuration setup or code verification) using a stepper.
 */
export const TotpView = <P extends TransitPurpose>(props: TotpViewProps<P>) => {
  const { currStep, setCurrStep } = useTotp(props);

  const steps = useMemo<IStep<TotpViewStep>[]>(
    () => [
      {
        name: "CONFIGURE_TOTP",
        method: "CONFIGURE_TOTP",
        element: <ConfigureTotp {...props} />,
      },
      {
        name: "VERIFY_TOTP_CODE",
        method: "VERIFY_TOTP_CODE",
        element: <VerifyTotpCode {...props} />,
      },
    ],
    [props],
  );

  return (
    <Stepper steps={steps} currStep={currStep} setCurrStep={setCurrStep} />
  );
};

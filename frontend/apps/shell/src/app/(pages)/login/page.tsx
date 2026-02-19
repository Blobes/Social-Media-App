"use client"

import { IAuthModule } from "@funstakes/types";
import { Typography } from "@mui/material";
import { FederatedComponent } from "../../Federated";


export default function LoginPage() {
    const props: IAuthModule = {
        view: "login"
    };
    return <FederatedComponent
        appName="auth"
        moduleName="AuthModule"
        props={props} />
}
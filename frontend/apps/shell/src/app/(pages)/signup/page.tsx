"use client"

import { IAuthModule } from "@funstakes/types";
import { FederatedComponent } from "../../Federated";


export default function SignupPage() {
    const props: IAuthModule = {
        view: "signup"
    };
    return <FederatedComponent
        appName="auth"
        moduleName="AuthModule"
        props={props} />
}
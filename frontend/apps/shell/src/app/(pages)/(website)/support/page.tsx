"use client"

import { IWebsiteModule } from "@funstakes/types";
import { FederatedComponent } from "../../../Federated";


export default function SupportPage() {
    const props: IWebsiteModule = {
        view: "support"
    };
    return <FederatedComponent
        appName="website"
        moduleName="WebsiteModule"
        props={props} />
}
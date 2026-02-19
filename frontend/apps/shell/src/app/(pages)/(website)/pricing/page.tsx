"use client"

import { FederatedComponent } from "../../../Federated";
import { IWebsiteModule } from "@funstakes/types";


export default function PricingPage() {
    const props: IWebsiteModule = {
        view: "pricing"
    };
    return <FederatedComponent
        appName="website"
        moduleName="WebsiteModule"
        props={props} />
}
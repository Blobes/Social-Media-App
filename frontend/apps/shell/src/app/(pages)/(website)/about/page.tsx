"use client"

import { FederatedComponent } from "../../../Federated";
import { IWebsiteModule } from "@funstakes/types";


export default function AboutPage() {
    const props: IWebsiteModule = {
        view: "about"
    };
    return <FederatedComponent
        appName="website"
        moduleName="WebsiteModule"
        props={props} />
}
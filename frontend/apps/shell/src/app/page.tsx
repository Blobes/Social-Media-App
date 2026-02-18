"use client"

import { FederatedComponent } from "./Federated";

export default function HomePage() {
    return <FederatedComponent
        appName="feed"
        moduleName="FeedModule" />
}
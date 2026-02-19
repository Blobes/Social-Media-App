"use client"

import { Typography } from "@mui/material";
import { FederatedComponent } from "../../Federated";


export default function OfflinePage() {
    return <FederatedComponent
        appName="offline"
        moduleName="OfflineModule" />
}
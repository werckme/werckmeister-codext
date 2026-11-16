import React from "react";
import { getVsCodeApi } from "../com/com";

/** a component which can send messages to the extension host */
export class BaseComponent<P = {}, S = {}> extends React.Component<P, S> {
    sendMessageToHost(command: string, message: Record<string, unknown> = {}): void {
        getVsCodeApi().postMessage({ ...message, command });
    }
}

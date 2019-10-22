import React from "react";
import { getVsCodeApi } from "../com/com";


export class BaseComponent extends React.Component {
    sendMessageToHost(command, message = {}) {
        message.command = command;
        getVsCodeApi().postMessage(message);
    }
}
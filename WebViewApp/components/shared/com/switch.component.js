import React from "react";
import { BaseComponent } from "../base/base.component";

export class SwitchComponent extends BaseComponent {
    constructor(props) {
        super(props);
    }

    onClick() {
        if(this.props.onChange) {
            this.props.onChange(!this.props.switchValue);
        }
    }

    render() {
        const { switchValue, title } = this.props;
        const classNames = `switch-component ${switchValue ? "isOn" : "isOff"}`;
        return (<span title={title} className={classNames} style={{cursor: "default", userSelect: "none"}} onClick={this.onClick.bind(this)}>
            {this.props.icon}
        </span>);
    }
}

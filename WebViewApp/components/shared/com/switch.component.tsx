import React from "react";

export interface SwitchProps {
    switchValue?: boolean;
    title?: string;
    id?: string;
    icon: React.ReactNode;
    onChange?: (value: boolean) => void;
}

export class SwitchComponent extends React.Component<SwitchProps> {
    onClick(): void {
        if (this.props.onChange) {
            this.props.onChange(!this.props.switchValue);
        }
    }

    render() {
        const { switchValue, title } = this.props;
        const classNames = `switch-component ${switchValue ? "isOn" : "isOff"}`;
        return (<span title={title} className={classNames} style={{ cursor: "default", userSelect: "none" }} onClick={this.onClick.bind(this)}>
            {this.props.icon}
        </span>);
    }
}

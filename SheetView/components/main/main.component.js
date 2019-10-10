import React from "react";

export class MainComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sheetTime: 0
        }
        window.addEventListener('message', event => { // get vscode message
            const message = event.data;
            this.setState({sheetTime: message.sheetTime});
        });
    }
    render() {
        return (
            <div>
                <h4>Sheet Time</h4>
                { this.state.sheetTime }
            </div>
        );
    }
}
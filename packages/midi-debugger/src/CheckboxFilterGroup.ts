export interface CheckboxItem {
    name: string;
    value: number;
    class_?: string;
}

/**
 * A group of checkboxes (one per track) to filter the events shown in the views.
 */
export class CheckboxFilterGroup {
    /** selection state by item value */
    selected: Record<number, boolean> = {};
    /** false until the checkboxes are created, all tracks are shown until then */
    initalized = false;
    onSelectionChanged: (value: number, checked: boolean) => void = () => { };

    createElement(checkboxItems: CheckboxItem[]): HTMLDivElement {
        this.initalized = true;
        const div = document.createElement("div");
        div.className = "chkbx-grp";
        for (const item of checkboxItems) {
            const value = item.value;
            const defaultSelected = true;
            this.selected[value] = defaultSelected;
            const grp = document.createElement("div");
            if (item.class_) {
                grp.classList.add(item.class_);
            }
            const label = document.createElement("label");
            label.innerText = item.name;
            const checkbox = document.createElement("input");
            checkbox.checked = defaultSelected;
            checkbox.onclick = () => {
                const checked = checkbox.checked;
                this.selected[value] = checked;
                setTimeout(() => this.onSelectionChanged(value, checked));
            };
            checkbox.type = "checkbox";
            checkbox.name = String(value);
            grp.appendChild(checkbox);
            grp.appendChild(label);
            div.appendChild(grp);
        }
        return div;
    }
}

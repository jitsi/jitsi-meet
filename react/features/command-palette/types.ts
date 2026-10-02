export interface ICommand {
    execute: () => void;
    id: string;
    label: string;
}

export abstract class ACommand {
    abstract execute(): Promise<void>;
}
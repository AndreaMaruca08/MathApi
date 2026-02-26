import chalk from "chalk";

export class Logger {
    static port: number;

    private static message = `
    ███╗   ██╗ ██████╗ ██████╗ ███████╗
    ████╗  ██║██╔═══██╗██╔══██╗██╔════╝
    ██╔██╗ ██║██║   ██║██║  ██║█████╗
    ██║╚██╗██║██║   ██║██║  ██║██╔══╝
    ██║ ╚████║╚██████╔╝██████╔╝███████╗
    ╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚══════╝
    + EXPRESS
    + TS
    `;

    static start(port: number): void {
        this.port = port;
        console.log(chalk.greenBright.bold(this.message));
        console.log(chalk.greenBright.bold(
            "==============================================="));
        Logger.info("Server started");
    }


    static info(message: unknown): void {
        this.base(chalk.green("INFO: ") + message);
    }

    static warn(message: unknown): void {
        this.base(chalk.yellow("WARN: ") + message);
    }

    static err(message: unknown): void {
        this.base(chalk.red("ERR: ") + message);
    }

    static base(message: unknown): void {
        console.log("| port:" + this.port + " | " + message);
    }
}
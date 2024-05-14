import { Injectable } from '@nestjs/common';

@Injectable()
export class TcommandParser {
    public parse(command: string): TcommandParser.TcommandArgs {
        if (command.length === 6) {
            return null;
        }

        const trimmedCommand = command.slice(7, command.length);
        if (!trimmedCommand.includes('-')) {
            return { opcode: parseInt(trimmedCommand), data: {} };
        }

        const args = trimmedCommand.split('-');
        const kvStrings = args[1].split(',');
        const data: { [key: string]: string } = {};
        for (const kvString in kvStrings) {
            const [key, value] = kvString.split('=');
            data[key] = value;
        }
        return { opcode: parseInt(args[0]), data: data };
    }
}

export namespace TcommandParser {
    export type TcommandArgs = {
        opcode: number;
        data: { [key: string]: string };
    } | null;
}

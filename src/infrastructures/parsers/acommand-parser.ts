import { Injectable } from '@nestjs/common';

@Injectable()
export class AcommandParser {
    public parse(command: string | null): Array<string> {
        if (command === null) {
            return [];
        }

        let result: Array<string> = [];
        let current: string | null = null;
        let isMultiLine = false;
        const multiLineBegin = '{';
        const multiLineEnd = '}';

        for (let char of command) {
            if (current === null) {
                if (/\s/.test(char)) {
                    continue;
                } else {
                    if (char === multiLineBegin) {
                        current = '';
                        isMultiLine = true;
                    } else {
                        current = char;
                    }
                }
            } else if (!/\s/.test(char)) {
                if (isMultiLine && char === multiLineEnd) {
                    result.push(current.trim());
                    current = null;
                    isMultiLine = false;
                } else {
                    current += char;
                }
            } else if (!isMultiLine) {
                result.push(current.trim());
                current = null;
                isMultiLine = false;
            } else {
                current += char;
            }
        }

        if (current !== null && !isMultiLine) {
            result.push(current.trim());
        }

        return result;
    }
}

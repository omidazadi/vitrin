import { readFile, stat } from 'fs/promises';
import { Inject, Injectable } from '@nestjs/common';
import { Bot as GrammyBot, InlineKeyboard, Keyboard } from 'grammy';
import {
    InlineKeyboardMarkup,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
} from 'grammy/types';
import nunjucks from 'nunjucks';
import { setTimeout } from 'timers/promises';
import { uxConstant } from '../constants/ux-constant';

@Injectable()
export class DryFrontend {
    private grammyBot: GrammyBot;
    private uiPath: string;
    private buttonTexts: any;

    public constructor(
        grammyBot: GrammyBot,
        @Inject('UI_PATH') uiPath: string,
    ) {
        this.grammyBot = grammyBot;
        this.uiPath = uiPath;
    }

    public async configure(): Promise<void> {
        nunjucks.configure({ trimBlocks: true, lstripBlocks: true });
        this.buttonTexts = JSON.parse(
            (
                await readFile(`${this.uiPath}/button-texts.json`, 'utf8')
            ).toString(),
        );
    }

    public async sendActionMessage(
        tid: string,
        action: string,
        options?: {
            context?: object;
            photo?: string;
            video?: string;
        },
    ): Promise<void> {
        const context = this.buildHydratedContext(options);
        const text = nunjucks.render(
            `${this.uiPath}/action-views/${action}.njk`,
            context,
        );
        const replyMarkup = await this.buildButtons(
            `${this.uiPath}/action-views/${action}`,
            context,
        );
        await this.sliceAndSend(tid, text, replyMarkup, {
            photo: options?.photo,
            video: options?.video,
        });
    }

    public async sendSystemMessage(
        tid: string,
        messageType: string,
        options?: {
            context?: object;
            photo?: string;
            video?: string;
        },
    ): Promise<void> {
        const context = this.buildHydratedContext(options);
        const text = nunjucks.render(
            `${this.uiPath}/system-views/${messageType}.njk`,
            context,
        );
        const replyMarkup = await this.buildButtons(
            `${this.uiPath}/system-views/${messageType}`,
            context,
        );
        await this.sliceAndSend(tid, text, replyMarkup, {
            photo: options?.photo,
            video: options?.video,
        });
    }

    private buildHydratedContext(options: any): any {
        let context: any = {};
        if (typeof options !== 'undefined') {
            if (typeof options.context !== 'undefined') {
                context = options.context;
            }
        }
        context.buttonTexts = this.buttonTexts;
        return context;
    }

    private async buildButtons(
        prefixPath: string,
        context: object,
        options?: { forcedType?: 'keyboard' | 'inline' | 'url' },
    ): Promise<
        | ReplyKeyboardMarkup
        | ReplyKeyboardRemove
        | InlineKeyboardMarkup
        | undefined
    > {
        if (options?.forcedType === 'keyboard') {
            return this.buildKeyboardButtons(prefixPath, context);
        } else if (options?.forcedType === 'inline') {
            return this.buildInlineButtons(prefixPath, context);
        } else if (options?.forcedType === 'url') {
            return this.buildUrlButtons(prefixPath, context);
        }

        let buttonType = 'none';
        try {
            await stat(`${prefixPath}-keyboard.njk`);
            buttonType = 'keyboard';
        } catch (e: unknown) {}

        try {
            await stat(`${prefixPath}-inline.njk`);
            buttonType = 'inline';
        } catch (e: unknown) {}

        try {
            await stat(`${prefixPath}-url.njk`);
            buttonType = 'url';
        } catch (e: unknown) {}

        if (buttonType === 'keyboard') {
            return this.buildKeyboardButtons(prefixPath, context);
        } else if (buttonType === 'inline') {
            return this.buildInlineButtons(prefixPath, context);
        } else if (buttonType === 'url') {
            return this.buildUrlButtons(prefixPath, context);
        }
        return undefined;
    }

    private buildKeyboardButtons(
        prefixPath: string,
        context: object,
    ): Keyboard | ReplyKeyboardRemove {
        let rawKeyboardButtons = JSON.parse(
            nunjucks.render(`${prefixPath}-keyboard.njk`, context),
        );

        if (rawKeyboardButtons.length === 0) {
            return { remove_keyboard: true };
        }

        let keyboardButtons = new Keyboard();
        for (let buttonRow of rawKeyboardButtons) {
            for (let button of buttonRow) {
                keyboardButtons = keyboardButtons.text(button);
            }
            keyboardButtons = keyboardButtons.row();
        }
        keyboardButtons = keyboardButtons.resized(true);
        return keyboardButtons;
    }

    private buildInlineButtons(
        prefixPath: string,
        context: object,
    ): InlineKeyboard {
        let rawInlineButtons = JSON.parse(
            nunjucks.render(`${prefixPath}-inline.njk`, context),
        );

        let inlineButtons = new InlineKeyboard();
        for (let buttonRow of rawInlineButtons) {
            for (let button of buttonRow) {
                inlineButtons = inlineButtons.text(button.text, button.data);
            }
            inlineButtons = inlineButtons.row();
        }
        return inlineButtons;
    }

    private buildUrlButtons(
        prefixPath: string,
        context: object,
    ): InlineKeyboard {
        let rawUrlButtons = JSON.parse(
            nunjucks.render(`${prefixPath}-url.njk`, context),
        );

        let urlButtons = new InlineKeyboard();
        for (let buttonRow of rawUrlButtons) {
            for (let button of buttonRow) {
                urlButtons = urlButtons.url(button.text, button.url);
            }
            urlButtons = urlButtons.row();
        }
        return urlButtons;
    }

    private async sliceAndSend(
        tid: string,
        text: string,
        replyMarkup:
            | ReplyKeyboardMarkup
            | ReplyKeyboardRemove
            | InlineKeyboardMarkup
            | undefined,
        media: { photo?: string; video?: string },
    ): Promise<void> {
        let sliceSize: number;
        if (
            typeof media.photo === 'string' ||
            typeof media.video === 'string'
        ) {
            sliceSize = uxConstant.MediaMessageSize;
        } else {
            sliceSize = uxConstant.plainMessageSize;
        }

        let isFirst = true;
        while (isFirst || text.length > 0) {
            let sliced = '';
            [sliced, text] = this.slice(text, sliceSize);

            if (!isFirst) {
                await setTimeout(uxConstant.consecutiveMessageDelay);
            }

            if (isFirst && typeof media.photo === 'string') {
                await this.grammyBot.api.sendPhoto(parseInt(tid), media.photo, {
                    caption: sliced === '' ? undefined : sliced,
                    reply_markup: text === '' ? replyMarkup : undefined,
                    parse_mode: 'HTML',
                });
            } else if (isFirst && typeof media.video === 'string') {
                await this.grammyBot.api.sendVideo(parseInt(tid), media.video, {
                    caption: sliced === '' ? undefined : sliced,
                    reply_markup: text === '' ? replyMarkup : undefined,
                    parse_mode: 'HTML',
                });
            } else {
                await this.grammyBot.api.sendMessage(parseInt(tid), sliced, {
                    reply_markup: text === '' ? replyMarkup : undefined,
                    parse_mode: 'HTML',
                });
            }

            isFirst = false;
        }
    }

    private slice(text: string, sliceSize: number): [string, string] {
        if (text === '') {
            return ['', ''];
        }

        let sliced = '';
        for (let char of text) {
            if (Buffer.byteLength(sliced + char, 'utf8') <= sliceSize) {
                sliced += char;
            } else {
                if (sliced === '') {
                    throw new Error('Internal error inside frontend.');
                } else {
                    return [sliced, text.slice(sliced.length, text.length)];
                }
            }
        }

        return [sliced, ''];
    }
}

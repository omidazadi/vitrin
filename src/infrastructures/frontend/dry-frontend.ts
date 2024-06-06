import { readFile, stat } from 'fs/promises';
import { Inject, Injectable } from '@nestjs/common';
import { Bot as GrammyBot, InlineKeyboard, Keyboard } from 'grammy';
import {
    InlineKeyboardMarkup,
    InputMediaPhoto,
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
        @Inject('BUTTON_TEXTS') buttonTexts: any,
    ) {
        this.grammyBot = grammyBot;
        this.uiPath = uiPath;
        this.buttonTexts = buttonTexts;
    }

    public async configure(): Promise<void> {
        nunjucks.configure({ trimBlocks: true, lstripBlocks: true });
    }

    public async sendActionMessage(
        tid: string,
        action: string,
        options?: {
            forcedType?: 'keyboard' | 'inline' | 'url';
            context?: object;
            album?: Array<string>;
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
            {
                forcedType: options?.forcedType,
            },
        );
        await this.sliceAndSend(tid, text, replyMarkup, {
            album: options?.album,
            photo: options?.photo,
            video: options?.video,
        });
    }

    public async sendSystemMessage(
        tid: string,
        messageType: string,
        options?: {
            forcedType?: 'keyboard' | 'inline' | 'url';
            context?: object;
            album?: Array<string>;
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
            {
                forcedType: options?.forcedType,
            },
        );
        await this.sliceAndSend(tid, text, replyMarkup, {
            album: options?.album,
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
    ): Keyboard | ReplyKeyboardRemove | undefined {
        let nunjucksRender = nunjucks
            .render(`${prefixPath}-keyboard.njk`, context)
            .trim();
        if (nunjucksRender.length === 0) {
            return undefined;
        }

        let rawKeyboardButtons = JSON.parse(nunjucksRender);
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
    ): InlineKeyboard | undefined {
        let rawInlineButtons = JSON.parse(
            nunjucks.render(`${prefixPath}-inline.njk`, context),
        );
        if (rawInlineButtons.length === 0) {
            return undefined;
        }

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
    ): InlineKeyboard | undefined {
        let rawUrlButtons = JSON.parse(
            nunjucks.render(`${prefixPath}-url.njk`, context),
        );
        if (rawUrlButtons.length === 0) {
            return undefined;
        }

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
        media: { album?: Array<string>; photo?: string; video?: string },
    ): Promise<void> {
        if (typeof media.album !== 'undefined' && media.album.length === 0) {
            media.album = undefined;
        }

        let sliceSize: number;
        if (
            typeof media.album !== 'undefined' ||
            typeof media.photo !== 'undefined' ||
            typeof media.video !== 'undefined'
        ) {
            sliceSize = uxConstant.mediaMessageSize;
        } else {
            sliceSize = uxConstant.plainMessageSize;
        }

        let isFirst = true;
        while (isFirst || text.length > 0) {
            let sliced = '';
            [sliced, text] = this.sliceText(text, sliceSize);

            if (!isFirst) {
                await setTimeout(uxConstant.consecutiveMessageDelay);
            }

            if (isFirst && typeof media.album !== 'undefined') {
                let isFirstAlbum = true;
                while (media.album.length > 0) {
                    let slicedAlbum: Array<string> = [];
                    [slicedAlbum, media.album] = this.sliceAlbum(
                        media.album,
                        uxConstant.albumSize,
                    );

                    let convertedAlbum;
                    if (media.album.length === 0) {
                        convertedAlbum = this.toInputMediaArray(
                            slicedAlbum,
                            sliced === '' ? undefined : sliced,
                        );
                    } else {
                        convertedAlbum = this.toInputMediaArray(slicedAlbum);
                    }

                    if (!isFirstAlbum) {
                        await setTimeout(uxConstant.consecutiveMessageDelay);
                    }

                    await this.grammyBot.api.sendMediaGroup(
                        parseInt(tid),
                        convertedAlbum,
                    );

                    isFirstAlbum = false;
                }
            } else if (isFirst && typeof media.photo !== 'undefined') {
                await this.grammyBot.api.sendPhoto(parseInt(tid), media.photo, {
                    caption: sliced === '' ? undefined : sliced,
                    reply_markup: text === '' ? replyMarkup : undefined,
                    parse_mode: 'HTML',
                });
            } else if (isFirst && typeof media.video !== 'undefined') {
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

    private sliceText(text: string, sliceSize: number): [string, string] {
        if (text === '') {
            return ['', ''];
        }

        const position = text.indexOf('<><>');
        if (position !== -1) {
            let sliced = text.slice(0, position);
            if (Buffer.byteLength(sliced, 'utf8') <= sliceSize) {
                return [sliced, text.slice(sliced.length + 4, text.length)];
            } else {
                let [secondSlice, dummy] = this.sliceText(sliced, sliceSize);
                return [
                    secondSlice,
                    text.slice(secondSlice.length, text.length),
                ];
            }
        }

        let sliced = '';
        for (const char of text) {
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

    private sliceAlbum(
        album: Array<string>,
        sliceSize: number,
    ): [Array<string>, Array<string>] {
        if (album.length === 0) {
            return [[], []];
        }

        let sliced: Array<string> = [];
        for (const fileTid of album) {
            if (sliced.length + 1 <= sliceSize) {
                sliced.push(fileTid);
            } else {
                if (sliced.length === 0) {
                    throw new Error('Internal error inside frontend.');
                } else {
                    return [sliced, album.slice(sliced.length, album.length)];
                }
            }
        }

        return [sliced, []];
    }

    private toInputMediaArray(
        album: Array<string>,
        caption?: string,
    ): Array<InputMediaPhoto> {
        let result = [];
        for (const fileTid of album) {
            if (result.length === 0) {
                result.push(this.toInputMedia(fileTid, caption));
            } else {
                result.push(this.toInputMedia(fileTid));
            }
        }

        return result;
    }

    private toInputMedia(fileTid: string, caption?: string): InputMediaPhoto {
        return {
            type: 'photo',
            media: fileTid,
            caption: caption,
            parse_mode: 'HTML',
        };
    }
}

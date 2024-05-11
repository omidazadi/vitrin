"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DryFrontend = void 0;
const promises_1 = require("fs/promises");
const common_1 = require("@nestjs/common");
const grammy_1 = require("grammy");
const nunjucks_1 = __importDefault(require("nunjucks"));
const ux_constant_1 = require("../constant/ux-constant");
const promises_2 = require("timers/promises");
let DryFrontend = class DryFrontend {
    constructor(grammyBot, uiPath, uxConstant) {
        this.grammyBot = grammyBot;
        this.uiPath = uiPath;
        this.uxConstant = uxConstant;
    }
    async configure() {
        nunjucks_1.default.configure({ trimBlocks: true, lstripBlocks: true });
        this.buttonTexts = JSON.parse((await (0, promises_1.readFile)(`${this.uiPath}/button-texts.json`, 'utf8')).toString());
    }
    async sendActionMessage(tid, action, options) {
        const context = this.buildHydratedContext(options);
        const text = nunjucks_1.default.render(`${this.uiPath}/action-views/${action}.njk`, context);
        const replyMarkup = await this.buildButtons(`${this.uiPath}/action-views/${action}`, context);
        await this.sliceAndSend(tid, text, replyMarkup, {
            photo: options?.photo,
            video: options?.video,
        });
    }
    async sendSystemMessage(tid, messageType, options) {
        const context = this.buildHydratedContext(options);
        const text = nunjucks_1.default.render(`${this.uiPath}/system-views/${messageType}.njk`, context);
        const replyMarkup = await this.buildButtons(`${this.uiPath}/system-views/${messageType}`, context);
        await this.sliceAndSend(tid, text, replyMarkup, {
            photo: options?.photo,
            video: options?.video,
        });
    }
    buildHydratedContext(options) {
        let context = {};
        if (typeof options !== 'undefined') {
            if (typeof options.context !== 'undefined') {
                context = options.context;
            }
        }
        context.buttonTexts = this.buttonTexts;
        return context;
    }
    async buildButtons(prefixPath, context, options) {
        if (options?.forcedType === 'keyboard') {
            return this.buildKeyboardButtons(prefixPath, context);
        }
        else if (options?.forcedType === 'inline') {
            return this.buildInlineButtons(prefixPath, context);
        }
        else if (options?.forcedType === 'url') {
            return this.buildUrlButtons(prefixPath, context);
        }
        let buttonType = 'none';
        try {
            await (0, promises_1.stat)(`${prefixPath}-keyboard.njk`);
            buttonType = 'keyboard';
        }
        catch (e) { }
        try {
            await (0, promises_1.stat)(`${prefixPath}-inline.njk`);
            buttonType = 'inline';
        }
        catch (e) { }
        try {
            await (0, promises_1.stat)(`${prefixPath}-url.njk`);
            buttonType = 'url';
        }
        catch (e) { }
        if (buttonType === 'keyboard') {
            return this.buildKeyboardButtons(prefixPath, context);
        }
        else if (buttonType === 'inline') {
            return this.buildInlineButtons(prefixPath, context);
        }
        else if (buttonType === 'url') {
            return this.buildUrlButtons(prefixPath, context);
        }
        return undefined;
    }
    buildKeyboardButtons(prefixPath, context) {
        let rawKeyboardButtons = JSON.parse(nunjucks_1.default.render(`${prefixPath}-keyboard.njk`, context));
        if (rawKeyboardButtons.length === 0) {
            return { remove_keyboard: true };
        }
        let keyboardButtons = new grammy_1.Keyboard();
        for (let buttonRow of rawKeyboardButtons) {
            for (let button of buttonRow) {
                keyboardButtons = keyboardButtons.text(button);
            }
            keyboardButtons = keyboardButtons.row();
        }
        keyboardButtons = keyboardButtons.resized(true);
        return keyboardButtons;
    }
    buildInlineButtons(prefixPath, context) {
        let rawInlineButtons = JSON.parse(nunjucks_1.default.render(`${prefixPath}-inline.njk`, context));
        let inlineButtons = new grammy_1.InlineKeyboard();
        for (let buttonRow of rawInlineButtons) {
            for (let button of buttonRow) {
                inlineButtons = inlineButtons.text(button.text, button.data);
            }
            inlineButtons = inlineButtons.row();
        }
        return inlineButtons;
    }
    buildUrlButtons(prefixPath, context) {
        let rawUrlButtons = JSON.parse(nunjucks_1.default.render(`${prefixPath}-url.njk`, context));
        let urlButtons = new grammy_1.InlineKeyboard();
        for (let buttonRow of rawUrlButtons) {
            for (let button of buttonRow) {
                urlButtons = urlButtons.url(button.text, button.url);
            }
            urlButtons = urlButtons.row();
        }
        return urlButtons;
    }
    async sliceAndSend(tid, text, replyMarkup, media) {
        let sliceSize;
        if (typeof media.photo === 'string' ||
            typeof media.video === 'string') {
            sliceSize = this.uxConstant.MediaMessageSize;
        }
        else {
            sliceSize = this.uxConstant.plainMessageSize;
        }
        let isFirst = true;
        while (isFirst || text.length > 0) {
            let sliced = '';
            [sliced, text] = this.slice(text, sliceSize);
            if (!isFirst) {
                await (0, promises_2.setTimeout)(this.uxConstant.consecutiveMessageDelay);
            }
            if (isFirst && typeof media.photo === 'string') {
                await this.grammyBot.api.sendPhoto(parseInt(tid), media.photo, {
                    caption: sliced === '' ? undefined : sliced,
                    reply_markup: text === '' ? replyMarkup : undefined,
                    parse_mode: 'HTML',
                });
            }
            else if (isFirst && typeof media.video === 'string') {
                await this.grammyBot.api.sendVideo(parseInt(tid), media.video, {
                    caption: sliced === '' ? undefined : sliced,
                    reply_markup: text === '' ? replyMarkup : undefined,
                    parse_mode: 'HTML',
                });
            }
            else {
                await this.grammyBot.api.sendMessage(parseInt(tid), sliced, {
                    reply_markup: text === '' ? replyMarkup : undefined,
                    parse_mode: 'HTML',
                });
            }
            isFirst = false;
        }
    }
    slice(text, sliceSize) {
        if (text === '') {
            return ['', ''];
        }
        let sliced = '';
        for (let char of text) {
            if (Buffer.byteLength(sliced + char, 'utf8') <= sliceSize) {
                sliced += char;
            }
            else {
                if (sliced === '') {
                    throw new Error('Internal error inside frontend.');
                }
                else {
                    return [sliced, text.slice(sliced.length, text.length)];
                }
            }
        }
        return [sliced, ''];
    }
};
exports.DryFrontend = DryFrontend;
exports.DryFrontend = DryFrontend = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)('UI_PATH')),
    __metadata("design:paramtypes", [grammy_1.Bot, String, ux_constant_1.UxConstant])
], DryFrontend);
//# sourceMappingURL=dry-frontend.js.map
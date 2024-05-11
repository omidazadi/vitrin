import { Bot as GrammyBot } from 'grammy';
import { UxConstant } from '../constant/ux-constant';
export declare class DryFrontend {
    private grammyBot;
    private uiPath;
    private uxConstant;
    private buttonTexts;
    constructor(grammyBot: GrammyBot, uiPath: string, uxConstant: UxConstant);
    configure(): Promise<void>;
    sendActionMessage(tid: string, action: string, options?: {
        context?: object;
        photo?: string;
        video?: string;
    }): Promise<void>;
    sendSystemMessage(tid: string, messageType: string, options?: {
        context?: object;
        photo?: string;
        video?: string;
    }): Promise<void>;
    private buildHydratedContext;
    private buildButtons;
    private buildKeyboardButtons;
    private buildInlineButtons;
    private buildUrlButtons;
    private sliceAndSend;
    private slice;
}

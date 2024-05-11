"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowedMedia = void 0;
const media_now_allowed_error_1 = require("./errors/media-now-allowed-error");
function allowedMedia(media) {
    return (target, key, descriptor) => {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const telegramContext = args[0].telegramContext;
            if ((telegramContext.photo !== null &&
                media.photo === 'prohibited') ||
                (telegramContext.photo === null &&
                    media.photo === 'required') ||
                (telegramContext.video !== null &&
                    media.video === 'prohibited') ||
                (telegramContext.video === null && media.video === 'required')) {
                throw new media_now_allowed_error_1.MediaNotAllowedError();
            }
            await originalMethod.apply(this, args);
        };
        return descriptor;
    };
}
exports.allowedMedia = allowedMedia;
//# sourceMappingURL=allowed-media.js.map
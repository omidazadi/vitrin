import { TelegramContext } from './context/telegram-context';
import { MediaNotAllowedError } from './errors/media-now-allowed-error';

export function allowedMedia(media: {
    photo: 'prohibited' | 'allowed' | 'required';
    video: 'prohibited' | 'allowed' | 'required';
}) {
    return (target: any, key: any, descriptor: any) => {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            const telegramContext = args[0].telegramContext as TelegramContext;
            if (
                (telegramContext.photo !== null &&
                    media.photo === 'prohibited') ||
                (telegramContext.photo === null &&
                    media.photo === 'required') ||
                (telegramContext.video !== null &&
                    media.video === 'prohibited') ||
                (telegramContext.video === null && media.video === 'required')
            ) {
                throw new MediaNotAllowedError();
            }

            await originalMethod.apply(this, args);
        };
        return descriptor;
    };
}

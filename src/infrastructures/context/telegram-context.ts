export class TelegramContext {
    public tid: string;
    public text: string | null;
    public photo: string | null;
    public video: string | null;

    public constructor(
        tid: string,
        text: string | null,
        photo: string | null,
        video: string | null,
    ) {
        this.tid = tid;
        this.text = text;
        this.photo = photo;
        this.video = video;
    }
}

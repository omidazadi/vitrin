export class TelegramContext {
    public me: string;
    public tid: string;
    public text: string | null;
    public photo: string | null;
    public video: string | null;

    public constructor(
        me: string,
        tid: string,
        text: string | null,
        photo: string | null,
        video: string | null,
    ) {
        this.me = me;
        this.tid = tid;
        this.text = text;
        this.photo = photo;
        this.video = video;
    }
}

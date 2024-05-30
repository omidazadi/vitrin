class UxConstant {
    public consecutiveMessageDelay: number;
    public plainMessageSize: number;
    public mediaMessageSize: number;
    public albumSize: number;

    public constructor() {
        this.consecutiveMessageDelay = 500;
        this.plainMessageSize = 3072;
        this.mediaMessageSize = 768;
        this.albumSize = 10;
    }
}

export const uxConstant = new UxConstant();

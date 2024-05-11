class UxConstant {
    public consecutiveMessageDelay: number;
    public plainMessageSize: number;
    public MediaMessageSize: number;

    public constructor() {
        this.consecutiveMessageDelay = 500;
        this.plainMessageSize = 3072;
        this.MediaMessageSize = 768;
    }
}

export const uxConstant = new UxConstant();

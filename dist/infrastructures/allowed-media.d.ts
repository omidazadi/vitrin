export declare function allowedMedia(media: {
    photo: 'prohibited' | 'allowed' | 'required';
    video: 'prohibited' | 'allowed' | 'required';
}): (target: any, key: any, descriptor: any) => any;

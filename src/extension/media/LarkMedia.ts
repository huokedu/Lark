﻿module lark {

    export interface IMediaSource {
        src: string;
        mimeType?: string;
    }

    export interface IMediaOption {
        src: string;
        mimeType?: string;
        sources?: IMediaSource[];
        poster?: string|Texture;
        width?: number;
        height?: number;
        volume?: number;
    }

    export class LarkMedia extends DisplayObject {
        public constructor(option?: IMediaOption) {
            super();

            if (!option)
                return;
            this.$option = option;
            this.sources = option.sources || [{ src: option.src }];
            this._volume = option.volume == undefined ? this._volume : option.volume;
        }
        public $option: IMediaOption;
        public sources: IMediaSource[];

        public get volume(): number {
            return this.getVolume();
        }

        public set volume(value: number) {
            this.setVolume(value);
        }
        
        protected _volume: number = 1;
        protected getVolume(): number {
            return this._volume;
        }

        protected setVolume(value: number) {
            this._volume = value;
        }

        public load() {

        }

        public play(loop: boolean = false) {

        }

        public pause() {

        }

    }
}
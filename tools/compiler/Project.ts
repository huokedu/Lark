﻿/// <reference path="../lib/types.d.ts" />

import file = require('../lib/FileUtil');
import utils = require('../lib/utils');


class Project implements lark.ILarkProject {

    constructor() {

    }

    larkVersion: string;
    version: string = '1.0.0';
    name: string = "app";
    entry: string = 'Main';
    template: string = 'empty';
    modules: lark.LarkModule[] = [];
    platforms: lark.LarkPlatform[] = [];
    port: number = Math.ceil(Math.random() * 50000 + 3000);
    host: string = 'localhost';
    ip: string = '0.0.0.0';
    startupHtml: string = 'index.html'; 
    scaleMode: string = 'noScale';
    contentWidth: number = 480;
    contentHeight: number = 800;
    showPaintRects: boolean = false;

    advancedMinify: boolean;

    parse(json: lark.ILarkProject) {
        this.version = json.version || this.version;
        this.name = json.name || this.name;
        this.larkVersion = json.larkVersion||this.larkVersion;
        this.entry = json.entry||this.entry;
        this.modules = json.modules || this.modules;
        this.platforms = json.platforms || this.platforms;
        this.startupHtml = json.startupHtml || this.startupHtml;
        this.port = json.port || this.port;
        this.host = json.host || this.host;
        this.ip = json.ip || this.ip;
        this.scaleMode = json.scaleMode || this.scaleMode;
        this.contentWidth = json.contentWidth || this.contentWidth;
        this.contentHeight = json.contentHeight || this.contentHeight;
        this.showPaintRects = json.showPaintRects || this.showPaintRects;
        this.template = json.template;
    }

    toJSON() {
        var json: lark.ILarkProject = {
            version: this.version,
            name: this.name,
            template: this.template,
            larkVersion: this.larkVersion,
            entry: this.entry,
            modules: this.modules,
            port: this.port,
            host: this.host,
            ip: this.ip,
            startupHtml: this.startupHtml,
            scaleMode: this.scaleMode,
            contentHeight: this.contentHeight,
            contentWidth: this.contentWidth,
            showPaintRects: this.showPaintRects,
            platforms: this.platforms
        };
        return json;
    }

    read(path = lark.options.larkPropertiesFile) {
        if (file.exists(path)) {
            var json = file.read(path);
            var data: lark.ILarkProject = null;
            try {
                data = JSON.parse(json);
            }
            catch (e) {
                console.error(utils.tr(10005));
                process.exit(10005);
            }
            this.parse(data);
        }
    }

    save(path = lark.options.larkPropertiesFile) {
        var propjson = this;
        console.log(path);
        file.save(path, JSON.stringify(propjson, null, '   '));
    }
}


export = Project;
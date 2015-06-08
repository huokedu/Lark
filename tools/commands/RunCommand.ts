
/// <reference path="../lib/types.d.ts" />

import utils = require('../lib/utils');
import watch = require("../lib/watch");
import server = require('../server/server');
import FileUtil = require('../lib/FileUtil');
import service = require('../service/index');

class RunCommand implements lark.Command {
	
    execute():number {
        
        if (lark.options.autoCompile) {
            console.log(utils.tr(10010));
            this.watchFiles(lark.options.srcDir);
            this.watchFiles(lark.options.templateDir);
        }
        else {
            console.log(utils.tr(10012));
        }
        server.startServer(lark.options, lark.options.startUrl);
        console.log(utils.tr(10013, lark.options.startUrl));
        service.execCommand({ command: "build", path: lark.options.projectDir }, (cmd: lark.ServiceCommandResult) => { });
        return 0;
    }
    private watchFiles(dir:string) {

        watch.createMonitor(dir, { persistent: true, interval: 2007 }, m=> {
            m.on("created", () => this.sendBuildCMD())
                .on("removed", () => this.sendBuildCMD())
                .on("changed", () => this.sendBuildCMD());
        })
    }
    private sendBuildCMD() {
        service.execCommand({ command: "build", path: lark.options.projectDir }, (cmd: lark.ServiceCommandResult) => {
            if (cmd.exitCode == 0)
                console.log(utils.tr(10011));
            else
                console.log(utils.tr(10014));
            if (cmd.messages) {
                cmd.messages.forEach(m=> console.log(m));
            }
        });
    }
}


export = RunCommand;
// @ts-check
const path = require("path");
const processPluginXML = require("./utils");


module.exports = async function cordovaPluginsLoader(emptySource) {
    // @ts-ignore
    const callback = this.async();
    /** @type {string[]} */
    // @ts-ignore
    const plugins = this.query.plugins || [];
    // @ts-ignore
    const platform = this.query.platform;
    if (!platform) {
        return callback(new Error("Platform was not specified"));
    }
    if (!plugins.length) {
        return callback(null, emptySource);
    }
    const pluginList = [];
    for (const plugin of plugins) {
        try {
            const pluginPath = require.resolve(path.join(plugin, "./plugin.xml"));
            const files = await processPluginXML(pluginPath, platform);
            if (!files.length) {
                continue;
                // return callback(null, emptySource);
            }
            pluginList.push(...files.map(f => {
                // since it's streated as source and we need require.resolve without quotes, build string manually instead of JSON.stringify()

                var obj = {
                    "id": "%1",
                    "file": "%2",
                    "pluginId": plugin,
                };
                if(f.clobbers.length) obj.clobbers = f.clobbers;
                if(f.merges.length) obj.merges = f.merges;
                if(f.merges.runs) obj.runs = true;

                var str = JSON.stringify(obj);
                str = str.replace('"%1"', `require.resolve('${plugin}.${f.name}')`);
                str = str.replace('"%2"', `require.resolve('${plugin}.${f.name}')`);

                return str;
            }));
        } catch (e) {
            return callback(e);
        }
    }
    const newSource = `module.exports = [${pluginList.join(",")}]; module.exports.metadata = {};`;
    return callback(null, newSource);
}
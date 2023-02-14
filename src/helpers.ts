export const isSubPath = (parent: string, dir: string): boolean => {
    if (parent === dir) return true;
    const path = require("path");
    const relative = path.relative(parent, dir);
    return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
};

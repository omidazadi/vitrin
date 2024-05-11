"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shop = void 0;
class Shop {
    constructor(name, fullName, botUsername, botToken, onMaintenance, maintenanceVersion, mainDescription, mainFileTid, aboutDescription, aboutFileTid, faqDescription, faqFileTid, owner) {
        this.name = name;
        this.fullName = fullName;
        this.botUsername = botUsername;
        this.botToken = botToken;
        this.onMaintenance = onMaintenance;
        this.maintenanceVersion = maintenanceVersion;
        this.mainDescription = mainDescription;
        this.mainFileTid = mainFileTid;
        this.aboutDescription = aboutDescription;
        this.aboutFileTid = aboutFileTid;
        this.faqDescription = faqDescription;
        this.faqFileTid = faqFileTid;
        this.owner = owner;
    }
}
exports.Shop = Shop;
//# sourceMappingURL=shop.js.map
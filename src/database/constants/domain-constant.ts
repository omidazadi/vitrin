class DomainConstant {
    public general: DomainConstant.GeneralConstant;
    public shop: DomainConstant.ShopConstant;

    public constructor() {
        this.general = new DomainConstant.GeneralConstant();
        this.shop = new DomainConstant.ShopConstant();
    }
}

namespace DomainConstant {
    export class GeneralConstant {
        public maxId: number;

        public constructor() {
            this.maxId = 1000_000_000_000;
        }
    }

    export class ShopConstant {
        public nameMinLength: number;
        public nameMaxLength: number;
        public fullNameMinLength: number;
        public fullNameMaxLength: number;
        public botUsernameMaxLength: number;

        public constructor() {
            this.nameMinLength = 4;
            this.nameMaxLength = 12;
            this.fullNameMinLength = 4;
            this.fullNameMaxLength = 100;
            this.botUsernameMaxLength = 100;
        }
    }
}

export const domainConstant = new DomainConstant();

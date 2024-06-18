import { Injectable } from '@nestjs/common';
import { shopConstant } from 'src/bots/shop/constants/shop-constant';

@Injectable()
export class ShopCartWorkflowUidGeneratorHelper {
    public constructor() {}

    public generateUid(): string {
        let result = '';
        for (let i = 0; i < shopConstant.uidLength; i += 1) {
            result += this.getRandomDigit();
        }
        return result;
    }

    private getRandomDigit(): string {
        return Math.floor(Math.random() * 10).toString();
    }
}

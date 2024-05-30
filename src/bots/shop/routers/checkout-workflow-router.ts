import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ShopCustomer } from '../user-builder';

@Injectable()
export class ShopCheckoutWorkflowRouter {
    public async route(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<boolean> {
        return false;
    }
}

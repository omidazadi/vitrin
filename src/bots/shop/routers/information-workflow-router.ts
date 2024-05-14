import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { Customer } from '../../../database/models/customer';

@Injectable()
export class ShopInformationWorkflowRouter {
    public async route(
        requestContext: RequestContext<Customer>,
    ): Promise<boolean> {
        return false;
    }
}

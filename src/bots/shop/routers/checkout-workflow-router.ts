import { RequestContext } from 'src/infrastructures/context/request-context';
import { Customer } from '../../../database/models/customer';

export class ShopCheckoutWorkflowRouter {
    public async route(
        requestContext: RequestContext<Customer>,
    ): Promise<boolean> {
        return false;
    }
}

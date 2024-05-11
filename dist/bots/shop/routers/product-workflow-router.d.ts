import { RequestContext } from 'src/infrastructures/context/request-context';
import { Customer } from '../../../database/models/customer';
export declare class ShopProductWorkflowRouter {
    route(requestContext: RequestContext<Customer>): Promise<boolean>;
}

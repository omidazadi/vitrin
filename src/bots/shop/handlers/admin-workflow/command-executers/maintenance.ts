import { Injectable } from '@nestjs/common';
import { instanceToInstance } from 'class-transformer';
import { ShopCustomer } from 'src/bots/shop/user-builder';
import { ShopRepository } from 'src/database/repositories/shop-repository';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ExpectedError } from 'src/infrastructures/errors/expected-error';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';

@Injectable()
export class ShopAdminWorkflowMaintenanceCommandExecuter {
    private frontend: HydratedFrontend;
    private shopRepository: ShopRepository;

    public constructor(
        frontend: HydratedFrontend,
        shopRepository: ShopRepository,
    ) {
        this.frontend = frontend;
        this.shopRepository = shopRepository;
    }

    public async handle(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ): Promise<void> {
        if (tokens.length === 0) {
            await this.error(requestContext);
        } else if (tokens[0] === 'activate') {
            await this.activateMaintenance(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'commit') {
            await this.commitMaintenance(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else {
            await this.error(requestContext);
        }
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async activateMaintenance(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 0) {
            await this.error(requestContext);
            return;
        }

        if (requestContext.user.shop.onMaintenance) {
            await this.error(requestContext);
            return;
        }

        let shop = instanceToInstance(requestContext.user.shop);
        shop.onMaintenance = true;
        await this.shopRepository.updateShop(shop, requestContext.poolClient);
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            { context: { scenario: 'done' } },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async commitMaintenance(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 0) {
            await this.error(requestContext);
            return;
        }

        if (!requestContext.user.shop.onMaintenance) {
            await this.error(requestContext);
            return;
        }

        let shop = instanceToInstance(requestContext.user.shop);
        shop.onMaintenance = false;
        shop.maintenanceVersion += 1;
        await this.shopRepository.updateShop(shop, requestContext.poolClient);
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            { context: { scenario: 'done' } },
        );
    }

    private async error(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<never> {
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            { context: { scenario: 'error' } },
        );
        throw new ExpectedError();
    }
}

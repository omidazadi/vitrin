import { Injectable } from '@nestjs/common';
import { instanceToInstance } from 'class-transformer';
import { Visitor } from 'src/database/models/visitor';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { VitrinConfig } from '../../configs/vitrin-config';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { VisitorRepository } from 'src/database/repositories/visitor-repository';
import { allowedMedia } from 'src/infrastructures/allowed-media';

@Injectable()
export class VitrinAdminWorkflowNavigateInHandler {
    private vitrinConfig: VitrinConfig;
    private frontend: HydratedFrontend;
    private visitorRepository: VisitorRepository;

    public constructor(
        vitrinConfig: VitrinConfig,
        frontend: HydratedFrontend,
        visitorRepository: VisitorRepository,
    ) {
        this.vitrinConfig = vitrinConfig;
        this.frontend = frontend;
        this.visitorRepository = visitorRepository;
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async handle(
        requestContext: RequestContext<Visitor>,
    ): Promise<void> {
        if (requestContext.user.tid !== this.vitrinConfig.owner) {
            await this.frontend.sendActionMessage(
                requestContext.user.tid,
                'common/unknown',
            );
            return;
        }

        const visitor = instanceToInstance(requestContext.user);
        visitor.data = { state: 'admin-cli' };
        await this.visitorRepository.updateVisitor(
            visitor,
            requestContext.poolClient,
        );
        await this.frontend.sendActionMessage(
            requestContext.user.tid,
            'admin-workflow/navigate-in',
        );
    }
}

import { Injectable } from '@nestjs/common';
import { Visitor } from 'src/database/models/visitor';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';

@Injectable()
export class VitrinUnsupportedMediaErrorHandler {
    private frontend: HydratedFrontend;

    public constructor(frontend: HydratedFrontend) {
        this.frontend = frontend;
    }

    public async handle(
        requestContext: RequestContext<Visitor>,
    ): Promise<void> {
        await this.frontend.sendActionMessage(
            requestContext.user.tid,
            'common/unsupported-media-error',
        );
    }
}

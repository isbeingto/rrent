import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    getHealth(): {
        status: string;
        timestamp: string;
    };
    getApi(): {
        message: string;
        version: string;
        endpoints: {
            path: string;
            method: string;
            description: string;
        }[];
    };
}
//# sourceMappingURL=app.controller.d.ts.map
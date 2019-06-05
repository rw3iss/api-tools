import RouteHelper from './RouteHelper';
import Config from './Config';

export default class RestAPI {
    private router;
    private routesRegistered = false;

    constructor(configPath?, schemaPath?) {
        
        if (configPath && schemaPath) {
            Config.setPaths(configPath, schemaPath);
        }

        if (!Config.apiEnabled) {
            return;
        }
        
        // setup the route lookup module
        this.router = require('find-my-way')({  
            ignoreTrailingSlash: true,
            defaultRoute: (req, res) => {
                res.end(JSON.stringify({
                    success: false,
                    message: 'Endpoint not found.'
                }));
            }
        });

        let registerRoutes = true;
        if (typeof Config.autoRegisterRoutes != 'undefined') {
            if (!Config.autoRegisterRoutes) {
                registerRoutes = false;
            }
        }
        
        if (registerRoutes) {
            this.registerRoutes();
        }
    }

    registerRoutes() {        
        if (!Config.apiEnabled) {
            throw "API is not enabled. Please set 'apiEnabled' to true in config.json";
        }

        if (!this.routesRegistered) {
            // registers routes from the schema configuration
            RouteHelper.registerAPIRoutes(this.router);
            this.routesRegistered = true;
        }
    }

    // Will try and handle the given request with default handlers generated from the schema.
    // Can be called directly, or passed into an application as middleware, ie. 'app.use(RestAPI.handle)' 
    handle(request, response, context?) {
        // Todo: need to extend this method to not end the request if no route is found?
        this.router.lookup(request, response, context);
        return true;
    }

}
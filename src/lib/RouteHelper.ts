import SchemaHelper from './SchemaHelper';
import ResourceHandler from './ResourceHandler';
import { getdef } from '../utils';

const METHODS = [ 'GET','PUT','POST','PATCH','DELETE' ];

export default class RouteHelper {
    
    // registers REST routes for each type defined in the schema
    static registerAPIRoutes(router) {
        let schema = SchemaHelper.getSchema();
        for (let p in schema) {
            let type = schema[p];

            // register all type endpoints by default, unless the api configuration is defined for it
            if (type.api) {
                if (typeof type.api.generate != 'undefined' && !type.api.generate) {
                    continue;
                }
            }

            let urlEndpoint = getdef(type.api.urlPrefix, p);
            // if this schema type has methods defined, register only those, otherwise register the defaults
            if (type.api.methods) {
                type.api.methods.forEach(m => {
                    let method = this._getSchemaMethod(m);
                    let handler = this._getSchemaHandler(m);
                    // collection handlers, only register GET, PUT, POST on collections
                    if (!['GET', 'PUT', 'POST'].includes(m)) {
                        router.on(method, '/'+urlEndpoint, handler);
                    }
                    // regsiter all method types for individual resources
                    router.on(method, '/'+urlEndpoint+'/:id', handler);
                });
            } else {
                // register all default methods for this type
                this._registerDefaultRoutesForType(router, urlEndpoint);
            }
        }

        // register schema endpoint
        // TODO: This should be wired up through custom handler, same as other config types
        router.on('GET', '/schema', (req, res) => {
            res.end(JSON.stringify(schema));
        });
    }

    private static _registerDefaultRoutesForType(router, urlEndpoint) {
        METHODS.forEach(m => {
            let handler = ResourceHandler[m.toLowerCase()];
            if (typeof handler == 'function') {
                // collection handlers, only register GET, PUT, POST on collections
                if (['GET','PUT', 'POST'].includes(m)) {
                    router.on(m, '/'+urlEndpoint, handler);
                }
                // individual resource handlers
                router.on(m, '/'+urlEndpoint+'/:id', handler);
            } else {
                throw "Could not obtain default route handler for: " + m;
            }
        });
    }

    private static _getSchemaMethod(methodDef) {
        let m = '';

        // determine method
        if (typeof methodDef == 'object') {
            if (!methodDef.type) {
                throw "Method definition requires a type property";
            } else {
                m = methodDef.type.toUpperCase();
            }
        } else {
            m = methodDef.toUpperCase();
        }
    
        if (!METHODS.includes(m)) {
            throw `${m} is not a valid method`;
        }

        return m;
    }

    private static _getDefaultHandler(method) {
        let h = ResourceHandler[method.toLowerCase()];
        if (typeof h != 'function') {
            throw "Error obtaining default handler for method: " + method;
        }
        return h;
    }

    // looks for handler if defined in the schema, otherwise returns the default handler
    private static _getSchemaHandler(methodDef) {
        let handler: undefined | ((...args)=>void) = undefined;
        let method = this._getSchemaMethod(methodDef);

        // determine handler
        if (typeof methodDef == 'object') {
            // assumes handler is defined
            if (!methodDef.handler) {
                handler = this._getDefaultHandler(method);
            } else {
                handler = methodDef.handler;
            }
        } else {
            // assume handler is default
            handler = this._getDefaultHandler(method);
            if (!handler) {
                throw "Could not obtain a handler for the given method: " + method;
            }
        }
        
        return handler;
    }
}
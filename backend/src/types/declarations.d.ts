/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'express' {
  export interface Request {
    body?: any;
    query?: any;
    params?: any;
    headers?: any;
    cookies?: any;
    file?: any;
    files?: any;
    path?: string;
    method?: string;
    originalUrl?: string;
  }
  export interface Response {
    status(code: number): this;
    json(body?: any): this;
    cookie(name: string, val: any, options?: any): this;
    clearCookie(name: string, options?: any): this;
    setHeader(name: string, val: any): this;
  }
  export interface NextFunction {
    (err?: any): void;
  }
  export interface Router {
    get(path: string, ...handlers: any[]): this;
    post(path: string, ...handlers: any[]): this;
    put(path: string, ...handlers: any[]): this;
    patch(path: string, ...handlers: any[]): this;
    delete(path: string, ...handlers: any[]): this;
    use(path: string | any, ...handlers: any[]): this;
  }
  export interface Express extends Router {
    listen(port: number, cb?: () => void): any;
  }
  export function Router(): Router;
  function express(): Express;
  namespace express {
    export function json(opts?: any): any;
    export function urlencoded(opts?: any): any;
    export function static(path: string): any;
    export function Router(): Router;
    export interface Request {
      body?: any;
      query?: any;
      params?: any;
      headers?: any;
      cookies?: any;
      file?: any;
      files?: any;
    }
    export interface Response {
      status(code: number): this;
      json(body?: any): this;
      cookie(name: string, val: any, options?: any): this;
      clearCookie(name: string, options?: any): this;
      setHeader(name: string, val: any): this;
    }
    export interface NextFunction {
      (err?: any): void;
    }
  }
  export default express;
}

declare module 'cors' {
  export interface CorsOptions {
    origin?: any;
    credentials?: boolean;
    methods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    maxAge?: number;
  }
  function cors(options?: CorsOptions): any;
  export default cors;
}

declare module 'helmet' {
  function helmet(options?: any): any;
  export default helmet;
}

declare module 'cookie-parser' {
  function cookieParser(secret?: string): any;
  export default cookieParser;
}

declare module 'express-rate-limit' {
  function rateLimit(options?: any): any;
  export default rateLimit;
}

declare module 'multer' {
  export interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
  }
  export interface StorageEngine {
    _handleFile(req: any, file: any, cb: any): void;
    _removeFile(req: any, file: any, cb: any): void;
  }
  export interface Multer {
    single(fieldname: string): any;
    array(fieldname: string, maxCount?: number): any;
    fields(fields: any[]): any;
    any(): any;
  }
  export interface Options {
    storage?: any;
    limits?: any;
    fileFilter?: (req: any, file: any, cb: any) => void;
  }
  function multer(options?: Options): Multer;
  namespace multer {
    export function diskStorage(options: any): StorageEngine;
    export function memoryStorage(): StorageEngine;
  }
  export default multer;
}

declare module 'node-cron' {
  export interface ScheduledTask {
    start(): this;
    stop(): this;
    destroy(): void;
  }
  export function schedule(cronExpression: string, func: () => void | Promise<void>, options?: any): ScheduledTask;
  export function validate(cronExpression: string): boolean;
}

declare module 'uuid' {
  export function v4(options?: any): string;
  export function v1(options?: any): string;
  export function v3(name: string, namespace: string): string;
  export function v5(name: string, namespace: string): string;
  export function validate(uuid: string): boolean;
}

declare module 'bcryptjs' {
  export function hash(s: string, salt: number | string): Promise<string>;
  export function compare(s: string, hash: string): Promise<boolean>;
  export function genSalt(rounds?: number): Promise<string>;
}

declare module 'mongoose' {
  export namespace Types {
    export class ObjectId {
      constructor(id?: string | number);
      toString(): string;
      equals(other: any): boolean;
      static isValid(id: any): boolean;
    }
  }
  export interface ObjectId {
    toString(): string;
    equals(other: any): boolean;
  }
  export interface Document {
    _id: any;
    __v?: any;
    save(): Promise<this>;
    toJSON(): any;
  }
  export interface SchemaOptions {
    timestamps?: boolean;
    toJSON?: {
      virtuals?: boolean;
      transform?: (doc: any, ret: any, options?: any) => any;
    } | any;
    toObject?: any;
  }
  export class Schema<T = any> {
    constructor(definition?: any, options?: SchemaOptions);
    index(fields: any, options?: any): this;
    static Types: {
      ObjectId: any;
      String: any;
      Number: any;
      Date: any;
      Boolean: any;
      Array: any;
      Mixed: any;
    };
  }
  export interface Model<T extends Document> {
    new (doc?: any): T;
    create(doc: any | any[]): Promise<any>;
    find(filter?: any, projection?: any, options?: any): any;
    findOne(filter?: any, projection?: any, options?: any): any;
    findById(id: any, projection?: any, options?: any): any;
    findByIdAndUpdate(id: any, update: any, options?: any): any;
    findOneAndUpdate(filter: any, update: any, options?: any): any;
    findOneAndDelete(filter: any, options?: any): any;
    findByIdAndDelete(id: any, options?: any): any;
    updateMany(filter: any, update: any, options?: any): any;
    deleteMany(filter: any, options?: any): any;
  }
  export function model<T extends Document>(name: string, schema?: Schema<T>): Model<T>;
  export function connect(uri: string, options?: any): Promise<any>;
  export function disconnect(): Promise<void>;
  export function set(key: string, value: any): void;
  export const connection: any;

  export namespace mongoose {
    export { Types, Document, Schema, Model, model, connect, disconnect, set, connection };
  }

  interface MongooseInstance {
    Types: typeof Types;
    Document: typeof Document;
    Schema: typeof Schema;
    model: <T extends Document>(name: string, schema?: Schema<T>) => Model<T>;
    connect: typeof connect;
    disconnect: typeof disconnect;
    set: typeof set;
    connection: any;
  }

  const mongoose: MongooseInstance;
  export default mongoose;
}

declare module 'socket.io' {
  export interface Socket {
    id: string;
    handshake: any;
    data: any;
    join(room: string | string[]): Promise<void> | void;
    leave(room: string): Promise<void> | void;
    to(room: string): any;
    emit(event: string, ...args: any[]): boolean;
    on(event: string, listener: (...args: any[]) => void): this;
    disconnect(close?: boolean): this;
  }
  export interface ServerOptions {
    cors?: any;
    pingTimeout?: number;
    pingInterval?: number;
  }
  export class Server {
    constructor(srv?: any, opts?: ServerOptions);
    use(fn: (socket: Socket, next: (err?: any) => void) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
    to(room: string): any;
    emit(event: string, ...args: any[]): boolean;
  }
}

declare module 'vitest' {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function expect(actual: any): any;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
  export function beforeAll(fn: () => void | Promise<void>): void;
  export function afterAll(fn: () => void | Promise<void>): void;
}

declare module 'supertest' {
  export interface Response {
    status: number;
    body: any;
    headers: any;
    text: string;
  }
  export interface Test {
    get(url: string): Test;
    post(url: string): Test;
    put(url: string): Test;
    patch(url: string): Test;
    delete(url: string): Test;
    send(data?: any): Test;
    set(field: string, val: string): Test;
    expect(status: number): Promise<Response>;
    then(onfulfilled?: (res: Response) => any): Promise<any>;
  }
  function request(app: any): Test;
  export default request;
}



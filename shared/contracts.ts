
export namespace SocketContracts {
    export interface SocketContract {
        responseChannel: string;
    }

    export interface GetBookings extends SocketContract {
        pair: string;
        count: number;
    }

    export interface DepthEntry {
        type: string; price: number; volume: number
    }

    export interface Depth {
        status: StatusCode;
        result?: DepthEntry[];
        error?: any;
    }

    export interface CancelOrder extends SocketContract {
        orderid: string;
    }

    export interface PlaceOrder extends SocketContract {
        pair: string;
        type: string;
        limit: number;
        volume: number;
    }

    export interface GetMyTradeBalance extends SocketContract {
        asset: string;
    }
}

export enum StatusCode {
    OK = 200,
    ERROR = 400,
    FAIL = 700
}
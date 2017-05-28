import { SocketContracts, StatusCode } from "../shared/contracts";
var KrakenClient = require('kraken-api');

var krakenConfigJson = require('./../../kraken.key.json');
var kraken = new KrakenClient(krakenConfigJson.key, krakenConfigJson.secret);
 
 function fill(type: string, orders: any, res: SocketContracts.DepthEntry[]) {
    for (var i = 0; i < orders.length; ++i) {
        var obj = {
            type: type,
            price: orders[i][0],
            volume: orders[i][1],
         //   time: orders[i][2]
        }
        res.push(obj);
    }
}

var lock = false;

function GetLock(callback: any) {
    var Query = () => {
        if (!lock) { lock = true; callback(); return; }
        setTimeout(() => {
            Query();
        }, 1000);
    }
    Query();
}

function Unlock() {
    lock = false;
}

export namespace KrakenHandler {
    export function Depth(params: { pair: string; count: number; }, callback: (res: SocketContracts.Depth) => void): void {
        GetLock(() => {
            kraken.api('Depth', { pair: params.pair, count: params.count }, function(error: any, data: any) {
                Unlock();

                if (error) {
                    console.log(error);
                    callback({ status: StatusCode.FAIL, error: error});
                    return;
                }
                var res:  SocketContracts.DepthEntry[]  = [];
                fill('sell', data.result[params.pair].asks, res);
                fill('buy', data.result[params.pair].bids, res);
                res.sort(function(e1, e2) { return e1.price < e2.price ? -1 : 1; });

                callback({status: StatusCode.OK, result: res})
            });
        });
    };

    export function MyStatus(callback: any) {
        GetLock(() => {
            kraken.api('Balance', null, function(error: any, data: any) {
                Unlock();

                if(error) {
                    console.log(error);
                    callback({status: StatusCode.FAIL, error: error});
                }
                else {
                    callback({status: StatusCode.OK, result: data.result});
                }
            });
        });
    }

    export function MyOrders(callback: any) {
        GetLock(() => {
            kraken.api('OpenOrders', null, function(error: any, data: any) {
                Unlock();

                if (error) {
                    console.log(error);
                    callback({status: StatusCode.FAIL, error: error});
                }
                else {
                    callback({status: StatusCode.OK, result: data.result});
                }
            });
        });
    }

    export function CancelOrder(orderid: string, callback: any) {
        GetLock(() => {
            kraken.api('CancelOrder', {txid: orderid}, function(error: any, data: any) {
                Unlock();

                if (error) {
                    console.log(error);
                    callback({status: StatusCode.FAIL, error: error});
                }
                else {
                    callback({status: StatusCode.OK, result: data});
                }
            });
        });
    }

    export function PlaceOrder(params: SocketContracts.PlaceOrder, callback: any) {
        GetLock(() => {
            console.log("[" + params.type + "]Order: " + params.type + " " + params.volume + "  @ " +  params.limit);
            kraken.api('AddOrder', {
                pair: params.pair,
                type: params.type,
                ordertype: 'limit',
                price: params.limit,
                volume: params.volume
            }, function(error: any, data: any) {
                Unlock();

                if (error) {
                    console.log(error);
                    callback({status: StatusCode.FAIL, error: error});
                }
                else {
                    callback({status: StatusCode.OK, result: data});
                }
            });
        });
    }
}
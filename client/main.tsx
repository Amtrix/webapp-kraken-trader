import * as $ from "jquery";
import io = require("socket.io-client");
import * as React from "react";
import * as ReactDOM from "react-dom";
import { SocketContracts, StatusCode } from "../shared/contracts";

var socket: SocketIOClient.Socket;
var cheapestSell = 55555;
setInterval(() => {
    $("#fees").html("For price " + cheapestSell + " fees are: " + (cheapestSell * 0.01*0.22));
}, 1000);


var UpdateBookings: any = null;
var GetMyOrders: any = null;
var myOrders: any = {};
var currBook: any = {};

const UpdateBookings_timeout = 5000;
const GetMyOrders_timeout = 10000;
const GetMyStatus_timeout = 10000;

function GetActiveCurrencyPair() {
    return "XETHZEUR"
}

function CancelOrder(orderid: string, callback: any, refresh = true) {
    socket.emit('cancel-order', { orderid: orderid, responseChannel: 'cancel-order-res'} as SocketContracts.CancelOrder);
    socket.once('cancel-order-res', (res: any) => {
        callback(res);
        if (refresh) { GetMyOrders(); UpdateBookings(); }
    });
}

function MoveOrderInPrice(currBook: SocketContracts.DepthEntry[], myOrderId: string, nxtprice: number) {
    var tradevol = myOrders[myOrderId].vol;

    var ordervol:any = 0;
    if (ordervol = prompt("Enter volume to move the " + myOrders[myOrderId].descr.type + " @ price "
            + myOrders[myOrderId].descr.price + " to " + nxtprice
            + " (max: " + tradevol + ")?", "" + tradevol)) {
        ordervol = parseFloat(ordervol);
        if (!ordervol){ alert("Invalid volume"); return; }

        CancelOrder(myOrderId, (res: {status: StatusCode} ) => {
            if (res.status == StatusCode.OK) {
                PlaceLimitOrder(
                    myOrders[myOrderId].descr.type,
                    ordervol,
                    nxtprice,
                (res: any) => {
                    if (res.status != StatusCode.OK) { alert("ERROR: " + res.error); return; }
                    alert("OK");
                });
            } else {
                alert("Failure at canceling");
            }
        }, false);
    }
}

function MoveOrderUpInPrice(currBook: SocketContracts.DepthEntry[], myOrderId: string) {
    var tradevol = myOrders[myOrderId].vol;

    var nxthigher = 1e9;
    for (var i = 0; i < currBook.length; ++i) {
        if (myOrders[myOrderId].descr.price < currBook[i].price)
            nxthigher = Math.min(nxthigher, currBook[i].price);
        if (myOrders[myOrderId].descr.price == currBook[i].price
            && myOrders[myOrderId].vol < currBook[i].volume)
            nxthigher = myOrders[myOrderId].descr.price;
    }
    if (nxthigher > 10000)
        nxthigher = myOrders[myOrderId].descr.price;
    nxthigher += 0.01;

    MoveOrderInPrice(currBook, myOrderId, nxthigher);
}
function MoveOrderDownInPrice(currBook: SocketContracts.DepthEntry[], myOrderId: string) {
    var tradevol = myOrders[myOrderId].vol;

    var nxtlower = -1e9;
    for (var i = 0; i < currBook.length; ++i) {
        if (myOrders[myOrderId].descr.price > currBook[i].price)
            nxtlower = Math.max(nxtlower, currBook[i].price);
        if (myOrders[myOrderId].descr.price == currBook[i].price
            && myOrders[myOrderId].vol < currBook[i].volume)
            nxtlower = myOrders[myOrderId].descr.price;
    }
    if (nxtlower < -10000)
        nxtlower = myOrders[myOrderId].descr.price;
    nxtlower -= 0.01;

    MoveOrderInPrice(currBook, myOrderId, nxtlower);
}

function PlaceLimitOrder(type: string, volume: number, limit: number, callback: any) {
    if (!volume || !limit) { alert("Invalid price/volume input"); callback(); return; }
    if (type != 'buy' && type != 'sell') { alert("Invalid type"); callback(); return; }

    socket.emit('place-order', { pair: GetActiveCurrencyPair(), type: type, volume: volume, limit: limit,
        responseChannel: 'place-order-res'} as SocketContracts.PlaceOrder);
    socket.once('place-order-res', (res: any) => {
        if (res.status == StatusCode.OK) {
            $("<div>").text(type + " " + volume + " @ "+ limit).appendTo($("#temp-history"));
        }
        callback(res);
        UpdateBookings();
    });
}

function init() {
    UpdateBookings = (refresh = false) => {
        socket.emit('get-bookings', { pair: GetActiveCurrencyPair(),
            count: 18 , responseChannel: 'get-bookings-res'} as SocketContracts.GetBookings);
        socket.once('get-bookings-res', (res: SocketContracts.Depth) => {
            if (res.status == StatusCode.OK) {
                $("#bookings").html("");
                var insertEntry = (entry: SocketContracts.DepthEntry) => {
                    var selMyOrderId: string = null;
                    for (var id in myOrders) {
                        if (Math.abs(myOrders[id].descr.price - entry.price) < 1e-9) {
                            selMyOrderId = id;
                        }
                    }

                    var elem = $("<div>").css("padding-left", "3px").css("padding-right", "3px");
                    var p1 = $("<div>").css("display", "inline-block").appendTo(elem);
                    var p2 = $("<div>").css("display", "inline-block").appendTo(elem);
                    var p3 = $("<div>").css("display", "inline-block").appendTo(elem);
                    $("<br>").appendTo(elem);

                    p1.css("width", "40%");
                    p2.css("width", "30%");
                    p3.css("width", "30%");
                    p1.text(entry.price);
                    p2.css("text-align", "center");
                    if (myOrders[selMyOrderId] && myOrders[selMyOrderId].vol > 0) {
                        var up = $("<span>").html("&#x25B2; ").appendTo(p2);
                        $("<span>").text(parseFloat(myOrders[selMyOrderId].vol).toFixed(2) + "").appendTo(p2);
                        var down = $("<span>").html(" &#x25BC;").appendTo(p2);
                        var cancel = $("<span>").css("color", "blue").text(" X").appendTo(p2);

                        up.css("cursor", "pointer");
                        down.css("cursor", "pointer");
                        cancel.css("cursor", "pointer");
                        down.click(() => { MoveOrderUpInPrice(res.result, selMyOrderId); });

                        cancel.click(() => {
                            CancelOrder(selMyOrderId, (res: any) => {
                                alert(res.status == StatusCode.OK ? "OK" : "FAIL");
                            });
                        });

                        up.click(() => { MoveOrderDownInPrice(res.result, selMyOrderId); });
                    }
                    p3.css("text-align", "right");
                    p3.text(entry.volume);

                    if (entry.type == 'sell')
                        cheapestSell = Math.min(cheapestSell, entry.price);
                    
                    if (entry.type == 'buy') elem.css("background-color", "green");
                    else elem.css("background-color", "red");
                    elem.css("color", "white");
                    $("#bookings").append(elem);
                };

                for (var i = 0; i < res.result.length; ++i) {
                    insertEntry(res.result[i]);
                }
            }

            console.log("REFRESH: " + refresh);
            if (refresh) {
                setTimeout(() => {
                    UpdateBookings(refresh);
                }, UpdateBookings_timeout);
            }
        });
    
    }

    function GetMyStatus(refresh = false) {
        socket.emit('get-my-status', { responseChannel: 'get-my-status-res'} as SocketContracts.GetBookings);
        socket.once('get-my-status-res', (res: any) => {
            if (res.status == StatusCode.OK) {
               $("#my-status").html(JSON.stringify(res.result, undefined, 2));
            }

            if (refresh) {
                setTimeout(() => {
                    GetMyStatus(refresh);
                }, GetMyStatus_timeout);
            }
        });
    }

    

    GetMyOrders = (refresh = false) => {
        socket.emit('get-my-orders', { responseChannel: 'get-my-orders-res'} as SocketContracts.GetBookings);
        socket.once('get-my-orders-res', (res: any) => {
            if (res.status == StatusCode.OK) {
                myOrders = res.result['open'];

                var isEmpty = true;
                $("#my-orders").html("");
                for (var id in res.result['open']) {
                    var add = (key: string, entry: any) => {
                        isEmpty = false;
                        $("<div>").html(id + ": " + entry.descr.order).appendTo($("#my-orders"));
                        var del = $("<span>").css("display","inline-block").css("color", "red").css("cursor","pointer").text("  CANCEL ORDER").appendTo($("#my-orders"));
                        $("<hr>").appendTo($("#my-orders"));

                        del.click(() => {
                            CancelOrder(key , () => {

                            }, true);
                        });
                    };
                    add(id, res.result['open'][id]);
                }

                if (isEmpty) $("#my-orders").html("no open orders");
            }

            if (refresh) {
                setTimeout(() => {
                    GetMyOrders(refresh);
                }, GetMyOrders_timeout);
            }
        });
    }

    GetMyStatus(true);
    GetMyOrders(true);
    UpdateBookings(true);

    $("#order-btn").click(() => {
        var type = $("#order-type").val();
        var volume = $("#order-volume").val();
        var limit = $("#order-limit").val();

        PlaceLimitOrder(type, parseFloat(volume), parseFloat(limit), (res: any) => {
            if (res.status != StatusCode.OK) alert("Error: " + res.error);
        });
    });

    setInterval(() => {
        var type = $("#order-type").val();
        var volume = $("#order-volume").val();
        var limit = $("#order-limit").val();
        $("#order-sum").val(volume * limit);
    }, 300);
}

$(document).ready(() => {
    console.log("Ready");
    socket = io.connect();
    socket.on('connect', () => {
        console.log("connected.");
        init();
    });
});
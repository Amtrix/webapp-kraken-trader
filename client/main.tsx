import * as $ from "jquery";
import io = require("socket.io-client");
import * as React from "react";
import * as ReactDOM from "react-dom";
import { SocketContracts, StatusCode } from "../shared/contracts";

var socket: SocketIOClient.Socket;
var cheapestSell = 1e9;
var bookSize = 13;
var currencypair = "XETHZEUR";
var myasset = "ZEUR";

const tradeviewurl = "https://dwq4do82y8xi7.cloudfront.net/widgetembed/?symbol=KRAKEN%3A%CODE&interval=D&symboledit=1&toolbarbg=f1f3f6&hideideas=1&studies=&theme=Black&style=1&timezone=exchange";

setInterval(() => {
    var fee = (cheapestSell * 0.01*0.22);
    if (cheapestSell < 1e9)
        $("#fees").html("For price " + cheapestSell + " fees are: " + fee + "(x2 = " + (2*fee) + ")");
    
    var cnt = $("#booking-size").val();
    var cnti = parseInt(cnt);

    if (cnti) bookSize = cnti;

    var pcode = $("#pair-code").val();
    if (pcode.length > 2) {
        if (pcode != currencypair) { $("#bookings").html(""); bookings = null; }
        currencypair = pcode;
    }

    var acode = $("#asset-code").val();
    if (acode.length > 1) {
        if (myasset != acode) myTradeBalance = null;
        myasset = acode;
    }

    var tradeviewpair = currencypair.substr(1, 3) + currencypair.substr(5, 3);
    var tradeview = tradeviewurl.replace("%CODE", tradeviewpair);
    var currtradeview = $("#pair-stat").attr("src");
    if (currtradeview != tradeview) {
        $("#pair-stat").attr("src", tradeview);
    }
}, 100);


var UpdateBookings: any = null;
var GetMyOrders: any = null;
var myOrders: any = {};
var currBook: any = {};

const UpdateBookings_timeout = 5000;
const GetMyOrders_timeout = 10000;
const GetMyStatus_timeout = 10000;
const GetMyTradeBalance_timeout = 10000;



function GetActiveCurrencyPair() {
    return currencypair;
}
function GetCoinCurrency() {
    return currencypair.substr(0, 4);;
}

function CancelOrder(orderid: string, callback: any, refresh = true) {
    socket.emit('cancel-order', { orderid: orderid, responseChannel: 'cancel-order-res'} as SocketContracts.CancelOrder);
    socket.once('cancel-order-res', (res: any) => {
        callback(res);
        if (refresh) { GetMyOrders(); UpdateBookings(); }
    });
}

function MoveOrderInPrice(currBook: SocketContracts.DepthEntry[], myOrderId: string, nxtprice: number) {
    var tradevol = myOrders[myOrderId].vol - myOrders[myOrderId].vol_exec;

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
            $("<div>").text(type + " " + volume + " @ "+ limit).prependTo($("#temp-history"));
        }
        callback(res);
        UpdateBookings();
    });
}

var bookings: any = null;
var myTradeBalance: any = null;
function init() {
    UpdateBookings = (refresh = false) => {
        socket.emit('get-bookings', { pair: GetActiveCurrencyPair(),
            count: bookSize , responseChannel: 'get-bookings-res'} as SocketContracts.GetBookings);
        
        socket.once('get-bookings-res', (res: SocketContracts.Depth) => {
            if (res.status == StatusCode.OK) {
                bookings = res.result;
            }

            console.log("REFRESH: " + refresh);
            if (refresh) {
                setTimeout(() => {
                    UpdateBookings(refresh);
                }, UpdateBookings_timeout);
            }
        });
    }
    setInterval(() => {
        if (!bookings) return;

        $("#bookings").html("");
        var newCheapestSell = 1e9;
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
                $("<span>").text((parseFloat(myOrders[selMyOrderId].vol) - parseFloat(myOrders[selMyOrderId].vol_exec)).toFixed(2) + "").appendTo(p2);
                var down = $("<span>").html(" &#x25BC;").appendTo(p2);
                var cancel = $("<span>").css("color", "blue").text(" X").appendTo(p2);

                up.css("cursor", "pointer");
                down.css("cursor", "pointer");
                cancel.css("cursor", "pointer");
                down.click(() => { MoveOrderUpInPrice(bookings, selMyOrderId); });

                cancel.click(() => {
                    CancelOrder(selMyOrderId, (res: any) => {
                        alert(res.status == StatusCode.OK ? "OK" : "FAIL");
                    });
                });

                up.click(() => { MoveOrderDownInPrice(bookings, selMyOrderId); });
            }
            p3.css("text-align", "right");
            p3.text(entry.volume);

            if (entry.type == 'sell')
                newCheapestSell = Math.min(newCheapestSell, entry.price);
            
            if (entry.type == 'buy') elem.css("background-color", "green");
            else elem.css("background-color", "red");
            elem.css("color", "white");
            $("#bookings").append(elem);
        };

        for (var i = 0; i < bookings.length; ++i) {
            insertEntry(bookings[i]);
        }
        cheapestSell = newCheapestSell;
    }, 500);


    var myStatus: any = null;
    function GetMyStatus(refresh = false) {
        socket.emit('get-my-status', { responseChannel: 'get-my-status-res'} as SocketContracts.GetBookings);
        socket.once('get-my-status-res', (res: any) => {
            if (res.status == StatusCode.OK) {
               myStatus = res.result;
               
            }

            if (refresh) {
                setTimeout(() => {
                    GetMyStatus(refresh);
                }, GetMyStatus_timeout);
            }
        });
    }
    setInterval(() => {
        if (!myStatus) return;

        $("#my-status").html(JSON.stringify(myStatus, undefined, 2).replace(/\"/g, ""));
        $("<br>").appendTo("#my-status");

        if (myTradeBalance) {
            $("<span>").text("Asset value (" + myasset + ") = "
                + (parseFloat(myTradeBalance.e))
                ).appendTo("#my-status");
        }
    }, 500);

    

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
                        $("<div>").css("display", "inline-block").html(id + ": " + entry.descr.order).appendTo($("#my-orders"));
                        var del = $("<span>").css("display","inline-block").css("color", "red").css("cursor","pointer").text("  CANCEL ORDER").appendTo($("#my-orders"));
                        $("<br>").appendTo($("#my-orders"));

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

    function GetMyTradeBalance(refresh = false) {
        socket.emit('get-my-trade-balance', { asset: myasset, responseChannel: 'get-my-trade-balance-res'} as SocketContracts.GetMyTradeBalance);
        socket.once('get-my-trade-balance-res', (res: any) => {
            if (res.status == StatusCode.OK) {
               myTradeBalance = res.result;
            }

            if (refresh) {
                setTimeout(() => {
                    GetMyTradeBalance(refresh);
                }, GetMyTradeBalance_timeout);
            }
        });
    }

    GetMyTradeBalance(true);
    GetMyStatus(true);
    GetMyOrders(true);
    UpdateBookings(true);

    $("#order-btn").click(() => {
        var type = $("#order-type").val();
        var volume = $("#order-volume").val();
        var limit = $("#order-limit").val();

        PlaceLimitOrder(type, parseFloat(volume), parseFloat(limit), (res: any) => {
            console.log(res);
            if (res.status != StatusCode.OK) alert("Error: " + res.error);
        });
    });

    setInterval(() => {
        var type = $("#order-type").val();
        var volume = $("#order-volume").val();
        var limit = $("#order-limit").val();
        $("#order-sum").val(volume * limit);
    }, 300);

    $("#booking-size").val(bookSize);
    $("#pair-code").val(currencypair);
    $("#asset-code").val(myasset);
}

$(document).ready(() => {
    console.log("Ready");
    socket = io.connect();
    socket.on('connect', () => {
        console.log("connected.");
        init();
    });
});
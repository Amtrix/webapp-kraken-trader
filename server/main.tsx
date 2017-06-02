import * as React from "react";
import ReactDOM = require('react-dom/server');
import Express = require("express");
import Path = require("path");
import socketio = require("socket.io");
import session = require("express-session");
import bodyParser = require("body-parser");
import mongoose = require("mongoose");
import filesystem = require("fs");
import Handlebars = require("handlebars");


import { KrakenHandler } from "./KrakenHandler";
import { SocketContracts } from "../shared/contracts";

const MongoStore = require('connect-mongo')(session);

var sharedsession = require("express-socket.io-session");

(global as any).extend = require("extend");


type Socket = SocketIO.Socket;

var PORT: number = process.env.PORT || 8312;
var app = Express();
var server = require("http").createServer(app);
var io = socketio.listen(server);

/*
namespace MongoSetup
{
    
    mongoose.connect('mongodb://localhost/webdash');
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function(callback: any) { console.log("connection to mongodb: ok.") });

    (mongoose as any).Promise = global.Promise;
}*/

namespace SharedSessionSetup
{
    var sessionInstance = session({
        resave: true,
        saveUninitialized: true,
        secret: 'this is an awesome secret',
        cookie: { secure: false },
       // store: new MongoStore({ mongooseConnection: mongoose.connection })
    });

  //  app.use(sessionInstance);
  //  io.use(sharedsession(sessionInstance, { autoSave: true }));
}


namespace ExpressSetup
{
    app.use(Express.static(Path.join(__dirname, "../client")));
}

io.on('connection', (socket: SocketIO.Socket) => {
    console.log("connected");

    var lastevent:any = {};

    socket.on('get-bookings', (params: SocketContracts.GetBookings) => {
        var passedTime = (new Date((new Date() as any) - lastevent['get-bookings']).getSeconds());
        console.log("[" + passedTime + "] cmd: get-bookings");
        lastevent['get-bookings'] = new Date();
        KrakenHandler.Depth({ pair: params.pair, count: params.count}, (res: SocketContracts.Depth) => {
            console.log("cmd: get-bookings: " + res.status);
            socket.emit(params.responseChannel, res);
        });
    });

    socket.on('get-my-status', (params: any) => {
        console.log("cmd: get-my-status");
        KrakenHandler.MyStatus((res: any) => {
            console.log("cmd: get-my-status: " + res.status);
            socket.emit(params.responseChannel, res);
        });
    });

    socket.on('get-my-orders', (params: any) => {
        console.log("cmd: get-my-orders");
        KrakenHandler.MyOrders((res: any) => {
            console.log("cmd: get-my-orders: " + res.status);
            socket.emit(params.responseChannel, res);
        });
    });

    socket.on('cancel-order', (params: SocketContracts.CancelOrder) => {
        console.log("cmd: cancel-order");
        KrakenHandler.CancelOrder(params.orderid, (res: any) => {
            console.log("cmd: cancel-order: " + res.status);
            socket.emit(params.responseChannel, res);
        });
    }); 

    socket.on('place-order', (params: SocketContracts.PlaceOrder) => {
        console.log("cmd: place-order");
        KrakenHandler.PlaceOrder(params, (res: any) => {
            console.log("cmd: place-order: " + res.status);
            socket.emit(params.responseChannel, res);
        });
    }); 

    
    socket.on('get-my-trade-balance', (params: SocketContracts.GetMyTradeBalance) => {
        console.log("cmd: get-my-trade-balance");
        KrakenHandler.GetMyTradeBalance(params, (res: any) => {
            console.log("cmd: get-my-trade-balance: " + res.status);
            socket.emit(params.responseChannel, res);
        });
    }); 
});


console.log("Server started at port: " + PORT);
server.listen(PORT, "127.0.0.1");

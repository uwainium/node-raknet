import RakMessages from './RakMessages';
import BitStream from './structures/BitStream.js';
import {ReliabilityLayer} from './ReliabilityLayer.js';
import * as data from 'dgram';
const EventEmitter = require('events');

export default class RakServer extends EventEmitter {
    #ip : string;
    #port : number;
    readonly #connections : Array<ReliabilityLayer>;
    #password : string;
    readonly #server : data.Socket;
    #startTime : number;

    /**
     *
     * @param {String} ip
     * @param {number} port
     * @param {String} password
     */
    constructor(ip : string, port : number, password : string) {
        super();

        this.#ip = ip;

        this.#port = port;

        this.#connections = [];

        this.#password = password;

        this.#server = data.createSocket('udp4');

        this.#startTime = Date.now();

        this.#server.on('error', (err) => {
            this.onError(err);
        });

        this.#server.on('message', (msg, senderInfo) => {
            let data = new BitStream(msg);
            try {
                this.onMessage(data, senderInfo)
            }
            catch(e) {
                console.warn(`Something went wrong while handling packet! ${e.message}`);
                console.warn(e.stack);
            }
        });

        let temp = this;

        this.#server.on('listening', () => {
            this.onListening();
        });

        this.#server.bind(port, ip);
    }

    /**
     * This is called when we receive a new message from a client.
     * @param {BitStream} data
     * @param senderInfo
     */
    onMessage(data : BitStream, senderInfo) : void {
        if(data.length() === 2) { //meaning there isnt an open connection yet...

            let messageId = data.readByte();

            if(messageId === RakMessages.ID_OPEN_CONNECTION_REQUEST) {
                this.#connections[senderInfo.address] = new ReliabilityLayer(this.server, senderInfo);
                let ret = Buffer.alloc(1);
                ret.writeInt8(RakMessages.ID_OPEN_CONNECTION_REPLY, 0);
                this.server.send(ret, senderInfo.port, senderInfo.address);
            }

        } else {
            if(this.#connections[senderInfo.address] !== undefined) { //we have an existing connection
                const packets = this.#connections[senderInfo.address].handle_data(data);
                let finished = false;

                while(!finished) {
                    let next = packets.next();
                    if(next.value !== undefined) {
                        let packet = next.value;
                        this.onPacket(packet, senderInfo);
                    }

                    if(next.done) {
                        finished = true;
                    }
                }
            } else {
                console.warn(`Got message from unconnected user!`);
            }
        }
    }

    /**
     * This is called by onMessage after it breaks down the packets into what gets done when
     * @param {BitStream} packet
     * @param {Object} senderInfo
     */
    onPacket(packet : BitStream, senderInfo : Object) : void {
        let type = packet.readByte();
        if(this.listenerCount(String(type)) > 0) {
            this.emit(String(type), packet, senderInfo);
        } else {
            console.log(`No listeners found for ID: ${RakMessages.key(type)} (${type})`);
        }
    }

    /**
     * If the server throws an error, this gets called
     * @param {Error} error
     */
    onError(error : Error) : void {
        console.log(`server error:\n${error.stack}`);
        this.#server.close();
    }

    /**
     * When the server first starts up
     */
    onListening() : void {
        const address = this.#server.address();
        console.log(`server listening ${address.address}:${address.port}`);
    }

    /**
     *
     * @param {string} ip
     * @returns {ReliabilityLayer}
     */
    getClient(ip : string) : ReliabilityLayer {
        return this.#connections[ip];
    }

    /**
     * @returns {data.Socket}
     */
    get server() : data.Socket {
        return this.#server;
    }
}
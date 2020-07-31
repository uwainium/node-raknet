import {ReliabilityLayer} from "./ReliabilityLayer";
import * as data from 'dgram';
import * as events from "events";
import BitStream from "./structures/BitStream";
import RakMessages from "./RakMessages";

export default class RakClient extends events.EventEmitter {
    #ip : string;
    #port : number;
    #connection : ReliabilityLayer;
    #password : string;
    readonly #client : data.Socket;
    #startTime : number;

    constructor(ip : string, port : number, password : string) {
        super();

        this.#ip = ip;

        this.#port = port;

        this.#password = password;

        this.#client = data.createSocket('udp4');

        this.#startTime = Date.now();

        this.#client.on('error', (err) => {
            this.onError(err);
        });

        this.#client.on('message', (msg, senderInfo) => {
            let data = new BitStream(msg);
            try {
                this.onMessage(data, senderInfo)
            }
            catch(e) {
                console.warn(`Something went wrong while handling packet! ${e.message}`);
                console.warn(e.stack);
            }
        });

        // initiate connection
        let stream = new BitStream();
        stream.writeByte(RakMessages.ID_OPEN_CONNECTION_REQUEST);
        stream.writeByte(0);
        this.#client.send(stream.data, this.#port, this.#ip);
    }

    onError(error) {
        console.log(`client error:\n${error.stack}`);
    }

    onMessage(data, senderInfo) {
        if(data.length == 2) {
            let messageId = data.readByte();

            if(messageId === RakMessages.ID_OPEN_CONNECTION_REPLY) {
                this.#connection = new ReliabilityLayer(this.#client, senderInfo);
            }
        } else {
            const packets = this.#connection.handle_data(data);
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
        }

    }

    onPacket(packet : BitStream, senderInfo : Object) : void {
        let type = packet.readByte();
        if(this.listenerCount(String(type)) > 0) {
            this.emit(String(type), packet, senderInfo);
        } else {
            console.log(`No listeners found for ID: ${RakMessages.key(type)} (${type})`);
        }
    }

    getServer() {
        return this.#connection;
    }

    get client() {
        return this.#client;
    }
}
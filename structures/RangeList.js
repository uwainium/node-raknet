"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RangeListRange = exports.RangeList = void 0;
const BitStream_1 = require("./BitStream");
class RangeList {
    /**
     * Constructs a new RangeList and set the default values
     */
    constructor() {
        this.ranges = [];
    }
    /**
     *
     * @param {BitStream} data
     */
    deserialize(data) {
        let count = data.readCompressed(2).readShort();
        let maxEqualToMin = false;
        for (let i = 0; i < count; i++) {
            maxEqualToMin = data.readBit() == 1;
            let min = data.readLong();
            let max = min;
            if (!maxEqualToMin) {
                max = data.readLong();
            }
            this.ranges.push(new RangeListRange(min, max));
        }
    }
    /**
     * Serializes this Rangelist to a stream
     * @returns {BitStream}
     */
    serialize() {
        let stream = new BitStream_1.default();
        stream.writeCompressedShort(this.ranges.length);
        for (let i = 0; i < this.ranges.length; i++) {
            stream.writeBit(this.ranges[i].min === this.ranges[i].max);
            stream.writeLong(this.ranges[i].min);
            if (this.ranges[i].min !== this.ranges[i].max) {
                stream.writeLong(this.ranges[i].max);
            }
        }
        return stream;
    }
    /**
     * Returns if this Rangelist is empty or not
     * @returns {boolean}
     */
    isEmpty() {
        return this.ranges.length === 0;
    }
    /**
     * Clears this Rangelist
     */
    empty() {
        this.ranges = [];
    }
    /**
     * Adds a number to this Ranglist
     * @param {number} n
     */
    add(n) {
        for (let i = 0; i < this.ranges.length; i++) {
            let range = this.ranges[i];
            if (range.isInRange(n)) {
                // We don't have to worry about it because it is already in here
                return;
            }
            if (range.canExtendMin(n)) {
                // It can decrement the min by one
                range.min--;
                this.updateOverlap();
                return;
            }
            if (range.canExtendMax(n)) {
                // It can increment the max by one
                range.max++;
                this.updateOverlap();
                return;
            }
        }
        // Since we got here, we must go ahead and add a new range
        this.ranges.push(new RangeListRange(n, n));
    }
    /**
     * Updates ranges if there is an overlap and merges them where needed
     */
    updateOverlap() {
        for (let i = 0; i < this.ranges.length; i++) {
            let range = this.ranges[i];
            for (let j = 0; j < this.ranges.length; j++) {
                if (j === i)
                    continue;
                let nextRange = this.ranges[j];
                if (range.max === nextRange.min - 1) {
                    //they are right next to each other and need to be merged
                    this.ranges.push(new RangeListRange(range.min, nextRange.max));
                    this.ranges.splice(i, 1);
                    // Logic for removing j after I has been removed
                    if (i < j) {
                        this.ranges.splice(j - 1, 1);
                    }
                    else {
                        this.ranges.splice(j, 1);
                    }
                }
            }
        }
    }
    /**
     * Converts this object into an Array
     * @returns {Array<Number>}
     */
    toArray() {
        let ret = [];
        for (let i = 0; i < this.ranges.length; i++) {
            ret.concat(this.ranges[i].toArray()).sort(function (a, b) {
                return a - b;
            });
        }
        return ret;
    }
}
exports.RangeList = RangeList;
class RangeListRange {
    /**
     * Constructs a new Range from the values
     * @param {number} min
     * @param {number} max
     */
    constructor(min, max) {
        this.min = min;
        this.max = max;
    }
    /**
     * Returns an array
     * @returns {Array<number>}
     */
    toArray() {
        let ret = [];
        for (let i = this.min; i <= this.max; i++) {
            ret.push(i);
        }
        return ret;
    }
    /**
     * Determines if this number is already within range
     * @param {number} n
     * @returns {boolean}
     */
    isInRange(n) {
        return n >= this.min && n <= this.max;
    }
    /**
     *
     * @param {number} n
     * @returns {boolean}
     */
    canExtendMax(n) {
        return n === this.max + 1;
    }
    /**
     *
     * @param {number} n
     * @returns {boolean}
     */
    canExtendMin(n) {
        return n === this.min - 1;
    }
}
exports.RangeListRange = RangeListRange;
//# sourceMappingURL=RangeList.js.map
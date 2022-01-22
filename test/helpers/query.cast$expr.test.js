'use strict';

const { Schema } = require('../common').mongoose;
const assert = require('assert');
const cast$expr = require('../../lib/helpers/query/cast$expr');

describe('castexpr', function() {
  it('casts comparisons', function() {
    const testSchema = new Schema({ date: Date, spent: Number, budget: Number });

    let res = cast$expr({ $eq: ['$date', '2021-06-01'] }, testSchema);
    assert.deepEqual(res, { $eq: ['$date', new Date('2021-06-01')] });

    res = cast$expr({ $eq: [{ $year: '$date' }, 2021] }, testSchema);
    assert.deepStrictEqual(res, { $eq: [{ $year: '$date' }, 2021] });

    res = cast$expr({ $eq: [{ $year: '$date' }, '2021'] }, testSchema);
    assert.deepStrictEqual(res, { $eq: [{ $year: '$date' }, 2021] });

    res = cast$expr({ $eq: [{ $year: '$date' }, { $literal: '2021' }] }, testSchema);
    assert.deepStrictEqual(res, { $eq: [{ $year: '$date' }, { $literal: 2021 }] });

    res = cast$expr({ $eq: [{ $year: '$date' }, { $literal: '2021' }] }, testSchema);
    assert.deepStrictEqual(res, { $eq: [{ $year: '$date' }, { $literal: 2021 }] });

    res = cast$expr({ $gt: ['$spent', '$budget'] }, testSchema);
    assert.deepStrictEqual(res, { $gt: ['$spent', '$budget'] });
  });

  it('casts conditions', function() {
    const testSchema = new Schema({ price: Number, qty: Number });

    let discountedPrice = {
      $cond: {
        if: { $gte: ['$qty', { $floor: '100' }] },
        then: { $multiply: ['$price', '0.5'] },
        else: { $multiply: ['$price', '0.75'] }
      }
    };
    let res = cast$expr({ $lt: [discountedPrice, 5] }, testSchema);
    assert.deepStrictEqual(res, {
      $lt: [
        {
          $cond: {
            if: { $gte: ['$qty', { $floor: 100 }] },
            then: { $multiply: ['$price', 0.5] },
            else: { $multiply: ['$price', 0.75] }
          }
        },
        5
      ]
    });

    discountedPrice = {
      $cond: {
        if: { $and: [{ $gte: ['$qty', { $floor: '100' }] }] },
        then: { $multiply: ['$price', '0.5'] },
        else: { $multiply: ['$price', '0.75'] }
      }
    };
    res = cast$expr({ $lt: [discountedPrice, 5] }, testSchema);
    assert.deepStrictEqual(res, {
      $lt: [
        {
          $cond: {
            if: { $and: [{ $gte: ['$qty', { $floor: 100 }] }] },
            then: { $multiply: ['$price', 0.5] },
            else: { $multiply: ['$price', 0.75] }
          }
        },
        5
      ]
    });
  });

  it('casts boolean expressions', function() {
    const testSchema = new Schema({ date: Date, spent: Number, budget: Number });

    const res = cast$expr({ $and: [{ $eq: [{ $year: '$date' }, '2021'] }] }, testSchema);
    assert.deepStrictEqual(res, { $and: [{ $eq: [{ $year: '$date' }, 2021] }] });
  });

  it('cast errors', function() {
    const testSchema = new Schema({ date: Date, spent: Number, budget: Number });

    assert.throws(() => {
      cast$expr({ $eq: [{ $year: '$date' }, 'not a number'] }, testSchema);
    }, /Cast to Number failed/);
  });
});
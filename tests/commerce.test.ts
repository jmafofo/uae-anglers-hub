import test from 'node:test';
import assert from 'node:assert/strict';
import {charterAmounts,gearAmounts,dealerRentalAmount,canSellerTransition,isOverdueDelivery,hasRealDiscount} from '../lib/commerce';
test('charter commission is deducted from listed total in fils',()=>{
 assert.deepEqual(charterAmounts(200000),{totalFils:200000,commissionFils:10000,operatorFils:190000});
 assert.equal(charterAmounts(19999).commissionFils,1000);
 for(const value of [0,-1,NaN,Infinity,99.5])assert.throws(()=>charterAmounts(value));
});
test('seller cannot declare delivery or skip payment',()=>{
 assert.equal(canSellerTransition('gear','paid','preparing'),true);
 assert.equal(canSellerTransition('gear','preparing','shipped'),true);
 assert.equal(canSellerTransition('gear','shipped','delivered'),false);
 assert.equal(canSellerTransition('gear','awaiting_payment','shipped'),false);
});
test('only undelivered paid gear orders become overdue',()=>{
 const now=Date.parse('2026-11-27T12:00:00Z');
 for(const status of ['paid','preparing','shipped'])assert.equal(isOverdueDelivery({kind:'gear',status,deliverBy:'2026-11-26'},now),true);
 for(const status of ['delivered','refunded','cancelled','awaiting_payment'])assert.equal(isOverdueDelivery({kind:'gear',status,deliverBy:'2026-11-26'},now),false);
 assert.equal(isOverdueDelivery({kind:'charter',status:'paid',deliverBy:'2026-11-26'},now),false);
 assert.equal(hasRealDiscount(100,150),true);assert.equal(hasRealDiscount(100,90),false);
});

test('tackle commission excludes delivery',()=>{assert.deepEqual(gearAmounts(10000,1500,'individual'),{totalFils:11500,commissionFils:500,sellerFils:11000});});

test('dealers pay no sales commission and annual rent saves 20%',()=>{
 assert.deepEqual(gearAmounts(10000,1500,'dealer'),{totalFils:11500,commissionFils:0,sellerFils:11500});
 assert.equal(dealerRentalAmount(29900,'monthly'),29900);
 assert.equal(dealerRentalAmount(29900,'annual'),287040);
 assert.equal(dealerRentalAmount(79900,'annual'),767040);
});

// Run only against the isolated fixture database, never a live Supabase database.
import postgres from 'postgres';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
async function main(){
const url=process.env.COMMERCE_TEST_DATABASE_URL;
if(!url||!url.includes('127.0.0.1:55439'))throw Error('Isolated test database required');
const sql=postgres(url,{max:4});
try{
 const seller=randomUUID(),buyer=randomUUID(),buyer2=randomUUID(),listing=randomUUID(),charter=randomUUID();
 await sql`insert into profiles(id) values (${seller}),(${buyer}),(${buyer2})`;
 await sql`insert into commerce_merchants(user_id,display_name,stripe_account_id,enabled,delivery_days) values (${seller},'Test dealer',${'acct_'+seller},true,3)`;
 await sql`insert into listings(id,user_id,title,photos,price,stock_quantity) values (${listing},${seller},'Test reel',ARRAY['https://example.com/reel.jpg'],100,1)`;
 const attempts=await Promise.allSettled([sql`select (reserve_commerce_order(${buyer},${randomUUID()},'gear',${listing},1)).*`,sql`select (reserve_commerce_order(${buyer2},${randomUUID()},'gear',${listing},1)).*`]);
 assert.equal(attempts.filter(x=>x.status==='fulfilled').length,1,'last unit cannot be sold twice');
 const result=attempts.find(x=>x.status==='fulfilled');if(!result||result.status!=='fulfilled')throw Error('No order');const o=result.value[0];
 const retry=await sql`select (reserve_commerce_order(${o.buyer_id},${o.request_key},'gear',${listing},1)).*`;assert.equal(retry[0].id,o.id);
 assert.equal((await sql`select stock_quantity from listings where id=${listing}`)[0].stock_quantity,0);
 await sql`update commerce_orders set stripe_session_id=${'cs_'+o.id} where id=${o.id}`;
 const session={id:'cs_'+o.id,metadata:{commerceOrderId:o.id},payment_status:'paid',amount_total:10000,currency:'aed',payment_intent:'pi_'+o.id};
 await assert.rejects(sql`select fulfill_commerce_payment(${randomUUID()},'checkout.session.completed',${sql.json({...session,amount_total:1})})`);
 const event=randomUUID();await sql`select fulfill_commerce_payment(${event},'checkout.session.completed',${sql.json(session)})`;
 await sql`select fulfill_commerce_payment(${event},'checkout.session.completed',${sql.json(session)})`;
 assert.equal((await sql`select status from commerce_orders where id=${o.id}`)[0].status,'paid');
 await assert.rejects(sql`select advance_commerce_order(${o.id},${seller},'delivered')`);
 await assert.rejects(sql`select advance_commerce_order(${o.id},${buyer2===o.buyer_id?buyer:buyer2},'preparing')`);
 await sql`select advance_commerce_order(${o.id},${seller},'preparing')`;
 await assert.rejects(sql`select advance_commerce_order(${o.id},${seller},'shipped')`);
 await sql`select advance_commerce_order(${o.id},${seller},'shipped','Test carrier','TEST-123')`;
 await sql`update commerce_orders set deliver_by=now()-interval '1 day' where id=${o.id}`;
 await sql`select * from claim_commerce_notifications()`;await sql`select * from claim_commerce_notifications()`;
 assert.equal(Number((await sql`select count(*) from commerce_outbox where order_id=${o.id}`)[0].count),1);
 await sql`select advance_commerce_order(${o.id},${o.buyer_id},'delivered')`;
 await sql`insert into charters(id,name) values (${charter},'Test charter')`;
 const [departure]=await sql`insert into charter_departures(charter_id,merchant_id,starts_at,ends_at,price_fils,capacity,is_active) values (${charter},${seller},now()+interval '1 day',now()+interval '1 day 4 hours',200000,6,true) returning id`;
 const [overlap]=await sql`insert into charter_departures(charter_id,merchant_id,starts_at,ends_at,price_fils,capacity,is_active) values (${charter},${seller},now()+interval '1 day 1 hour',now()+interval '1 day 5 hours',200000,6,true) returning id`;
 const [trip]=await sql`select (reserve_commerce_order(${buyer},${randomUUID()},'charter',${departure.id},4)).*`;
 assert.equal(trip.total_fils,200000);assert.equal(trip.commission_fils,10000);
 await assert.rejects(sql`select reserve_commerce_order(${buyer2},${randomUUID()},'charter',${overlap.id},2)`);
 await sql`update commerce_orders set stripe_session_id=${'cs_'+trip.id} where id=${trip.id}`;
 await sql`select fulfill_commerce_payment(${randomUUID()},'checkout.session.expired',${sql.json({id:'cs_'+trip.id,metadata:{commerceOrderId:trip.id}})})`;
 await sql`select reserve_commerce_order(${buyer2},${randomUUID()},'charter',${overlap.id},2)`;
 assert.equal((await sql`select has_function_privilege('authenticated','reserve_commerce_order(uuid,uuid,text,uuid,integer)','execute') permitted`)[0].permitted,false);
 console.log('PASS: concurrent stock reservation, idempotency, payment amount validation, replay protection, party authorization, tracking requirements, overdue deduplication, 5% fee, overlapping boat bookings, expiry release, service-only writes');
}finally{await sql.end();}

}
main().catch(error=>{console.error(error);process.exitCode=1;});

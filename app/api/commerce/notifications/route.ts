import {NextRequest,NextResponse} from 'next/server';
import {timingSafeEqual} from 'node:crypto';
import {Resend} from 'resend';
import {getSupabaseAdmin} from '@/lib/supabase-admin';
export async function GET(req:NextRequest){
 const expected=process.env.CRON_SECRET;const token=req.headers.get('authorization')?.replace(/^Bearer /,'')??'';
 if(!expected||token.length!==expected.length||!timingSafeEqual(Buffer.from(token),Buffer.from(expected)))return NextResponse.json({error:'Unauthorized'},{status:401});
 if(process.env.COMMERCE_NOTIFICATIONS_ENABLED!=='true')return NextResponse.json({enabled:false});
 const db=getSupabaseAdmin();const {data:jobs,error}=await db.rpc('claim_commerce_notifications');
 if(error)return NextResponse.json({error:'Unable to claim notifications'},{status:503});
 let sent=0;let deferred=0;
 for(const job of jobs??[]){
  try{
   const {data:o,error:orderError}=await db.from('commerce_orders').select('id,order_number,title,status,merchant_id,deliver_by,departure_id,quantity').eq('id',job.order_id).single();if(orderError||!o)throw Error('Order unavailable');
   if(job.event_type==='delivery_overdue'){
    if(!['paid','preparing','shipped'].includes(o.status)){await db.from('commerce_outbox').update({status:'sent',sent_at:new Date().toISOString()}).eq('id',job.id);continue;}
    if(!process.env.RESEND_API_KEY)throw Error('Resend unavailable');
    const {error:mailError}=await new Resend(process.env.RESEND_API_KEY).emails.send({from:'UAEAngler Orders <notifications@uaeangler.com>',to:'info@uaeangler.com',subject:`Delivery follow-up required: ${o.order_number}`,text:`UAEAngler delivery follow-up\nOrder: ${o.order_number}\nItem: ${o.title}\nPromised delivery: ${o.deliver_by}\nStatus: ${o.status}\nReview the order and contact the seller through the authorized support workflow.\nhttps://uaeangler.com/orders/${o.id}\n\nThis is an internal escalation, not confirmation that a seller has breached an agreement.`},{idempotencyKey:`commerce-${job.id}`});if(mailError)throw Error('Email delivery failed');
   }else{
    if(!['paid','completed'].includes(o.status)){await db.from('commerce_outbox').update({status:'sent',sent_at:new Date().toISOString()}).eq('id',job.id);continue;}
    const {data:merchant}=await db.from('commerce_merchants').select('whatsapp_e164,whatsapp_opted_in_at').eq('user_id',o.merchant_id).single();
    const {data:departure}=await db.from('charter_departures').select('starts_at').eq('id',o.departure_id).single();
    const sid=process.env.TWILIO_ACCOUNT_SID,secret=process.env.TWILIO_AUTH_TOKEN,from=process.env.TWILIO_WHATSAPP_FROM,template=process.env.TWILIO_BOOKING_CONTENT_SID;
    if(!sid||!secret||!from||!template||!merchant?.whatsapp_opted_in_at||!merchant.whatsapp_e164)throw Error('WhatsApp setup or operator consent missing');
    const response=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,{method:'POST',headers:{Authorization:'Basic '+Buffer.from(`${sid}:${secret}`).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({From:from,To:`whatsapp:${merchant.whatsapp_e164}`,ContentSid:template,ContentVariables:JSON.stringify({'1':o.order_number,'2':o.title,'3':departure?.starts_at??'See booking','4':String(o.quantity),'5':`https://uaeangler.com/orders/${o.id}`})}),signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw Error('WhatsApp provider rejected notification');
   }
   const {error:saveError}=await db.from('commerce_outbox').update({status:'sent',sent_at:new Date().toISOString()}).eq('id',job.id);if(saveError)throw Error('Notification receipt could not be saved');sent++;
  }catch{await db.from('commerce_outbox').update({status:'pending',next_attempt_at:new Date(Date.now()+Math.min(360,5*2**Math.min(job.attempts,6))*60000).toISOString()}).eq('id',job.id);deferred++;}
 }
 return NextResponse.json({sent,deferred});
}

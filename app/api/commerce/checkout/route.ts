import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getStripe } from '@/lib/stripe';
const input = z.object({ kind:z.enum(['gear','charter']), itemId:z.uuid(), quantity:z.number().int().min(1).max(20), requestKey:z.uuid() });
export async function POST(req:NextRequest) {
  const auth=await requireAuthUniversal(req); if(!auth.ok) return auth.response;
  if(process.env.COMMERCE_CHECKOUT_ENABLED!=='true') return NextResponse.json({error:'Online checkout is not open yet. Please contact the seller.'},{status:503});
  const parsed=input.safeParse(await req.json().catch(()=>null)); if(!parsed.success) return NextResponse.json({error:'Invalid checkout details'},{status:400});
  const db=getSupabaseAdmin(); const body=parsed.data;
  // Verify the connected seller before reserving scarce stock or a departure.
  try {
    const {data:item}=body.kind==='gear'
      ? await db.from('listings').select('user_id').eq('id',body.itemId).maybeSingle()
      : await db.from('charter_departures').select('merchant_id').eq('id',body.itemId).maybeSingle();
    const sellerId=item && ('user_id' in item ? item.user_id : item.merchant_id);
    if(!sellerId) return NextResponse.json({error:'Item unavailable'},{status:404});
    const {data:merchant}=await db.from('commerce_merchants').select('stripe_account_id').eq('user_id',sellerId).eq('enabled',true).maybeSingle();
    if(!merchant?.stripe_account_id) return NextResponse.json({error:'Seller checkout is not open yet.'},{status:503});
    const account=await getStripe().accounts.retrieve(merchant.stripe_account_id);
    if(!account.charges_enabled||!account.payouts_enabled) return NextResponse.json({error:'The seller’s payment account is not ready.'},{status:503});
  } catch { return NextResponse.json({error:'Seller payments could not be verified. Please try again later.'},{status:503}); }
  const {data:order,error}=await db.rpc('reserve_commerce_order',{p_buyer:auth.user.id,p_request:body.requestKey,p_kind:body.kind,p_item:body.itemId,p_quantity:body.quantity});
  if(error||!order) return NextResponse.json({error:error?.message??'Unable to reserve this item'},{status:409});
  if(order.kind!==body.kind || (order.listing_id??order.departure_id)!==body.itemId || order.quantity!==body.quantity) return NextResponse.json({error:'Checkout request has changed. Start a new checkout.'},{status:409});
  if(order.status!=='awaiting_payment') return NextResponse.json({error:'This order is no longer awaiting payment',orderId:order.id},{status:409});
  try {
    const stripe=getStripe();
    const origin=process.env.NEXT_PUBLIC_APP_URL || 'https://uaeangler.com';
    const session=await stripe.checkout.sessions.create({
      mode:'payment', payment_method_types:['card'], customer_email:auth.user.email,
      client_reference_id:order.id, metadata:{commerceOrderId:order.id},
      line_items:[{price_data:{currency:'aed',unit_amount:order.total_fils,product_data:{name:order.title,description:order.kind==='charter'?`Private trip · ${order.quantity} guests`:`${order.quantity} item(s) · includes AED ${(order.shipping_fils/100).toFixed(2)} delivery`}},quantity:1}],
      ...(order.kind==='gear'?{shipping_address_collection:{allowed_countries:['AE' as const]}}:{}),
      phone_number_collection:{enabled:true},
      payment_intent_data:{application_fee_amount:order.commission_fils,transfer_data:{destination:order.stripe_account_id},metadata:{commerceOrderId:order.id}},
      expires_at:Math.floor(new Date(order.created_at).getTime()/1000)+3600,
      success_url:`${origin}/orders/${order.id}?checkout=complete`,cancel_url:`${origin}/orders/${order.id}?checkout=cancelled`,
    },{idempotencyKey:`commerce-order-${order.id}`});
    const {error:saveError}=await db.from('commerce_orders').update({stripe_session_id:session.id}).eq('id',order.id).eq('status','awaiting_payment');
    if(saveError) throw saveError;
    return NextResponse.json({url:session.url,orderId:order.id});
  }catch(error){console.error('[commerce checkout]',error instanceof Error?error.message:'failed');return NextResponse.json({error:'Checkout could not be opened. Retry this checkout; you will not be charged twice.'},{status:502});}
}

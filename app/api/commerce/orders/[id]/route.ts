import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthUniversal,getUserSupabase } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
const schema=z.object({status:z.enum(['preparing','shipped','delivered','completed']),carrier:z.string().trim().max(100).optional(),trackingNumber:z.string().trim().max(150).optional()});
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const auth=await requireAuthUniversal(req);if(!auth.ok)return auth.response; const {id}=await params;
 const {data,error}=await getUserSupabase(auth.token).from('commerce_orders').select('id,order_number,buyer_id,merchant_id,kind,title,image_url,quantity,total_fils,shipping_fils,commission_fils,status,deliver_by,shipping_address,carrier,tracking_number,paid_at,created_at,departure_id,listing_id,request_key,commerce_events(event_type,created_at)').eq('id',id).maybeSingle();
 if(error)return NextResponse.json({error:'Order unavailable'},{status:503});if(!data)return NextResponse.json({error:'Order not found'},{status:404});
 return NextResponse.json({order:data,isSeller:data.merchant_id===auth.user.id});
}
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const auth=await requireAuthUniversal(req);if(!auth.ok)return auth.response; const {id}=await params;
 const body=schema.safeParse(await req.json().catch(()=>null));if(!body.success)return NextResponse.json({error:'Invalid order update'},{status:400});
 const {error}=await getSupabaseAdmin().rpc('advance_commerce_order',{p_order:id,p_actor:auth.user.id,p_status:body.data.status,p_carrier:body.data.carrier??null,p_tracking:body.data.trackingNumber??null});
 if(error)return NextResponse.json({error:'This update is not permitted. Shipped orders require a carrier and tracking number.'},{status:409});
 return NextResponse.json({ok:true});
}

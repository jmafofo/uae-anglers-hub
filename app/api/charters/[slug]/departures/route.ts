import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseAdmin} from '@/lib/supabase-admin';
export async function GET(req:NextRequest,{params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const db=getSupabaseAdmin();
 const {data:charter}=await db.from('charters').select('id').eq('slug',slug).maybeSingle();
 if(!charter)return NextResponse.json({departures:[]});
 const {data,error}=await db.from('charter_departures').select('id,starts_at,ends_at,price_fils,capacity').eq('charter_id',charter.id).eq('is_active',true).gt('starts_at',new Date().toISOString()).order('starts_at').limit(90);
 if(error)return NextResponse.json({error:'Online availability is not published yet.'},{status:503});
 // Availability is indicative. The database rechecks boat overlap under a lock at reservation.
 const {data:booked,error:bookingError}=await db.from('commerce_orders').select('departure_id').eq('kind','charter').not('status','in','(cancelled,refunded)').in('departure_id',(data??[]).map(d=>d.id));
 if(bookingError)return NextResponse.json({error:'Availability could not be checked.'},{status:503});
 const taken=new Set((booked??[]).map(o=>o.departure_id));
 return NextResponse.json({departures:(data??[]).filter(d=>!taken.has(d.id)),checkoutEnabled:process.env.COMMERCE_CHECKOUT_ENABLED==='true'});
}

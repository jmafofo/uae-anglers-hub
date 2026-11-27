import { NextRequest,NextResponse } from 'next/server';
import { requireAuthUniversal,getUserSupabase } from '@/lib/api-auth';
export async function GET(req:NextRequest){
 const auth=await requireAuthUniversal(req);if(!auth.ok)return auth.response;
 const seller=req.nextUrl.searchParams.get('view')==='seller';
 const {data,error}=await getUserSupabase(auth.token).from('commerce_orders').select('id,order_number,title,kind,status,total_fils,quantity,created_at,deliver_by').eq(seller?'merchant_id':'buyer_id',auth.user.id).order('created_at',{ascending:false}).limit(100);
 if(error)return NextResponse.json({error:'Orders are unavailable'},{status:503});
 return NextResponse.json({orders:data});
}

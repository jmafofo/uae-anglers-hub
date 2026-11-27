'use client';
import {useRef,useState} from 'react';
export default function CheckoutButton({kind,itemId,quantity=1,enabled,label='Buy now'}:{kind:'gear'|'charter';itemId:string;quantity?:number;enabled:boolean;label?:string}){
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const request=useRef<string|null>(null);
 async function checkout(){setBusy(true);setError('');request.current??=crypto.randomUUID();try{const r=await fetch('/api/commerce/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,itemId,quantity,requestKey:request.current})});if(r.status===401){location.href='/login?next='+encodeURIComponent(location.pathname);return;}const data=await r.json();if(!r.ok)throw new Error(data.error||'Checkout unavailable');location.href=data.url;}catch(e){setError(e instanceof Error?e.message:'Checkout unavailable');setBusy(false);}}
 return <div><button type="button" disabled={!enabled||busy} onClick={checkout} className="coastal-button w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">{busy?'Opening secure checkout…':enabled?label:'Online checkout coming soon'}</button>{error&&<p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}</div>;
}

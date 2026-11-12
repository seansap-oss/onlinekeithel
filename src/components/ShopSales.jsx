import React,{useState,useEffect} from 'react';
import {supabase,result} from '../lib/backend';
import {money} from '../lib/utils';
export default function ShopSales({seller,visual}){
 const today=new Date().toLocaleDateString('en-CA');
 const [month,M]=useState(today.slice(0,7)),[rows,R]=useState([]),[error,E]=useState(''),[busy,B]=useState(false),[revision,U]=useState(0),[loading,L]=useState(true);
 useEffect(()=>{let live=true;R([]);E('');L(true);
 async function read(){if(visual||!month)return [];const [y,m]=month.split('-').map(Number),end=m===12?(y+1)+'-01':y+'-'+String(m+1).padStart(2,'0');const all=[];
 for(let n=0;;n+=500){const batch=await result(supabase.from('shop_sales').select('id,item,sold_on,quantity,unit_price').eq('seller_id',seller.id).gte('sold_on',month+'-01').lt('sold_on',end+'-01').order('sold_on',{ascending:false}).order('id').range(n,n+499));if(!live)return [];all.push(...batch);if(batch.length<500)return all;}}
 read().then(x=>live&&R(x)).catch(e=>live&&E(e.message)).finally(()=>live&&L(false));return()=>{live=false};},[seller.id,month,visual,revision]);
 async function record(e){e.preventDefault();if(busy||visual)return;const form=e.currentTarget,d=new FormData(form);B(true);E('');try{await result(supabase.from('shop_sales').insert({seller_id:seller.id,item:d.get('item').trim(),quantity:Number(d.get('qty')),unit_price:Number(d.get('price')),sold_on:d.get('date')}));M(d.get('date').slice(0,7));U(n=>n+1);form.reset()}catch(e){E(e.message)}finally{B(false)}}
 return <section><span className="eyebrow">PRIVATE · SELLER RECORDS</span><h2>Recorded sales</h2><p>Record completed sales here. Enquiries and WhatsApp clicks do not count as sales. Recording a sale leaves stock quantities unchanged.</p>
 <form className="studio-sale" onSubmit={record}><label>Item sold<input required maxLength={200} name="item"/></label><label>Quantity<input name="qty" type="number" min="1" max="1000000" required defaultValue="1"/></label><label>Actual price per unit ₹<input required name="price" type="number" min="0" step=".01"/></label><label>Sale date<input required type="date" name="date" defaultValue={today}/></label><button disabled={busy||visual} className="button primary">{busy?'Saving…':'Record sale'}</button></form>
 <label>Reporting month <input required type="month" value={month} onChange={e=>M(e.target.value)}/></label>{error?<p role="alert">{error}</p>:loading?<p>Loading sales…</p>:<><h3>{money(rows.reduce((n,r)=>n+r.quantity*Number(r.unit_price),0))} · {rows.reduce((n,r)=>n+r.quantity,0)} units</h3>{rows.length?rows.map(r=><p key={r.id}>{r.sold_on} · {r.item} · {r.quantity} × {money(r.unit_price)}</p>):<p>No sales recorded for this month.</p>}</>}</section>
}

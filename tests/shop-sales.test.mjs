import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('sales are private to the owning seller and cannot be recorded against another shop',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create function auth.uid() returns uuid language sql as $$select current_setting('app.uid')::uuid$$; grant usage on schema auth to authenticated;create table sellers(id uuid primary key,user_id uuid);grant select on sellers to authenticated;insert into sellers values ('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001'),('10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002');`);
 await db.exec(await readFile(new URL('../supabase/migrations/20261112000000_shop_sales.sql',import.meta.url),'utf8'));
 await db.exec("set role authenticated;set app.uid='20000000-0000-4000-8000-000000000001';insert into shop_sales(seller_id,item,quantity,unit_price) values('10000000-0000-4000-8000-000000000001','Socks',2,120)");
 assert.equal((await db.query('select * from shop_sales')).rows.length,1);
 await db.exec("set app.uid='20000000-0000-4000-8000-000000000002'");
 assert.equal((await db.query('select * from shop_sales')).rows.length,0);
 await assert.rejects(db.exec("insert into shop_sales(seller_id,item,quantity,unit_price) values('10000000-0000-4000-8000-000000000001','Socks',1,120)"),/row-level security/);
 }finally{await db.close()}
});

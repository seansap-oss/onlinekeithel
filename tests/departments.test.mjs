import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {validateClassified, listingPrice, indiaTime} from '../src/lib/departments.js';
test('classified publishing rejects missing details, unsafe links and invalid event pricing',()=>{
 const event={category_id:'happenings',status:'published',price:0,attributes:{'Event starts':'2026-10-20T10:00','Event ends':'2026-10-20T12:00',Venue:'Imphal','Entry type':'Free'}};
 assert.doesNotThrow(()=>validateClassified(event));
 assert.throws(()=>validateClassified({...event,price:100}),/Free events/);
 assert.throws(()=>validateClassified({...event,attributes:{...event.attributes,'Event ends':'2026-10-20T09:00'}}),/Event end/);
 const job={category_id:'jobs',status:'published',attributes:{'Employment type':'Full-time','Employer sector':'Government','Salary basis':'Month'}};
 assert.throws(()=>validateClassified(job),/official notice/);
 assert.throws(()=>validateClassified({...job,attributes:{...job.attributes,'Official notice URL':'javascript:alert(1)'}}),/HTTPS/);
 assert.equal(indiaTime('2026-10-20T10:00'),Date.parse('2026-10-20T04:30:00Z'));
 assert.equal(listingPrice({category_id:'jobs',price:0},String),'Salary not disclosed');
});
test('department migration is repeatable and preserves operator categories and existing ads',async()=>{
 const db=new PGlite();
 await db.exec("create schema private;create table public.categories(id text primary key,name text,theme text,fields jsonb,position int,active boolean);create table public.settings(id text primary key,value jsonb);create table public.sellers(id text primary key,name text,suspended boolean);create table public.listings(id text primary key,category_id text references public.categories(id),seller_id text,title text,description text,tags text,socials jsonb,attributes jsonb,status text);");
 await db.exec(readFileSync('database/migrations/005_categories.sql','utf8'));
 await db.exec(`update public.categories set subcategories=subcategories || '[{"id":"custom-space","name":"Custom space"}]'::jsonb,active=false where id='property';insert into public.listings(id,category_id,subcategory_id) values('existing','property','homes-for-sale')`);
 const sql=readFileSync('database/migrations/009_departments.sql','utf8');await db.exec(sql);await db.exec(sql);
 const {rows:[c]}=await db.query("select * from categories where id='property'");
 assert.equal(c.active,false);assert.ok(c.subcategories.some(s=>s.id==='custom-space'));assert.ok(c.subcategories.some(s=>s.id==='resorts'));assert.equal(new Set(c.subcategories.map(s=>s.id)).size,c.subcategories.length);
 assert.equal((await db.query("select category_id from listings where id='existing'")).rows[0].category_id,'property');
 await db.close();
});

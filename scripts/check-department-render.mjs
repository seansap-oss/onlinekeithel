import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import assert from 'node:assert/strict';
globalThis.location={pathname:'/homes',search:'',origin:'http://localhost:5189'};
globalThis.localStorage={getItem:()=>null};
globalThis.matchMedia=()=>({matches:false});
const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
try {
 const {App}=await vite.ssrLoadModule('/src/App.jsx');
 for(const [path,label] of [['/homes','Find your next home'],['/jobs','Find local jobs'],['/motors','Find your next ride'],['/whats-on','What’s on in Manipur'],['/recruiters','Meet local recruiters']]){
  location.pathname=path;
  const html=renderToStaticMarkup(React.createElement(App));
  assert.ok(html.includes(label),path);console.log('Rendered '+path);
 }
}finally{await vite.close();}
